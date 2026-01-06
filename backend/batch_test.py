#!/usr/bin/env python3
"""Test batch import with just 3 games."""
import asyncio
import json
import os
import sys
import uuid
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import asyncpg
from app.services.tagger import AsyncGameTagger

# Test with these 3 games
TEST_GAMES = [
    "Dark Souls III",
    "Rocket League",
    "Fortnite"
]

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
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    database_url = os.environ.get('DATABASE_URL')

    if not api_key or not database_url:
        print("ERROR: Set ANTHROPIC_API_KEY and DATABASE_URL")
        sys.exit(1)

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    print("Connecting to database...")
    conn = await asyncpg.connect(database_url)

    # Check existing
    existing = await conn.fetch("SELECT LOWER(game_name) as name FROM analyses")
    existing_set = {r['name'] for r in existing}

    # Filter test games to only those not in DB
    games_to_tag = [g for g in TEST_GAMES if g.lower() not in existing_set]

    if not games_to_tag:
        print("All test games already in database!")
        await conn.close()
        return

    print(f"Will tag {len(games_to_tag)} games: {games_to_tag}")

    tagger = AsyncGameTagger(api_key)

    for game_name in games_to_tag:
        print(f"\n>>> Tagging: {game_name}")
        start = time.time()

        result = await tagger.tag_game(
            game_name,
            sources=['steam', 'xbox'],
            progress_callback=None
        )

        elapsed = time.time() - start

        if 'error' in result:
            print(f"  ERROR: {result['error']}")
            continue

        job_id = await insert_analysis(conn, game_name, result, elapsed)

        print(f"  Confidence: {result.get('confidence')}")
        print(f"  Genre: {result.get('primary_genre')}")
        print(f"  Sources: {result.get('sources_used')}")
        print(f"  Time: {elapsed:.1f}s")
        print(f"  Job ID: {job_id}")

        await asyncio.sleep(1)

    await conn.close()
    print("\nDone!")

if __name__ == '__main__':
    asyncio.run(main())
