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

# Configure CORS - allow all origins for API access
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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


@app.get("/api/debug/connectivity")
async def debug_connectivity():
    """Debug endpoint to test external API connectivity."""
    import httpx
    import socket

    results = {
        "anthropic_api_key_set": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "anthropic_api_key_length": len(os.environ.get("ANTHROPIC_API_KEY", "")),
    }

    # Test DNS resolution
    try:
        ip = socket.gethostbyname("api.anthropic.com")
        results["dns_resolution"] = {"success": True, "ip": ip}
    except Exception as e:
        results["dns_resolution"] = {"success": False, "error": str(e)}

    # Test HTTPS connection to Anthropic
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://api.anthropic.com/v1/messages", headers={"x-api-key": "test"})
            results["https_connection"] = {"success": True, "status_code": r.status_code}
    except Exception as e:
        results["https_connection"] = {"success": False, "error": str(e)}

    # Test a simple API call with the real key
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        # First try direct httpx POST (bypassing SDK)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-haiku-20241022",
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Say hi"}]
                    }
                )
                if r.status_code == 200:
                    data = r.json()
                    results["direct_api_call"] = {"success": True, "response": data.get("content", [{}])[0].get("text", "")[:50]}
                else:
                    results["direct_api_call"] = {"success": False, "status": r.status_code, "body": r.text[:200]}
        except Exception as e:
            results["direct_api_call"] = {"success": False, "error": str(e), "type": type(e).__name__}

        # Then try SDK
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=10,
                messages=[{"role": "user", "content": "Say hi"}]
            )
            results["sdk_api_call"] = {"success": True, "response": response.content[0].text[:50]}
        except Exception as e:
            results["sdk_api_call"] = {"success": False, "error": str(e), "type": type(e).__name__}

    return results


# Serve static files (frontend build) in production
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

