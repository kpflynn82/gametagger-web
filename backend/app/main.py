"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.services.job_manager import init_job_manager
from app.routes import tagging, history, stats, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    settings = get_settings()

    # Ensure data directory exists
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)

    # Initialize database
    await init_db()

    # Initialize job manager
    api_key = settings.anthropic_api_key
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if api_key:
        init_job_manager(api_key)
        print("Job manager initialized")
    else:
        print("Warning: No ANTHROPIC_API_KEY set - tagging will not work")

    yield

    # Cleanup on shutdown
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="GameTagger API",
    description="Multi-source VGMS game tagging service",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tagging.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(websocket.router)


# Health check endpoints
@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "gametagger"}


# Serve static files (frontend build) in production
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

