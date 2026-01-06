#!/usr/bin/env python3
"""
Full batch import of all Nitrogen database games.
Runs autonomously and logs all progress to a file.
"""
import asyncio
import json
import os
import sys
import uuid
import time
import logging
from datetime import datetime
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

import asyncpg
from app.services.tagger import AsyncGameTagger

# Setup logging to both file and console
LOG_FILE = Path(__file__).parent / 'import_log.txt'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Full nitrogen dataset path
NITROGEN_GAMES_FILE = Path('/Users/kpflynn/nitrogen_dataset/nitrogen_unique_games.txt')

# Names to exclude (not real games, non-English, fragments)
EXCLUDED_PATTERNS = {
    'other', 'retro', 'inscreva', 'deixa', 'capitulos', 'мария',
    'checkpoint', 'practice', 'speedrun', 'try_', '_try', 'attempt',
    'pb_', '_pb', 'wr_', '_wr', 'any%', '100%', 'glitchless',
}


def should_exclude(name: str) -> bool:
    """Check if game name should be excluded."""
    name_lower = name.lower()
    # Exclude if matches any pattern
    for pattern in EXCLUDED_PATTERNS:
        if pattern in name_lower:
            return True
    # Exclude very short names
    if len(name.replace('_', '')) < 3:
        return True
    # Exclude names that are just numbers
    if name.replace('_', '').replace('-', '').isdigit():
        return True
    return False


def clean_game_name(raw_name: str) -> str:
    """Convert nitrogen game name to proper title."""
    # Remove leading/trailing underscores
    name = raw_name.strip('_')
    # Replace underscores with spaces
    name = name.replace('_', ' ')

    # Handle Roman numerals and common suffixes
    words = name.split()
    cleaned = []
    for word in words:
        upper = word.upper()
        # Roman numerals
        if upper in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']:
            cleaned.append(upper)
        # Acronyms
        elif upper in ['DLC', 'HD', 'VR', 'RPG', 'MMO', 'FPS', 'EA', 'FC', 'SSX', 'GTA', 'NBA', 'NFL', 'FIFA', 'WWE', 'UFC', 'NES', 'SNES', 'PS', 'PC', 'AI', 'VR', 'AR', 'DX', 'GT', 'FF', 'RE', 'DMC', 'MGS']:
            cleaned.append(upper)
        else:
            cleaned.append(word.title())

    return ' '.join(cleaned)


async def get_existing_games(conn) -> set:
    """Get set of game names already in database."""
    rows = await conn.fetch("SELECT LOWER(game_name) as name FROM analyses")
    return {row['name'] for row in rows}


async def insert_analysis(conn, game_name: str, result: dict, processing_time: float):
    """Insert analysis result into database."""
    job_id = str(uuid.uuid4())

    # Extract tags (all boolean fields)
    tags = {}
    for key, value in result.items():
        if isinstance(value, bool):
            tags[key] = value

    await conn.execute("""
        INSERT INTO analyses (
            job_id, game_name, detected_game, confidence, primary_genre,
            analysis_notes, tags, sources_used, source_data,
            created_at, processing_time_seconds
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)
    """,
        job_id,
        game_name,
        result.get('detected_game', game_name),
        result.get('confidence', 'medium'),
        result.get('primary_genre', ''),
        result.get('analysis_notes', ''),
        json.dumps(tags),
        json.dumps(result.get('sources_used', [])),
        json.dumps(result.get('source_data', {})),
        datetime.utcnow(),
        processing_time
    )
    return job_id


async def main():
    """Main batch import function."""
    start_time = time.time()

    logger.info("=" * 60)
    logger.info("FULL NITROGEN DATABASE IMPORT")
    logger.info("=" * 60)

    # Get credentials from environment
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    database_url = os.environ.get('DATABASE_URL')

    if not api_key:
        logger.error("ANTHROPIC_API_KEY not set")
        sys.exit(1)
    if not database_url:
        logger.error("DATABASE_URL not set")
        sys.exit(1)

    # Convert postgres:// to postgresql:// for asyncpg
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Read all nitrogen games
    if not NITROGEN_GAMES_FILE.exists():
        logger.error(f"Nitrogen games file not found: {NITROGEN_GAMES_FILE}")
        sys.exit(1)

    with open(NITROGEN_GAMES_FILE, 'r') as f:
        raw_games = [line.strip() for line in f if line.strip()]

    logger.info(f"Found {len(raw_games)} total games in Nitrogen database")

    # Clean and filter games
    games = []
    for raw in raw_games:
        if not should_exclude(raw):
            games.append({
                'raw': raw,
                'clean': clean_game_name(raw)
            })

    logger.info(f"After filtering: {len(games)} valid games")

    # Connect to database
    logger.info("Connecting to database...")
    conn = await asyncpg.connect(database_url)

    # Get existing games
    existing = await get_existing_games(conn)
    logger.info(f"Found {len(existing)} games already in database")

    # Filter to only new games
    new_games = [g for g in games if g['clean'].lower() not in existing]
    logger.info(f"New games to import: {len(new_games)}")

    if not new_games:
        logger.info("No new games to import!")
        await conn.close()
        return

    # Initialize tagger
    tagger = AsyncGameTagger(api_key)

    # Process games
    success_count = 0
    error_count = 0
    total = len(new_games)

    for i, game in enumerate(new_games):
        game_name = game['clean']
        progress = f"[{i+1}/{total}]"

        logger.info(f"{progress} Tagging: {game_name}")

        start = time.time()

        try:
            # Use Steam and Xbox sources (skip YouTube - too slow)
            result = await tagger.tag_game(
                game_name,
                sources=['steam', 'xbox'],
                progress_callback=None
            )

            elapsed = time.time() - start

            if 'error' in result:
                logger.warning(f"{progress} ERROR: {result['error']}")
                error_count += 1
                continue

            # Insert into database
            await insert_analysis(conn, game_name, result, elapsed)

            confidence = result.get('confidence', 'unknown')
            genre = result.get('primary_genre', 'unknown')
            sources = ', '.join(result.get('sources_used', []))

            logger.info(f"{progress} SUCCESS: {confidence} - {genre} ({sources}) [{elapsed:.1f}s]")
            success_count += 1

            # Brief pause between requests
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"{progress} EXCEPTION: {type(e).__name__}: {e}")
            error_count += 1
            # Continue even on errors
            await asyncio.sleep(1)
            continue

        # Log progress every 50 games
        if (i + 1) % 50 == 0:
            elapsed_total = time.time() - start_time
            rate = (i + 1) / elapsed_total * 60
            remaining = (total - i - 1) / rate if rate > 0 else 0
            logger.info(f"--- PROGRESS: {i+1}/{total} done, {success_count} success, {error_count} errors ---")
            logger.info(f"--- Rate: {rate:.1f} games/min, ETA: {remaining:.0f} min ---")

    await conn.close()

    # Final summary
    total_time = time.time() - start_time
    logger.info("=" * 60)
    logger.info("IMPORT COMPLETE")
    logger.info(f"  Total processed: {total}")
    logger.info(f"  Successful: {success_count}")
    logger.info(f"  Errors: {error_count}")
    logger.info(f"  Success rate: {success_count/total*100:.1f}%")
    logger.info(f"  Total time: {total_time/60:.1f} minutes")
    logger.info(f"  Average rate: {total/total_time*60:.1f} games/min")
    logger.info("=" * 60)


if __name__ == '__main__':
    asyncio.run(main())
