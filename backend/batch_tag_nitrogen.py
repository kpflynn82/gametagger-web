#!/usr/bin/env python3
"""Batch tag untagged games from the nitrogen dataset."""
import argparse
import asyncio
import csv
import uuid
import os
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.database import async_session_maker, init_db
from app.models import Analysis
from app.config import get_settings
from app.services.tagger import AsyncGameTagger

NITROGEN_CSV = "/Users/kpflynn/nitrogen_dataset/nitrogen_vgms_categorized.csv"


def format_game_name(name: str) -> str:
    """Format game name from CSV format to display format."""
    return name.replace('_', ' ').title()


def get_untagged_games() -> list[str]:
    """Get list of games with no tags in the nitrogen CSV."""
    untagged = []

    with open(NITROGEN_CSV, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Check if game has any tags
            has_tags = False
            for key, value in row.items():
                if key != 'game_name' and value == 'True':
                    has_tags = True
                    break

            if not has_tags:
                untagged.append(format_game_name(row['game_name']))

    return untagged


async def get_existing_games(session) -> set[str]:
    """Get set of game names already in database."""
    query = select(Analysis.game_name)
    result = await session.execute(query)
    return {name.lower() for name, in result.all()}


async def tag_game_batch(
    games: list[str],
    limit: int = 10,
    delay: float = 2.0,
    sources: list[str] = None
):
    """Tag a batch of games."""
    settings = get_settings()

    if not settings.anthropic_api_key:
        print("ERROR: ANTHROPIC_API_KEY not set in .env")
        return

    if sources is None:
        sources = ['steam', 'youtube']  # Skip xbox by default (often fails)

    await init_db()
    tagger = AsyncGameTagger(settings.anthropic_api_key)

    async with async_session_maker() as session:
        existing = await get_existing_games(session)

        # Filter out existing games
        to_process = [g for g in games if g.lower() not in existing]

        if limit > 0:
            to_process = to_process[:limit]

        print(f"Games to tag: {len(to_process)} (skipping {len(games) - len(to_process)} already in DB)")
        print(f"Sources: {sources}")
        print(f"Delay between games: {delay}s")
        print("-" * 50)

        success_count = 0
        error_count = 0

        for i, game_name in enumerate(to_process):
            print(f"\n[{i+1}/{len(to_process)}] Tagging: {game_name}")

            try:
                # Progress callback
                async def progress(source, status):
                    print(f"  {source}: {status}")

                # Tag the game
                start_time = datetime.now()
                result = await tagger.tag_game(game_name, sources=sources, progress_callback=progress)
                elapsed = (datetime.now() - start_time).total_seconds()

                if 'error' in result:
                    print(f"  ERROR: {result['error']}")
                    error_count += 1
                    continue

                # Build tags dict
                tags = {}
                for key, value in result.items():
                    if key.startswith(('gameplay_', 'narrative_', 'theme_', 'setting_',
                                       'mechanic_', 'visual_', 'engagement_', 'monetization_',
                                       'protagonist_')) or key in ('multiplayer', 'open_world',
                                                                    'procedural', 'story_driven'):
                        tags[key] = bool(value)

                # Count tags
                tag_count = sum(1 for v in tags.values() if v)
                engagement_count = sum(1 for k, v in tags.items() if k.startswith('engagement_') and v)
                monetization_count = sum(1 for k, v in tags.items() if k.startswith('monetization_') and v)
                protagonist_count = sum(1 for k, v in tags.items() if k.startswith('protagonist_') and v)

                # Create analysis record
                analysis = Analysis(
                    job_id=str(uuid.uuid4()),
                    game_name=game_name,
                    detected_game=result.get('detected_game', game_name),
                    confidence=result.get('confidence', 'medium'),
                    primary_genre=result.get('primary_genre', 'Unknown'),
                    analysis_notes=result.get('analysis_notes', ''),
                    tags=tags,
                    sources_used=result.get('sources_used', sources),
                    source_data=result.get('source_data', {}),
                    processing_time_seconds=elapsed
                )

                session.add(analysis)
                await session.commit()

                success_count += 1
                print(f"  SUCCESS: {tag_count} tags (E:{engagement_count} M:{monetization_count} P:{protagonist_count}) in {elapsed:.1f}s")

            except Exception as e:
                print(f"  EXCEPTION: {str(e)}")
                error_count += 1
                await session.rollback()

            # Rate limiting delay
            if i < len(to_process) - 1:
                await asyncio.sleep(delay)

        print("\n" + "=" * 50)
        print(f"Batch complete!")
        print(f"  Success: {success_count}")
        print(f"  Errors: {error_count}")


def main():
    parser = argparse.ArgumentParser(description='Batch tag nitrogen games')
    parser.add_argument('--limit', type=int, default=10,
                        help='Max games to process (0 = all)')
    parser.add_argument('--delay', type=float, default=2.0,
                        help='Delay between games in seconds')
    parser.add_argument('--sources', type=str, default='steam,youtube',
                        help='Comma-separated sources to use')
    parser.add_argument('--list', action='store_true',
                        help='Just list untagged games, don\'t tag')

    args = parser.parse_args()

    # Get untagged games
    untagged = get_untagged_games()
    print(f"Found {len(untagged)} untagged games in nitrogen dataset")

    if args.list:
        for game in untagged[:50]:
            print(f"  - {game}")
        if len(untagged) > 50:
            print(f"  ... and {len(untagged) - 50} more")
        return

    sources = [s.strip() for s in args.sources.split(',')]

    asyncio.run(tag_game_batch(
        untagged,
        limit=args.limit,
        delay=args.delay,
        sources=sources
    ))


if __name__ == "__main__":
    main()
