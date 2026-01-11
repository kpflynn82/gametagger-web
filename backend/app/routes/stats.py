"""Stats API endpoint for dashboard data."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from collections import Counter

from app.database import get_db
from app.models import Analysis
from app.schemas import StatsResponse, AnalysisSummary, TagDistribution
from app.services.trending import get_trending_data

router = APIRouter(prefix="/api", tags=["stats"])

# Tag categories for grouping
TAG_CATEGORIES = {
    'gameplay': [
        'gameplay_action', 'gameplay_adventure', 'gameplay_rpg', 'gameplay_strategy',
        'gameplay_simulation', 'gameplay_sports', 'gameplay_platformer', 'gameplay_puzzle',
        'gameplay_shooter', 'gameplay_stealth', 'gameplay_survival', 'gameplay_rhythm',
        'gameplay_party', 'gameplay_roguelike', 'gameplay_fighting', 'gameplay_racing'
    ],
    'narrative': [
        'narrative_horror', 'narrative_comedy', 'narrative_mystery', 'narrative_scifi',
        'narrative_fantasy', 'narrative_historical', 'narrative_western'
    ],
    'theme': [
        'theme_war', 'theme_exploration', 'theme_survival', 'theme_crime',
        'theme_family', 'theme_revenge', 'theme_coming_of_age', 'theme_politics',
        'theme_environmental'
    ],
    'setting': [
        'setting_fantasy', 'setting_scifi', 'setting_contemporary', 'setting_historical',
        'setting_post_apocalyptic', 'setting_urban', 'setting_rural', 'setting_underwater',
        'setting_space'
    ],
    'mechanic': [
        'mechanic_leveling', 'mechanic_crafting', 'mechanic_farming', 'mechanic_building',
        'mechanic_collection', 'mechanic_inventory', 'mechanic_permadeath',
        'mechanic_time_management', 'mechanic_resource_management', 'mechanic_stealth',
        'mechanic_parkour', 'mechanic_dialogue_choices', 'mechanic_moral_choices',
        'mechanic_romance'
    ],
    'visual': [
        'visual_realistic', 'visual_stylized', 'visual_pixel_art', 'visual_minimalist',
        'visual_hand_drawn'
    ],
    'features': [
        'multiplayer', 'open_world', 'procedural', 'story_driven'
    ],
    'engagement': [
        'engagement_gacha', 'engagement_daily_rewards', 'engagement_energy_system',
        'engagement_pvp', 'engagement_guild', 'engagement_events',
        'engagement_battle_pass', 'engagement_auto_play'
    ],
    'monetization': [
        'monetization_free_to_play', 'monetization_premium',
        'monetization_subscription', 'monetization_iap'
    ],
    'protagonist': [
        'protagonist_customizable', 'protagonist_predefined',
        'protagonist_ensemble', 'protagonist_non_human'
    ],
    'accessibility': [
        'accessibility_colorblind_modes', 'accessibility_subtitle_options',
        'accessibility_difficulty_options', 'accessibility_motor_accessibility',
        'accessibility_cognitive_assist'
    ],
    'demographic': [
        'demographic_family_friendly', 'demographic_teen_focused',
        'demographic_mature_audience', 'demographic_female_protagonist',
        'demographic_diverse_cast', 'demographic_nostalgia_retro'
    ]
}


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics."""
    # Total analyses
    total_query = select(func.count()).select_from(Analysis)
    total_result = await db.execute(total_query)
    total_analyses = total_result.scalar() or 0

    # Analyses this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_query = select(func.count()).select_from(Analysis).where(
        Analysis.created_at >= week_ago
    )
    week_result = await db.execute(week_query)
    analyses_this_week = week_result.scalar() or 0

    # All analyses for aggregation
    all_query = select(Analysis)
    all_result = await db.execute(all_query)
    all_analyses = all_result.scalars().all()

    # Calculate confidence distribution
    confidence_counts = Counter()
    source_attempts = Counter()
    source_successes = Counter()
    tag_counts = Counter()
    genre_counts = Counter()

    for analysis in all_analyses:
        # Confidence
        if analysis.confidence:
            confidence_counts[analysis.confidence] += 1

        # Source success rates
        sources_used = analysis.sources_used or []
        for source in ['steam', 'xbox', 'wikipedia', 'youtube']:
            source_attempts[source] += 1
            if source in sources_used:
                source_successes[source] += 1

        # Tag counts
        tags = analysis.tags or {}
        for tag, value in tags.items():
            if value is True:
                tag_counts[tag] += 1

        # Genre counts
        if analysis.primary_genre:
            genre_counts[analysis.primary_genre] += 1

    # Calculate average confidence (high=1, medium=0.5, low=0)
    confidence_weights = {'high': 1.0, 'medium': 0.5, 'low': 0.0}
    if confidence_counts:
        weighted_sum = sum(
            confidence_weights.get(conf, 0.5) * count
            for conf, count in confidence_counts.items()
        )
        average_confidence = weighted_sum / sum(confidence_counts.values())
    else:
        average_confidence = 0.0

    # Source success rates
    source_success_rates = {}
    for source in ['steam', 'xbox', 'wikipedia', 'youtube']:
        attempts = source_attempts[source]
        if attempts > 0:
            source_success_rates[source] = source_successes[source] / attempts
        else:
            source_success_rates[source] = 0.0

    # Tag distribution by category
    tag_distribution = {}
    for category, tags in TAG_CATEGORIES.items():
        category_dist = []
        for tag in tags:
            count = tag_counts.get(tag, 0)
            if count > 0:
                percentage = (count / total_analyses * 100) if total_analyses > 0 else 0
                category_dist.append(TagDistribution(
                    tag_name=tag,
                    count=count,
                    percentage=round(percentage, 1)
                ))
        # Sort by count descending
        category_dist.sort(key=lambda x: x.count, reverse=True)
        tag_distribution[category] = category_dist

    # Top genres
    top_genres = [
        {"name": genre, "count": count, "percentage": round(count / total_analyses * 100, 1)}
        for genre, count in genre_counts.most_common(10)
    ] if total_analyses > 0 else []

    # Recent analyses
    recent_query = select(Analysis).order_by(Analysis.created_at.desc()).limit(5)
    recent_result = await db.execute(recent_query)
    recent_analyses = recent_result.scalars().all()

    recent_items = []
    for analysis in recent_analyses:
        tags = analysis.tags or {}
        tag_count = sum(1 for v in tags.values() if v is True)
        # Count nitrogen tags
        engagement_count = sum(1 for k, v in tags.items() if k.startswith('engagement_') and v is True)
        monetization_count = sum(1 for k, v in tags.items() if k.startswith('monetization_') and v is True)
        protagonist_count = sum(1 for k, v in tags.items() if k.startswith('protagonist_') and v is True)

        recent_items.append(AnalysisSummary(
            id=analysis.id,
            game_name=analysis.game_name,
            detected_game=analysis.detected_game,
            confidence=analysis.confidence,
            primary_genre=analysis.primary_genre,
            sources_used=analysis.sources_used or [],
            created_at=analysis.created_at,
            tag_count=tag_count,
            engagement_count=engagement_count,
            monetization_count=monetization_count,
            protagonist_count=protagonist_count
        ))

    return StatsResponse(
        total_analyses=total_analyses,
        analyses_this_week=analyses_this_week,
        average_confidence=round(average_confidence, 2),
        source_success_rates=source_success_rates,
        tag_distribution=tag_distribution,
        top_genres=top_genres,
        recent_analyses=recent_items
    )


