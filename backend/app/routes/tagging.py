"""Tagging API endpoints - start jobs and check status."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.models import Analysis, Job
from app.schemas import TagRequest, JobCreatedResponse, JobStatusResponse, JobProgress
from app.services.job_manager import get_job_manager

router = APIRouter(prefix="/api", tags=["tagging"])


@router.post("/tag", response_model=JobCreatedResponse)
async def start_tagging_job(request: TagRequest, db: AsyncSession = Depends(get_db)):
    """Start a new game tagging job."""
    # Validate sources
    valid_sources = {"steam", "xbox", "youtube"}
    sources = [s for s in request.sources if s in valid_sources]

    if not sources:
        raise HTTPException(status_code=400, detail="No valid sources specified")

    # Create job
    job_manager = get_job_manager()
    job_id = await job_manager.create_job(request.game_name, sources)

    # Store job in database
    db_job = Job(
        id=job_id,
        game_name=request.game_name,
        sources=sources,
        status="queued",
        progress={s: "pending" for s in sources + ["analysis"]},
        created_at=datetime.utcnow()
    )
    db.add(db_job)
    await db.commit()

    return JobCreatedResponse(
        job_id=job_id,
        status="queued",
        message="Analysis job created"
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get the status of a tagging job."""
    job_manager = get_job_manager()
    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Build progress response
    progress = JobProgress(**job.get("progress", {}))

    return JobStatusResponse(
        job_id=job_id,
        game_name=job["game_name"],
        status=job["status"],
        progress=progress,
        error_message=job.get("error_message"),
        result=job.get("result"),
        created_at=job["created_at"],
        estimated_remaining_seconds=job_manager.estimate_remaining_time(job_id)
    )


@router.post("/jobs/{job_id}/save")
async def save_job_result(job_id: str, db: AsyncSession = Depends(get_db)):
    """Save a completed job's result to the database."""
    job_manager = get_job_manager()
    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not yet completed")

    result = job.get("result")
    if not result:
        raise HTTPException(status_code=400, detail="No result to save")

    # Extract tags (boolean values)
    tags = {k: v for k, v in result.items() if isinstance(v, bool)}

    # Create analysis record
    analysis = Analysis(
        job_id=job_id,
        game_name=job["game_name"],
        detected_game=result.get("detected_game"),
        confidence=result.get("confidence"),
        primary_genre=result.get("primary_genre"),
        analysis_notes=result.get("analysis_notes"),
        tags=tags,
        sources_used=result.get("sources_used", []),
        source_data=result.get("source_data"),
        processing_time_seconds=job.get("processing_time_seconds")
    )

    db.add(analysis)

    # Update job record
    from sqlalchemy import select
    stmt = select(Job).where(Job.id == job_id)
    db_result = await db.execute(stmt)
    db_job = db_result.scalar_one_or_none()

    if db_job:
        db_job.status = "completed"
        db_job.completed_at = job.get("completed_at")
        db_job.analysis_id = analysis.id

    await db.commit()

    return {"status": "saved", "analysis_id": analysis.id}
