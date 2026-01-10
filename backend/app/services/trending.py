"""
Trending games and genres service using Steam player count data.
Fetches top games from SteamSpy and aggregates by genre.
"""
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Cache for trending data
_cache: dict = {
    "data": None,
    "updated_at": None,
    "expires_at": None
}

CACHE_DURATION_MINUTES = 30

# SteamSpy API (no auth required)
STEAMSPY_TOP100_URL = "https://steamspy.com/api.php?request=top100in2weeks"
STEAMSPY_GAME_URL = "https://steamspy.com/api.php?request=appdetails&appid={app_id}"

# Steam Web API for real-time player counts (optional, needs key)
STEAM_PLAYER_COUNT_URL = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}"


# Genre mapping from Steam tags to our simplified genres
GENRE_MAPPING = {
    # Action
    "Action": "Action",
    "Action-Adventure": "Action Adventure",
    "Hack and Slash": "Action",
    "Beat 'em up": "Action",

    # RPG
    "RPG": "RPG",
    "Action RPG": "Action RPG",
    "JRPG": "JRPG",
    "CRPG": "RPG",
    "Turn-Based RPG": "Turn-Based RPG",

    # Shooter
    "FPS": "FPS",
    "Shooter": "Shooter",
    "Third-Person Shooter": "Third-Person Shooter",
    "Hero Shooter": "Hero Shooter",

    # Strategy
    "Strategy": "Strategy",
    "Real Time Tactics": "RTS",
    "RTS": "RTS",
    "Turn-Based Strategy": "Turn-Based Strategy",
    "4X": "4X Strategy",
    "City Builder": "City Builder",

    # Simulation
    "Simulation": "Simulation",
    "Life Sim": "Life Sim",
    "Farming Sim": "Farming Sim",
    "Vehicle Simulation": "Vehicle Sim",

    # Sports/Racing
    "Sports": "Sports",
    "Racing": "Racing",
    "Soccer": "Sports",
    "Basketball": "Sports",

    # Adventure
    "Adventure": "Adventure",
    "Point & Click": "Adventure",
    "Visual Novel": "Visual Novel",
    "Interactive Fiction": "Interactive Fiction",

    # Horror
    "Horror": "Horror",
    "Survival Horror": "Survival Horror",

    # Other
    "Puzzle": "Puzzle",
    "Platformer": "Platformer",
    "Fighting": "Fighting",
    "Roguelike": "Roguelike",
    "Roguelite": "Roguelite",
    "Sandbox": "Sandbox",
    "Survival": "Survival",
    "Battle Royale": "Battle Royale",
    "MOBA": "MOBA",
    "Card Game": "Card Game",
    "Indie": "Indie",
    "Casual": "Casual",
    "MMO": "MMO",
    "MMORPG": "MMORPG",
    "Open World": "Open World",
    "Multiplayer": "Multiplayer",
    "Co-op": "Co-op",
}


async def fetch_game_details(client: httpx.AsyncClient, app_id: str) -> dict:
    """Fetch individual game details including tags."""
    try:
        url = STEAMSPY_GAME_URL.format(app_id=app_id)
        response = await client.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.debug(f"Failed to fetch details for {app_id}: {e}")
    return {}


