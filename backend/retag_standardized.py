#!/usr/bin/env python3
"""
Re-tag all games with standardized taxonomy v2.0
Fixes inconsistencies and applies expanded schema.
"""
import asyncio
import json
import os
import sys
import time
import logging
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import asyncpg
import anthropic

# Setup logging
LOG_FILE = Path(__file__).parent / 'retag_log.txt'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Standardized Primary Genres (pick ONE)
STANDARDIZED_GENRES = [
    # Action
    "Action", "Action RPG", "Action Adventure", "First-Person Shooter",
    "Third-Person Shooter", "Shooter", "Bullet Hell", "Beat 'em Up",
    # RPG
    "JRPG", "Turn-Based RPG", "Tactical RPG", "Roguelike", "Roguelite",
    "Dungeon Crawler", "MMORPG",
    # Platformer
    "2D Platformer", "3D Platformer", "Metroidvania", "Precision Platformer",
    # Strategy
    "Real-Time Strategy", "Turn-Based Strategy", "Tower Defense",
    "4X Strategy", "Auto Battler", "Grand Strategy",
    # Simulation
    "Life Simulation", "Farm Simulation", "Business Simulation",
    "Racing Simulation", "Sports Simulation", "Flight Simulation",
    "City Builder", "Management Simulation",
    # Puzzle
    "Puzzle", "Puzzle Platformer", "Match-3", "Physics Puzzle", "Hidden Object",
    # Adventure
    "Adventure", "Narrative Adventure", "Point-and-Click", "Visual Novel",
    "Walking Simulator", "Interactive Fiction",
    # Fighting
    "2D Fighting", "3D Fighting", "Platform Fighter", "Arena Fighter",
    # Racing
    "Arcade Racing", "Kart Racing", "Rally Racing", "Racing",
    # Sports
    "Sports", "Extreme Sports", "Golf", "Football", "Basketball",
    # Horror
    "Survival Horror", "Psychological Horror", "Horror",
    # Card/Board
    "Card Game", "Deck Builder", "Board Game", "Digital TCG",
    # Other
    "Rhythm Game", "Party Game", "Battle Royale", "Sandbox",
    "Idle Game", "Educational", "Trivia", "Simulation",
]

# Standardized Tags Schema
STANDARDIZED_TAGS = """
## GAMEPLAY (prefix: gameplay_)
action, adventure, rpg, strategy, simulation, puzzle, platformer, shooter,
fighting, racing, sports, survival, stealth, rhythm, party, roguelike, card,
idle, metroidvania, souls_like, battle_royale, deck_builder, auto_battler,
bullet_hell, tower_defense, city_builder, farming, dating_sim, visual_novel,
point_and_click, walking_sim, extraction, moba, mmorpg, sandbox, educational

## MECHANIC (prefix: mechanic_)
leveling, skill_trees, crafting, building, collection, inventory, equipment,
upgrades, unlockables, real_time_combat, turn_based_combat, combo_system,
parry, dodge_roll, stamina, boss_battles, permadeath, respawn, parkour,
wall_jump, dash, grapple, gliding, swimming, climbing, teleport,
dialogue_choices, moral_choices, branching_narrative, romance, faction_system,
resource_management, time_management, economy, base_building, physics_puzzles,
pattern_matching, logic_puzzles, hidden_objects, co_op, pvp, guilds, trading,
leaderboards, procedural_generation, new_game_plus, photo_mode

## SETTING (prefix: setting_)
prehistoric, ancient, medieval, victorian, modern, near_future, far_future,
post_apocalyptic, urban, rural, wilderness, underwater, space, underground,
sky, fantasy, high_fantasy, dark_fantasy, sci_fi, cyberpunk, steampunk,
gothic, horror, western, pirate, samurai, mythology, realistic, stylized,
abstract, surreal, cartoon, anime

## THEME (prefix: theme_)
exploration, survival, war, revenge, redemption, coming_of_age, mystery,
horror, comedy, tragedy, romance, friendship, family, betrayal, sacrifice,
power, corruption, isolation, identity, freedom, destiny, good_vs_evil,
environmentalism, competition, heroism

## VISUAL (prefix: visual_)
realistic, stylized, pixel_art, voxel, low_poly, hand_drawn, cel_shaded,
watercolor, minimalist, anime, cartoon, comic_book, noir, neon, vibrant,
monochrome, first_person, third_person, top_down, isometric, side_scrolling

## NARRATIVE (prefix: narrative_)
fantasy, sci_fi, horror, comedy, drama, mystery, thriller, romance, tragedy,
historical, military, crime, western, superhero, slice_of_life, psychological,
dystopian

## ENGAGEMENT (prefix: engagement_)
pvp, pve, co_op, competitive, casual, hardcore, daily_rewards, battle_pass,
events, gacha, guilds, leaderboards, achievements, social

## MONETIZATION (prefix: monetization_)
free_to_play, premium, subscription, iap, dlc, season_pass, ad_supported

## PROTAGONIST (prefix: protagonist_)
customizable, predefined, silent, ensemble, non_human, child, villain, anti_hero

## OTHER
multiplayer, open_world, procedural, story_driven
"""

