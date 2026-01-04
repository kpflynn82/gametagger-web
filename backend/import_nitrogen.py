#!/usr/bin/env python3
"""Import nitrogen dataset games into the database."""
import csv
import uuid
import asyncio
from datetime import datetime
from sqlalchemy import select
from app.database import async_session_maker, init_db
from app.models import Analysis

NITROGEN_CSV = "/Users/kpflynn/nitrogen_dataset/nitrogen_vgms_categorized.csv"

# Map gameplay tags to genres
GENRE_MAP = {
    'gameplay_action': 'Action',
    'gameplay_adventure': 'Adventure',
    'gameplay_rpg': 'RPG',
    'gameplay_strategy': 'Strategy',
    'gameplay_simulation': 'Simulation',
    'gameplay_sports': 'Sports',
    'gameplay_platformer': 'Platformer',
    'gameplay_puzzle': 'Puzzle',
    'gameplay_shooter': 'Shooter',
    'gameplay_stealth': 'Stealth',
    'gameplay_survival': 'Survival',
    'gameplay_rhythm': 'Rhythm',
    'gameplay_party': 'Party',
    'gameplay_roguelike': 'Roguelike',
}


def infer_genre(tags: dict) -> str:
    """Infer primary genre from gameplay tags."""
    for tag, genre in GENRE_MAP.items():
        if tags.get(tag, False):
            return genre
    return "Unknown"


def format_game_name(name: str) -> str:
    """Format game name from CSV format to display format."""
    # Replace underscores with spaces and title case
    return name.replace('_', ' ').title()


async def import_nitrogen_data():
    """Import all nitrogen games into the database."""
    await init_db()

    # Read CSV
    with open(NITROGEN_CSV, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Found {len(rows)} games in nitrogen dataset")

    async with async_session_maker() as session:
        # Check existing games by name (simpler, works with both SQLite and PostgreSQL)
        existing_query = select(Analysis.game_name)
        existing_result = await session.execute(existing_query)
        existing_names = {name.lower() for (name,) in existing_result.all()}

        imported = 0
        skipped = 0

        for row in rows:
            game_name = format_game_name(row['game_name'])

            # Skip if already imported
            if game_name.lower() in existing_names:
                skipped += 1
                continue

            # Build tags dict - convert string "True"/"False" to boolean
            tags = {}
            for key, value in row.items():
                if key != 'game_name':
                    tags[key] = value == 'True'

            # Count nitrogen tags for interest
            engagement_count = sum(1 for k, v in tags.items() if k.startswith('engagement_') and v)
            monetization_count = sum(1 for k, v in tags.items() if k.startswith('monetization_') and v)
            protagonist_count = sum(1 for k, v in tags.items() if k.startswith('protagonist_') and v)
            total_tags = sum(1 for v in tags.values() if v)

            # Only import games that have at least some tags
            if total_tags == 0:
                skipped += 1
                continue

            # Create analysis
            analysis = Analysis(
                job_id=str(uuid.uuid4()),
                game_name=game_name,
                detected_game=game_name,
                confidence="high",
                primary_genre=infer_genre(tags),
                analysis_notes=f"Imported from Nitrogen dataset. E:{engagement_count} M:{monetization_count} P:{protagonist_count}",
                tags=tags,
                sources_used=["nitrogen"],
                source_data={"source": "nitrogen_dataset", "original_name": row['game_name']},
                processing_time_seconds=0.0
            )

            session.add(analysis)
            imported += 1

            if imported % 100 == 0:
                print(f"  Imported {imported} games...")

        await session.commit()

    print(f"\nImport complete!")
    print(f"  Imported: {imported}")
    print(f"  Skipped: {skipped} (no tags or already exists)")


if __name__ == "__main__":
    asyncio.run(import_nitrogen_data())
