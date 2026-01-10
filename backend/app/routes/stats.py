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
        for source in ['steam', 'xbox', 'youtube']:
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
    for source in ['steam', 'xbox', 'youtube']:
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