RETAG_PROMPT = """You are re-tagging a video game using a STANDARDIZED taxonomy to fix inconsistencies.

GAME: {game_name}

EXISTING CLASSIFICATION:
- Genre: {old_genre}
- Tags: {old_tags}

SIMILAR GAMES FOR REFERENCE:
{similar_games}

YOUR TASK:
1. Pick ONE primary genre from this EXACT list (use exact spelling):
{genres}

2. Apply STANDARDIZED tags using ONLY these prefixes and values:
{tag_schema}

3. Be CONSISTENT with similar games - if "Hollow Knight" is Metroidvania, similar games should be too.

Return JSON with:
{{
    "primary_genre": "<exact genre from list>",
    "confidence": "high|medium|low",
    "gameplay_action": true/false,
    "gameplay_adventure": true/false,
    "gameplay_rpg": true/false,
    "gameplay_platformer": true/false,
    "gameplay_metroidvania": true/false,
    "gameplay_souls_like": true/false,
    "gameplay_roguelike": true/false,
    ... (all applicable tags)
    "multiplayer": true/false,
    "open_world": true/false,
    "story_driven": true/false,
    "analysis_notes": "<brief reasoning>"
}}

IMPORTANT: Use ONLY tags from the schema above. Do not invent new tags.
Return ONLY valid JSON, no other text.
"""


async def get_similar_games(conn, game_name: str, genre: str) -> list:
    """Find similar games for context."""
    # Get games with similar genre or name patterns
    similar = await conn.fetch("""
        SELECT game_name, primary_genre, tags::text as tags
        FROM analyses
        WHERE (primary_genre ILIKE $1 OR game_name ILIKE $2)
          AND game_name != $3
        ORDER BY created_at DESC
        LIMIT 5
    """, f"%{genre.split()[0]}%", f"%{game_name.split()[0]}%", game_name)

    results = []
    for g in similar:
        tags = json.loads(g['tags']) if g['tags'] else {}
        true_tags = [k for k, v in tags.items() if v == True][:5]
        results.append(f"- {g['game_name']} ({g['primary_genre']}): {', '.join(true_tags)}")

    return results