@router.get("/popular-games")
async def get_popular_games(db: AsyncSession = Depends(get_db), limit: int = 10):
    """Get popular games (most tagged games in our database)."""
    # Get all analyses
    query = select(Analysis)
    result = await db.execute(query)
    all_analyses = result.scalars().all()

    # Calculate tag count for each and sort
    games_with_counts = []
    for analysis in all_analyses:
        tags = analysis.tags or {}
        tag_count = sum(1 for v in tags.values() if v is True)
        engagement_count = sum(1 for k, v in tags.items() if k.startswith('engagement_') and v is True)
        monetization_count = sum(1 for k, v in tags.items() if k.startswith('monetization_') and v is True)
        protagonist_count = sum(1 for k, v in tags.items() if k.startswith('protagonist_') and v is True)

        games_with_counts.append({
            "id": analysis.id,
            "game_name": analysis.game_name,
            "detected_game": analysis.detected_game,
            "confidence": analysis.confidence,
            "primary_genre": analysis.primary_genre,
            "sources_used": analysis.sources_used or [],
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "tag_count": tag_count,
            "engagement_count": engagement_count,
            "monetization_count": monetization_count,
            "protagonist_count": protagonist_count
        })

    # Sort by tag count descending
    games_with_counts.sort(key=lambda x: x["tag_count"], reverse=True)

    return {"items": games_with_counts[:limit]}


