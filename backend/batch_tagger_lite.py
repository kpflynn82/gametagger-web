#!/usr/bin/env python3
"""
Lightweight batch tagger using Claude Haiku for cost-effective mass tagging.
Designed to tag thousands of games at ~$0.003-0.005 per game.
"""
import argparse
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime
from typing import Optional

import anthropic
import asyncpg

# Database URL - use Railway PostgreSQL
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:FIigqZWDmubnfxmrlSKcFABwkvxQiEFF@nozomi.proxy.rlwy.net:28159/railway"
)

# Claude model selection
HAIKU_MODEL = "claude-3-5-haiku-20241022"
SONNET_MODEL = "claude-sonnet-4-20250514"

# VGMS Tag Schema
VGMS_PROMPT = """Classify this video game using the VGMS (Video Game Metadata Schema).

GAME: {game_name}

Return a JSON object with boolean tags (true/false) for each applicable category:

GAMEPLAY: gameplay_action, gameplay_adventure, gameplay_rpg, gameplay_strategy, gameplay_simulation, gameplay_sports, gameplay_platformer, gameplay_puzzle, gameplay_shooter, gameplay_stealth, gameplay_survival, gameplay_rhythm, gameplay_party, gameplay_roguelike, gameplay_fighting, gameplay_racing

NARRATIVE: narrative_horror, narrative_comedy, narrative_mystery, narrative_scifi, narrative_fantasy, narrative_historical, narrative_western

THEME: theme_war, theme_exploration, theme_survival, theme_crime, theme_family, theme_revenge, theme_coming_of_age, theme_politics, theme_environmental

SETTING: setting_fantasy, setting_scifi, setting_contemporary, setting_historical, setting_post_apocalyptic, setting_urban, setting_rural, setting_underwater, setting_space

MECHANIC: mechanic_leveling, mechanic_crafting, mechanic_farming, mechanic_building, mechanic_collection, mechanic_inventory, mechanic_permadeath, mechanic_time_management, mechanic_resource_management, mechanic_stealth, mechanic_parkour, mechanic_dialogue_choices, mechanic_moral_choices, mechanic_romance

VISUAL: visual_realistic, visual_stylized, visual_pixel_art, visual_minimalist, visual_hand_drawn

FEATURES: multiplayer, open_world, procedural, story_driven

ENGAGEMENT (mobile/live service): engagement_gacha, engagement_daily_rewards, engagement_energy_system, engagement_pvp, engagement_guild, engagement_events, engagement_battle_pass, engagement_auto_play

MONETIZATION: monetization_free_to_play, monetization_premium, monetization_subscription, monetization_iap

PROTAGONIST: protagonist_customizable, protagonist_predefined, protagonist_ensemble, protagonist_non_human

Also include:
- detected_game: The full official game name
- confidence: "high", "medium", or "low"
- primary_genre: Main genre (e.g., "Action RPG", "FPS", "Platformer")
- analysis_notes: Brief 1-sentence note

Return ONLY valid JSON, no markdown or extra text."""


async def tag_game_with_claude(
    client: anthropic.Anthropic,
    game_name: str,
    model: str = HAIKU_MODEL
) -> dict:
    """Tag a single game using Claude."""
    try:
        message = client.messages.create(
            model=model,
            max_tokens=1500,
            messages=[
                {"role": "user", "content": VGMS_PROMPT.format(game_name=game_name)}
            ]
        )

        # Parse response
        response_text = message.content[0].text.strip()

        # Clean up response if needed
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        result = json.loads(response_text)
        result["sources_used"] = ["claude_haiku" if "haiku" in model else "claude_sonnet"]
        return result

    except json.JSONDecodeError as e:
        return {"error": f"JSON parse error: {e}", "raw": response_text[:500]}
    except Exception as e:
        return {"error": str(e)}


async def save_to_database(conn: asyncpg.Connection, game_name: str, result: dict) -> bool:
    """Save tagged game to database."""
    if "error" in result:
        return False

    # Extract tags (boolean fields) - handle both flat and nested structures
    tags = {}
    metadata_fields = {"detected_game", "confidence", "primary_genre", "analysis_notes", "sources_used", "error", "raw"}

    for key, value in result.items():
        if key in metadata_fields:
            continue
        if isinstance(value, bool):
            tags[key] = value
        elif isinstance(value, dict):
            # Flatten nested tag categories (e.g., {"gameplay": {"gameplay_shooter": true}})
            for nested_key, nested_value in value.items():
                if isinstance(nested_value, bool):
                    tags[nested_key] = nested_value

    try:
        sources = result.get("sources_used", ["claude_haiku"])
        await conn.execute("""
            INSERT INTO analyses (
                job_id, game_name, detected_game, confidence, primary_genre,
                analysis_notes, tags, sources_used, source_data, processing_time_seconds, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11)
        """,
            str(uuid.uuid4()),
            game_name,
            result.get("detected_game", game_name),
            result.get("confidence", "medium"),
            result.get("primary_genre", "Unknown"),
            result.get("analysis_notes", ""),
            json.dumps(tags),
            json.dumps(sources),
            json.dumps({"tagger": "batch_lite"}),
            0.0,
            datetime.now(tz=None)
        )
        return True
    except Exception as e:
        print(f"    DB Error: {e}")
        return False


