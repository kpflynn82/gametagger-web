"""SQLAlchemy database models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Analysis(Base):
    """Stored game analysis results."""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(36), unique=True, nullable=False, index=True)
    game_name = Column(String(255), nullable=False, index=True)
    detected_game = Column(String(255))
    confidence = Column(String(20), index=True)
    primary_genre = Column(String(100))
    analysis_notes = Column(String)

    # All VGMS boolean tags stored as JSON
    tags = Column(JSON, nullable=False)

    # Sources used and raw data from each
    sources_used = Column(JSON)
    source_data = Column(JSON)

    # Metadata
    quality = Column(String(20), default='standard')  # 'standard' or 'deep'
    created_at = Column(DateTime, server_default=func.now())
    processing_time_seconds = Column(Float)


class Job(Base):
    """Background job tracking."""
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True)
    game_name = Column(String(255), nullable=False)
    sources = Column(JSON, nullable=False)
    status = Column(String(20), nullable=False, index=True)  # queued, processing, completed, failed
    progress = Column(JSON)  # Per-source progress
    error_message = Column(String)
    analysis_id = Column(Integer, ForeignKey("analyses.id"))

    created_at = Column(DateTime, server_default=func.now())
    started_at = Column(DateTime)
    completed_at = Column(DateTime)


class BatchJob(Base):
    """Batch genre classification job tracking."""
    __tablename__ = "batch_jobs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(36), unique=True, nullable=False, index=True)
    status = Column(String(20), default="pending", index=True)  # pending, processing, completed, failed
    total_games = Column(Integer, nullable=False)
    processed_games = Column(Integer, default=0)
    error_message = Column(String)

    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)


class BatchResult(Base):
    """Individual game result within a batch job."""
    __tablename__ = "batch_results"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(36), nullable=False, index=True)
    game_name = Column(String(500), nullable=False)
    detected_game = Column(String(500))
    primary_genre = Column(String(100))
    confidence = Column(String(20))
    error = Column(String)

    created_at = Column(DateTime, server_default=func.now())