async def fetch_steamspy_top100() -> list[dict]:
    """Fetch top 100 games from SteamSpy with tags for top games."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(STEAMSPY_TOP100_URL)
            response.raise_for_status()
            data = response.json()

            # SteamSpy returns dict with app_id as keys
            games = []
            for app_id, game_data in data.items():
                games.append({
                    "app_id": app_id,
                    "name": game_data.get("name", "Unknown"),
                    "players": game_data.get("ccu", 0),  # concurrent users
                    "owners": game_data.get("owners", "0"),
                    "tags": game_data.get("tags", {}),
                })

            # Sort by player count
            games.sort(key=lambda x: x["players"], reverse=True)

            # Fetch detailed tags for top 20 games (top100 endpoint doesn't include tags)
            # Rate limit: add small delays between requests
            logger.info("Fetching detailed tags for top 20 games...")
            for i, game in enumerate(games[:20]):
                if not game["tags"]:  # Only fetch if tags are missing
                    details = await fetch_game_details(client, game["app_id"])
                    if details.get("tags"):
                        game["tags"] = details["tags"]
                    # Small delay to avoid rate limiting
                    if i < 19:
                        await asyncio.sleep(0.2)

            return games

    except Exception as e:
        logger.error(f"Failed to fetch SteamSpy data: {e}")
        return []


def extract_primary_genre(tags: dict) -> str:
    """Extract primary genre from Steam tags."""
    if not tags:
        return "Other"

    # Tags come as {"tag_name": count} - sort by count
    sorted_tags = sorted(tags.items(), key=lambda x: x[1], reverse=True)

    # Find first tag that maps to a genre
    for tag_name, _ in sorted_tags:
        if tag_name in GENRE_MAPPING:
            return GENRE_MAPPING[tag_name]

    return "Other"


def aggregate_by_genre(games: list[dict]) -> list[dict]:
    """Aggregate player counts by genre."""
    genre_stats: dict = {}

    for game in games:
        genre = extract_primary_genre(game.get("tags", {}))

        if genre not in genre_stats:
            genre_stats[genre] = {
                "genre": genre,
                "players": 0,
                "game_count": 0,
                "top_game": None,
            }

        genre_stats[genre]["players"] += game.get("players", 0)
        genre_stats[genre]["game_count"] += 1

        # Track top game in genre
        if genre_stats[genre]["top_game"] is None:
            genre_stats[genre]["top_game"] = game["name"]

    # Convert to list and sort by player count
    result = list(genre_stats.values())
    result.sort(key=lambda x: x["players"], reverse=True)

    return result


async def get_trending_data(db_conn=None) -> dict:
    """
    Get trending games and genres data.
    Uses cache to avoid hammering Steam APIs.
    """
    global _cache

    # Check cache
    now = datetime.now()
    if _cache["data"] and _cache["expires_at"] and now < _cache["expires_at"]:
        return _cache["data"]

    # Fetch fresh data
    logger.info("Fetching fresh trending data from SteamSpy...")
    games = await fetch_steamspy_top100()

    if not games:
        # Return cached data if fetch fails, or empty response
        if _cache["data"]:
            return _cache["data"]
        return {
            "hot_genres": [],
            "trending_games": [],
            "updated_at": now.isoformat(),
            "error": "Failed to fetch Steam data"
        }

    # Aggregate by genre
    hot_genres = aggregate_by_genre(games)[:10]  # Top 10 genres

    # Get games already in our database (if connection provided)
    games_in_db = set()
    if db_conn:
        try:
            rows = await db_conn.fetch("SELECT LOWER(game_name) as name FROM analyses")
            games_in_db = {row["name"].lower() for row in rows}
        except Exception as e:
            logger.error(f"Failed to fetch games from DB: {e}")

    # Format trending games
    trending_games = []
    for game in games[:15]:  # Top 15 games
        genre = extract_primary_genre(game.get("tags", {}))
        trending_games.append({
            "name": game["name"],
            "app_id": game["app_id"],
            "players": game["players"],
            "genre": genre,
            "in_database": game["name"].lower() in games_in_db
        })

    result = {
        "hot_genres": hot_genres,
        "trending_games": trending_games,
        "updated_at": now.isoformat(),
        "total_players": sum(g["players"] for g in games),
        "games_fetched": len(games)
    }

    # Update cache
    _cache = {
        "data": result,
        "updated_at": now,
        "expires_at": now + timedelta(minutes=CACHE_DURATION_MINUTES)
    }

    logger.info(f"Trending data updated: {len(hot_genres)} genres, {len(trending_games)} games")
    return result


def clear_cache():
    """Clear the trending data cache."""
    global _cache
    _cache = {"data": None, "updated_at": None, "expires_at": None}