async def get_existing_games(conn: asyncpg.Connection) -> set:
    """Get set of game names already in database."""
    rows = await conn.fetch("SELECT LOWER(game_name) as name FROM analyses")
    return {row["name"] for row in rows}


async def batch_tag_games(
    games: list[str],
    model: str = HAIKU_MODEL,
    delay: float = 0.5,
    limit: int = 0,
    dry_run: bool = False
):
    """Batch tag a list of games."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set")
        return

    client = anthropic.Anthropic(api_key=api_key)

    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    existing = await get_existing_games(conn)

    # Filter out existing games
    to_process = [g for g in games if g.lower() not in existing]

    if limit > 0:
        to_process = to_process[:limit]

    print(f"Games to tag: {len(to_process)}")
    print(f"Already in DB: {len(games) - len(to_process)}")
    print(f"Model: {model}")
    print(f"Estimated cost: ${len(to_process) * 0.004:.2f}")
    print("-" * 50)

    if dry_run:
        print("DRY RUN - not actually tagging")
        for game in to_process[:20]:
            print(f"  Would tag: {game}")
        if len(to_process) > 20:
            print(f"  ... and {len(to_process) - 20} more")
        await conn.close()
        return

    success = 0
    errors = 0

    for i, game_name in enumerate(to_process):
        print(f"[{i+1}/{len(to_process)}] {game_name}...", end=" ", flush=True)

        start = datetime.now()
        result = await tag_game_with_claude(client, game_name, model)
        elapsed = (datetime.now() - start).total_seconds()

        if "error" in result:
            print(f"ERROR: {result['error'][:50]}")
            errors += 1
        else:
            saved = await save_to_database(conn, game_name, result)
            if saved:
                # Count tags from both flat and nested structures
                tag_count = 0
                for k, v in result.items():
                    if isinstance(v, bool) and v:
                        tag_count += 1
                    elif isinstance(v, dict):
                        tag_count += sum(1 for nv in v.values() if nv is True)
                print(f"OK ({tag_count} tags, {elapsed:.1f}s)")
                success += 1
            else:
                print("SAVE FAILED")
                errors += 1

        # Rate limiting
        if i < len(to_process) - 1:
            await asyncio.sleep(delay)

    await conn.close()

    print("\n" + "=" * 50)
    print(f"Complete! Success: {success}, Errors: {errors}")
    print(f"Estimated cost: ${success * 0.004:.2f}")


# Xbox Game Pass games (partial list - we'll expand this)
XBOX_GAME_PASS_SAMPLE = [
    "Starfield",
    "Forza Horizon 5",
    "Halo Infinite",
    "Sea of Thieves",
    "Minecraft",
    "Grounded",
    "Pentiment",
    "Hi-Fi Rush",
    "Redfall",
    "Age of Empires IV",
    "Flight Simulator 2020",
    "Psychonauts 2",
    "Ori and the Will of the Wisps",
    "Gears 5",
    "Forza Motorsport",
    "Lies of P",
    "Persona 5 Royal",
    "Hollow Knight",
    "Celeste",
    "Dead Cells",
    "Hades",
    "Stardew Valley",
    "Terraria",
    "Subnautica",
    "No Man's Sky",
    "Monster Hunter Rise",
    "Dragon Quest XI",
    "Yakuza: Like a Dragon",
    "Doom Eternal",
    "Wolfenstein II",
]


def main():
    parser = argparse.ArgumentParser(description="Lightweight batch game tagger")
    parser.add_argument("--model", choices=["haiku", "sonnet"], default="haiku",
                        help="Claude model to use (haiku is cheaper)")
    parser.add_argument("--limit", type=int, default=0,
                        help="Max games to process (0 = all)")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Delay between API calls in seconds")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be tagged without actually tagging")
    parser.add_argument("--file", type=str,
                        help="File with game names (one per line)")
    parser.add_argument("--sample", action="store_true",
                        help="Use built-in Xbox Game Pass sample list")

    args = parser.parse_args()

    # Get game list
    if args.file:
        with open(args.file, "r") as f:
            games = [line.strip() for line in f if line.strip()]
        print(f"Loaded {len(games)} games from {args.file}")
    elif args.sample:
        games = XBOX_GAME_PASS_SAMPLE
        print(f"Using sample Xbox Game Pass list ({len(games)} games)")
    else:
        print("Please specify --file or --sample")
        return

    model = HAIKU_MODEL if args.model == "haiku" else SONNET_MODEL

    asyncio.run(batch_tag_games(
        games,
        model=model,
        delay=args.delay,
        limit=args.limit,
        dry_run=args.dry_run
    ))


if __name__ == "__main__":
    main()
