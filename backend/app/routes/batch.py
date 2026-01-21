"""Batch classification API endpoints - bulk genre classification."""
import asyncio
import csv
import io
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import BatchJob, BatchResult
from app.services.batch_classifier import process_batch

router = APIRouter(prefix="/api/batch", tags=["batch"])


# Request/Response schemas
class BatchClassifyRequest(BaseModel):
    games: List[str]


class BatchJobResponse(BaseModel):
    batch_id: str
    status: str
    total_games: int
    message: str


class BatchStatusResponse(BaseModel):
    batch_id: str
    status: str
    total_games: int
    processed_games: int
    progress_percent: float
    created_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None


class BatchResultItem(BaseModel):
    game_name: str
    detected_game: str | None
    primary_genre: str | None
    confidence: str | None
    error: str | None


class BatchResultsResponse(BaseModel):
    batch_id: str
    status: str
    total_games: int
    results: List[BatchResultItem]


@router.post("/classify", response_model=BatchJobResponse)
async def start_batch_classification(
    request: BatchClassifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Start a new batch genre classification job.

    Accepts a list of game names and classifies each by primary genre only.
    Uses Claude Haiku for fast, cost-effective classification.
    """
    # Validate input
    games = [g.strip() for g in request.games if g.strip()]

    if not games:
        raise HTTPException(status_code=400, detail="No valid game names provided")

    if len(games) > 5000:
        raise HTTPException(status_code=400, detail="Maximum 5000 games per batch")

    # Create batch job
    batch_id = str(uuid.uuid4())

    batch_job = BatchJob(
        batch_id=batch_id,
        status="pending",
        total_games=len(games),
        processed_games=0
    )
    db.add(batch_job)
    await db.commit()

    # Start background processing
    asyncio.create_task(process_batch(batch_id, games))

    return BatchJobResponse(
        batch_id=batch_id,
        status="pending",
        total_games=len(games),
        message=f"Batch job created. Processing {len(games)} games."
    )


@router.get("/{batch_id}", response_model=BatchStatusResponse)
async def get_batch_status(batch_id: str, db: AsyncSession = Depends(get_db)):
    """Get the status of a batch classification job."""
    stmt = select(BatchJob).where(BatchJob.batch_id == batch_id)
    result = await db.execute(stmt)
    batch_job = result.scalar_one_or_none()

    if not batch_job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    progress = (batch_job.processed_games / batch_job.total_games * 100) if batch_job.total_games > 0 else 0

    return BatchStatusResponse(
        batch_id=batch_job.batch_id,
        status=batch_job.status,
        total_games=batch_job.total_games,
        processed_games=batch_job.processed_games,
        progress_percent=round(progress, 1),
        created_at=batch_job.created_at,
        completed_at=batch_job.completed_at,
        error_message=batch_job.error_message
    )


@router.get("/{batch_id}/results", response_model=BatchResultsResponse)
async def get_batch_results(batch_id: str, db: AsyncSession = Depends(get_db)):
    """Get the results of a completed batch job."""
    # Get batch job
    stmt = select(BatchJob).where(BatchJob.batch_id == batch_id)
    result = await db.execute(stmt)
    batch_job = result.scalar_one_or_none()

    if not batch_job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    # Get results
    stmt = select(BatchResult).where(BatchResult.batch_id == batch_id).order_by(BatchResult.id)
    result = await db.execute(stmt)
    results = result.scalars().all()

    return BatchResultsResponse(
        batch_id=batch_id,
        status=batch_job.status,
        total_games=batch_job.total_games,
        results=[
            BatchResultItem(
                game_name=r.game_name,
                detected_game=r.detected_game,
                primary_genre=r.primary_genre,
                confidence=r.confidence,
                error=r.error
            )
            for r in results
        ]
    )


@router.get("/{batch_id}/download")
async def download_batch_results(batch_id: str, db: AsyncSession = Depends(get_db)):
    """Download batch results as CSV."""
    # Get batch job
    stmt = select(BatchJob).where(BatchJob.batch_id == batch_id)
    result = await db.execute(stmt)
    batch_job = result.scalar_one_or_none()

    if not batch_job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    if batch_job.status != "completed":
        raise HTTPException(status_code=400, detail="Batch job not yet completed")

    # Get results
    stmt = select(BatchResult).where(BatchResult.batch_id == batch_id).order_by(BatchResult.id)
    result = await db.execute(stmt)
    results = result.scalars().all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["game_name", "detected_game", "primary_genre", "confidence", "error"])

    for r in results:
        writer.writerow([r.game_name, r.detected_game, r.primary_genre, r.confidence, r.error or ""])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=batch_{batch_id[:8]}_results.csv"}
    )


@router.get("/")
async def list_batch_jobs(db: AsyncSession = Depends(get_db)):
    """List all batch jobs (most recent first)."""
    stmt = select(BatchJob).order_by(BatchJob.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    return {
        "jobs": [
            {
                "batch_id": j.batch_id,
                "status": j.status,
                "total_games": j.total_games,
                "processed_games": j.processed_games,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None
            }
            for j in jobs
        ]
    }
