"""History API endpoints - view past analyses."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Analysis
from app.schemas import AnalysisSummary, AnalysisDetail, HistoryResponse

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    confidence: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated tag names
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|game_name|confidence)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated analysis history with optional filters."""
    # Build query
    query = select(Analysis)

    # Apply filters
    if search:
        query = query.where(
            Analysis.game_name.ilike(f"%{search}%") |
            Analysis.detected_game.ilike(f"%{search}%")
        )

    if confidence:
        query = query.where(Analysis.confidence == confidence)

    if date_from:
        query = query.where(Analysis.created_at >= date_from)

    if date_to:
        query = query.where(Analysis.created_at <= date_to)

    # Count total before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply sorting
    order_column = getattr(Analysis, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(order_column)

    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    # Execute
    result = await db.execute(query)
    analyses = result.scalars().all()

    # Filter by tags if specified (done in Python since tags is JSON)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        filtered = []
        for analysis in analyses:
            analysis_tags = analysis.tags or {}
            if all(analysis_tags.get(tag, False) for tag in tag_list):
                filtered.append(analysis)
        analyses = filtered

    # Convert to response
    items = []
    for analysis in analyses:
        # Count true tags
        tag_count = sum(1 for v in (analysis.tags or {}).values() if v is True)

        items.append(AnalysisSummary(
            id=analysis.id,
            game_name=analysis.game_name,
            detected_game=analysis.detected_game,
            confidence=analysis.confidence,
            primary_genre=analysis.primary_genre,
            sources_used=analysis.sources_used or [],
            created_at=analysis.created_at,
            tag_count=tag_count
        ))

    pages = (total + limit - 1) // limit if total > 0 else 1

    return HistoryResponse(
        items=items,
        total=total,
        page=page,
        pages=pages
    )


@router.get("/analysis/{analysis_id}", response_model=AnalysisDetail)
async def get_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Get full details of a specific analysis."""
    query = select(Analysis).where(Analysis.id == analysis_id)
    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return AnalysisDetail(
        id=analysis.id,
        job_id=analysis.job_id,
        game_name=analysis.game_name,
        detected_game=analysis.detected_game,
        confidence=analysis.confidence,
        primary_genre=analysis.primary_genre,
        analysis_notes=analysis.analysis_notes,
        tags=analysis.tags or {},
        sources_used=analysis.sources_used or [],
        source_data=analysis.source_data,
        created_at=analysis.created_at,
        processing_time_seconds=analysis.processing_time_seconds
    )


@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an analysis."""
    query = select(Analysis).where(Analysis.id == analysis_id)
    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.delete(analysis)
    await db.commit()

    return {"status": "deleted", "id": analysis_id}
