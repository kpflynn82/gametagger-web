"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Request schemas
class TagRequest(BaseModel):
    """Request to start a game tagging job."""
    game_name: str = Field(..., min_length=1, max_length=255)
    sources: list[str] = Field(default=["wikipedia", "xbox", "steam"])
    quality: str = Field(default="standard", pattern="^(standard|deep)$")

    class Config:
        json_schema_extra = {
            "example": {
                "game_name": "Elden Ring",
                "sources": ["wikipedia", "xbox", "steam"],
                "quality": "standard"
            }
        }


# Response schemas
class JobCreatedResponse(BaseModel):
    """Response when a job is created."""
    job_id: str
    status: str = "queued"
    message: str = "Analysis job created"


class JobProgress(BaseModel):
    """Progress for each source."""
    steam: Optional[str] = "pending"
    xbox: Optional[str] = "pending"
    wikipedia: Optional[str] = "pending"
    youtube: Optional[str] = "pending"
    analysis: Optional[str] = "pending"


class JobStatusResponse(BaseModel):
    """Full job status response."""
    job_id: str
    game_name: str
    status: str
    progress: JobProgress
    error_message: Optional[str] = None
    result: Optional[dict] = None
    created_at: datetime
    estimated_remaining_seconds: Optional[int] = None


class AnalysisSummary(BaseModel):
    """Summary of an analysis for list views."""
    id: int
    game_name: str
    detected_game: Optional[str]
    confidence: Optional[str]
    primary_genre: Optional[str]
    sources_used: list[str]
    quality: Optional[str] = "standard"  # 'standard' or 'deep'
    created_at: datetime
    tag_count: int
    # Nitrogen tag counts
    engagement_count: int = 0
    monetization_count: int = 0
    protagonist_count: int = 0


class AnalysisDetail(BaseModel):
    """Full analysis details."""
    id: int
    job_id: str
    game_name: str
    detected_game: Optional[str]
    confidence: Optional[str]
    primary_genre: Optional[str]
    analysis_notes: Optional[str]
    tags: dict
    sources_used: list[str]
    source_data: Optional[dict]
    quality: Optional[str] = "standard"  # 'standard' or 'deep'
    created_at: datetime
    processing_time_seconds: Optional[float]


class AnalysisUpdate(BaseModel):
    """Request to update an analysis."""
    detected_game: Optional[str] = None
    primary_genre: Optional[str] = None
    confidence: Optional[str] = None
    analysis_notes: Optional[str] = None


class HistoryResponse(BaseModel):
    """Paginated history response."""
    items: list[AnalysisSummary]
    total: int
    page: int
    pages: int


class TagDistribution(BaseModel):
    """Tag count for a category."""
    tag_name: str
    count: int
    percentage: float


class SourceSuccessRate(BaseModel):
    """Success rate for a source."""
    source: str
    success_rate: float
    total_attempts: int


class StatsResponse(BaseModel):
    """Dashboard statistics."""
    total_analyses: int
    analyses_this_week: int
    average_confidence: float
    source_success_rates: dict[str, float]
    tag_distribution: dict[str, list[TagDistribution]]
    top_genres: list[dict]
    recent_analyses: list[AnalysisSummary]