async def retag_game(client, game_name: str, old_genre: str, old_tags: dict, similar: list) -> dict:
    """Re-tag a single game with standardized taxonomy."""

    # Format old tags
    old_tags_str = ", ".join([k for k, v in old_tags.items() if v == True][:15])
    similar_str = "\n".join(similar) if similar else "No similar games found"
    genres_str = ", ".join(STANDARDIZED_GENRES)

    prompt = RETAG_PROMPT.format(
        game_name=game_name,
        old_genre=old_genre,
        old_tags=old_tags_str,
        similar_games=similar_str,
        genres=genres_str,
        tag_schema=STANDARDIZED_TAGS
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = response.content[0].text

    # Extract JSON
    import re
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    if json_match:
        return json.loads(json_match.group())

    return None


async def update_game(conn, game_id: int, result: dict):
    """Update game with new standardized tags."""
    # Extract tags (all boolean fields)
    tags = {}
    for key, value in result.items():
        if isinstance(value, bool):
            tags[key] = value

    await conn.execute("""
        UPDATE analyses
        SET primary_genre = $1,
            tags = $2::jsonb,
            analysis_notes = $3,
            confidence = $4
        WHERE id = $5
    """,
        result.get('primary_genre', ''),
        json.dumps(tags),
        result.get('analysis_notes', ''),
        result.get('confidence', 'medium'),
        game_id
    )


async def main():
    """Main re-tagging function."""
    start_time = time.time()

    logger.info("=" * 60)
    logger.info("RE-TAGGING WITH STANDARDIZED TAXONOMY v2.0")
    logger.info("=" * 60)

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    database_url = os.environ.get('DATABASE_URL')

    if not api_key or not database_url:
        logger.error("Set ANTHROPIC_API_KEY and DATABASE_URL")
        sys.exit(1)

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Initialize Claude client
    client = anthropic.Anthropic(api_key=api_key)

    # Connect to database
    logger.info("Connecting to database...")
    conn = await asyncpg.connect(database_url)

    # Get all games
    games = await conn.fetch("""
        SELECT id, game_name, primary_genre, tags::text as tags
        FROM analyses
        ORDER BY id
    """)

    total = len(games)
    logger.info(f"Found {total} games to re-tag")

    success_count = 0
    error_count = 0

    for i, game in enumerate(games):
        game_id = game['id']
        game_name = game['game_name']
        old_genre = game['primary_genre'] or ''
        old_tags = json.loads(game['tags']) if game['tags'] else {}

        progress = f"[{i+1}/{total}]"
        logger.info(f"{progress} Re-tagging: {game_name}")

        try:
            # Get similar games
            similar = await get_similar_games(conn, game_name, old_genre)

            # Re-tag with Claude
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: asyncio.run(retag_game(client, game_name, old_genre, old_tags, similar))
            )

            if result is None:
                # Sync call workaround
                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2000,
                    messages=[{"role": "user", "content": RETAG_PROMPT.format(
                        game_name=game_name,
                        old_genre=old_genre,
                        old_tags=", ".join([k for k, v in old_tags.items() if v == True][:15]),
                        similar_games="\n".join(similar) if similar else "None",
                        genres=", ".join(STANDARDIZED_GENRES),
                        tag_schema=STANDARDIZED_TAGS
                    )}]
                )
                import re
                json_match = re.search(r'\{[\s\S]*\}', response.content[0].text)
                if json_match:
                    result = json.loads(json_match.group())

            if result:
                await update_game(conn, game_id, result)
                new_genre = result.get('primary_genre', 'Unknown')
                logger.info(f"{progress} SUCCESS: {old_genre} -> {new_genre}")
                success_count += 1
            else:
                logger.warning(f"{progress} SKIP: Could not parse response")
                error_count += 1

            # Rate limit
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"{progress} ERROR: {e}")
            error_count += 1
            await asyncio.sleep(1)

        # Progress update every 50 games
        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed * 60
            remaining = (total - i - 1) / rate if rate > 0 else 0
            logger.info(f"--- PROGRESS: {i+1}/{total}, {success_count} success, {error_count} errors ---")
            logger.info(f"--- Rate: {rate:.1f} games/min, ETA: {remaining:.0f} min ---")

    await conn.close()

    total_time = time.time() - start_time
    logger.info("=" * 60)
    logger.info("RE-TAGGING COMPLETE")
    logger.info(f"  Total: {total}")
    logger.info(f"  Success: {success_count}")
    logger.info(f"  Errors: {error_count}")
    logger.info(f"  Time: {total_time/60:.1f} minutes")
    logger.info("=" * 60)


if __name__ == '__main__':
    asyncio.run(main())
