#!/usr/bin/env python3
"""Batch import and tag games from Nitrogen database."""
import asyncio
import csv
import json
import os
import sys
import uuid
import time
from datetime import datetime
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

import asyncpg
from app.services.tagger import AsyncGameTagger

# Nitrogen game names to exclude (not real games)
EXCLUDED_NAMES = {
    'other',
    'retro',
    'inscreva-se_no_canal_',
    'deixa_o_like_e_inscreva-se_no_canal_',
}


def clean_game_name(raw_name: str) -> str:
    """Convert nitrogen game name to proper title.

    e.g. 'dark_souls_iii' -> 'Dark Souls III'
    """
    # Replace underscores with spaces
    name = raw_name.replace('_', ' ')

    # Handle Roman numerals and common suffixes
    words = name.split()
    cleaned = []
    for word in words:
        # Check if it's a roman numeral
        if word.upper() in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']:
            cleaned.append(word.upper())
        # Check if it's an acronym/abbreviation
        elif word.upper() in ['DLC', 'HD', 'VR', 'RPG', 'MMO', 'FPS', 'EA', 'FC', 'SSX']:
            cleaned.append(word.upper())
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
    # Get API key and database URL from environment
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    database_url = os.environ.get('DATABASE_URL')

    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set")
        print("Usage: ANTHROPIC_API_KEY=sk-... DATABASE_URL=postgresql://... python batch_import_nitrogen.py")
        sys.exit(1)

    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    # Convert postgres:// to postgresql:// for asyncpg
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Read nitrogen games
    csv_path = Path(__file__).parent.parent.parent / 'nitrogen_game_counts.csv'
    if not csv_path.exists():
        print(f"ERROR: Cannot find {csv_path}")
        sys.exit(1)

    games = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_name = row['game']
            if raw_name.lower() not in EXCLUDED_NAMES:
                games.append({
                    'raw': raw_name,
                    'clean': clean_game_name(raw_name),
                    'count': int(row['count'])
                })

    print(f"Found {len(games)} games in Nitrogen database")

    # Connect to database
    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    # Get existing games
    existing = await get_existing_games(conn)
    print(f"Found {len(existing)} games already in database")

    # Filter to only new games
    new_games = [g for g in games if g['clean'].lower() not in existing]
    print(f"{len(new_games)} new games to import")

    if not new_games:
        print("No new games to import!")
        await conn.close()
        return

    # Initialize tagger
    tagger = AsyncGameTagger(api_key)

    # Process games
    success_count = 0
    error_count = 0

    for i, game in enumerate(new_games):
        game_name = game['clean']
        print(f"\n[{i+1}/{len(new_games)}] Tagging: {game_name}")

        start_time = time.time()

        try:
            # Use just Steam for speed (skip YouTube which is slow)
            result = await tagger.tag_game(
                game_name,
                sources=['steam', 'xbox'],
                progress_callback=None
            )

            processing_time = time.time() - start_time

            if 'error' in result:
                print(f"  ERROR: {result['error']}")
                error_count += 1
                continue

            # Insert into database
            job_id = await insert_analysis(conn, game_name, result, processing_time)

            confidence = result.get('confidence', 'unknown')
            genre = result.get('primary_genre', 'unknown')
            sources = result.get('sources_used', [])

            print(f"  SUCCESS: {confidence} confidence, {genre}")
            print(f"  Sources: {', '.join(sources)}")
            print(f"  Time: {processing_time:.1f}s")

            success_count += 1

            # Rate limit - wait between requests
            await asyncio.sleep(1)

        except Exception as e:
            print(f"  ERROR: {e}")
            error_count += 1
            continue

    await conn.close()

    print(f"\n{'='*50}")
    print(f"BATCH IMPORT COMPLETE")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total: {len(new_games)}")


if __name__ == '__main__':
    asyncio.run(main())