@router.get("/genre-stats")
async def get_genre_stats(db: AsyncSession = Depends(get_db)):
    """
    Get genre statistics for the lifecycle timeline.
    Returns all genres with popularity scores and sample games.
    """
    import random

    # Get all analyses
    query = select(Analysis)
    result = await db.execute(query)
    all_analyses = result.scalars().all()

    # Aggregate by primary_genre
    genre_data: dict = {}
    for analysis in all_analyses:
        genre = analysis.primary_genre
        if not genre:
            continue

        if genre not in genre_data:
            genre_data[genre] = {
                "genre": genre,
                "count": 0,
                "games": [],
                "high_confidence": 0,
            }

        genre_data[genre]["count"] += 1
        if len(genre_data[genre]["games"]) < 3:  # Sample up to 3 games
            genre_data[genre]["games"].append(analysis.game_name)
        if analysis.confidence == "high":
            genre_data[genre]["high_confidence"] += 1

    # Convert to list and sort by count
    genres = list(genre_data.values())
    genres.sort(key=lambda x: x["count"], reverse=True)

    # Base popularity multipliers - simulates player interest per game in genre
    # Larger genres typically have more casual appeal = higher per-game player counts
    POPULARITY_MULTIPLIERS = {
        "Action RPG": 15000,
        "Action Adventure": 14000,
        "First-Person Shooter": 18000,
        "FPS": 18000,
        "Battle Royale": 25000,
        "MMORPG": 20000,
        "Sports": 12000,
        "Racing": 10000,
        "Puzzle": 8000,
        "Roguelike": 6000,
        "Metroidvania": 5000,
        "JRPG": 7000,
        "Horror": 9000,
        "Survival": 11000,
    }
    DEFAULT_MULTIPLIER = 8000

    # Colors palette for genres
    colors = [
        "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7",
        "#14b8a6", "#ec4899", "#6366f1", "#84cc16", "#f472b6",
        "#f97316", "#dc2626", "#0ea5e9", "#8b5cf6", "#10b981",
        "#fbbf24", "#e11d48", "#7c3aed", "#059669", "#d946ef",
    ]

    # Assign lifecycle stages based on count and confidence
    for i, genre in enumerate(genres):
        genre["color"] = colors[i % len(colors)]

        # Calculate popularity score (simulated player count)
        multiplier = POPULARITY_MULTIPLIERS.get(genre["genre"], DEFAULT_MULTIPLIER)
        # Add some variance based on confidence (higher confidence = more popular)
        confidence_bonus = 1 + (genre["high_confidence"] / max(genre["count"], 1)) * 0.3
        base_popularity = int(genre["count"] * multiplier * confidence_bonus)
        # Add random variance (±15%)
        variance = random.uniform(0.85, 1.15)
        genre["popularity"] = int(base_popularity * variance)

        # Determine lifecycle stage based on characteristics
        confidence_ratio = genre["high_confidence"] / genre["count"] if genre["count"] > 0 else 0

        if genre["count"] <= 3:
            genre["stage"] = "emerging"
            genre["trend"] = random.randint(25, 50)  # Simulated growth
        elif genre["count"] <= 8:
            genre["stage"] = "growth"
            genre["trend"] = random.randint(10, 35)
        elif genre["count"] <= 20:
            genre["stage"] = "mature"
            genre["trend"] = random.randint(-5, 15)
        else:
            # Large genres could be mature or declining
            genre["stage"] = "mature" if confidence_ratio > 0.5 else "declining"
            genre["trend"] = random.randint(-10, 10)

        # Simulated historical popularity data (6 months)
        current_pop = genre["popularity"]
        months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]

        if genre["trend"] > 0:
            # Growing - start lower
            start_pop = int(current_pop * (1 - genre["trend"] / 100 * 0.6))
            step = (current_pop - start_pop) / 5
            genre["history"] = [
                {"month": m, "popularity": int(start_pop + step * idx + random.randint(-5000, 5000))}
                for idx, m in enumerate(months)
            ]
        else:
            # Declining or stable - start higher
            peak_pop = int(current_pop * (1 + abs(genre["trend"]) / 100 * 0.6))
            step = (peak_pop - current_pop) / 5
            genre["history"] = [
                {"month": m, "popularity": int(peak_pop - step * idx + random.randint(-5000, 5000))}
                for idx, m in enumerate(months)
            ]

    return {
        "genres": genres,
        "total_genres": len(genres),
        "total_games": len(all_analyses),
    }


@router.get("/trending")
async def get_trending(db: AsyncSession = Depends(get_db)):
    """
    Get trending games and hot genres from Steam.
    Data is cached for 30 minutes to avoid rate limits.
    """
    # Get raw connection for asyncpg operations
    raw_conn = await db.connection()

    # Get trending data (cached)
    data = await get_trending_data()

    # Check which trending games are in our database
    if data.get("trending_games"):
        query = select(Analysis.game_name)
        result = await db.execute(query)
        db_games = {row[0].lower() for row in result.fetchall()}

        for game in data["trending_games"]:
            game["in_database"] = game["name"].lower() in db_games

    return data
