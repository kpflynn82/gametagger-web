"""Background job manager for game tagging tasks."""
import asyncio
import time
from datetime import datetime
from typing import Dict, Optional, Callable
from uuid import uuid4

from app.services.tagger import AsyncGameTagger


class JobManager:
    """Manages background tagging jobs with progress tracking."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.jobs: Dict[str, dict] = {}
        self.subscribers: Dict[str, list] = {}  # job_id -> list of callbacks
        self._tagger: Optional[AsyncGameTagger] = None

    @property
    def tagger(self) -> AsyncGameTagger:
        """Lazy-load the tagger."""
        if self._tagger is None:
            self._tagger = AsyncGameTagger(self.api_key)
        return self._tagger

    async def create_job(self, game_name: str, sources: list, quality: str = "standard") -> str:
        """Create a new tagging job and start processing."""
        job_id = str(uuid4())

        self.jobs[job_id] = {
            "id": job_id,
            "game_name": game_name,
            "sources": sources,
            "quality": quality,
            "status": "queued",
            "progress": {s: "pending" for s in sources + ["analysis"]},
            "created_at": datetime.utcnow(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error_message": None
        }

        # Start processing in background
        asyncio.create_task(self._process_job(job_id))

        return job_id

    def get_job(self, job_id: str) -> Optional[dict]:
        """Get job status and details."""
        return self.jobs.get(job_id)

    def subscribe(self, job_id: str, callback: Callable) -> None:
        """Subscribe to job progress updates."""
        if job_id not in self.subscribers:
            self.subscribers[job_id] = []
        self.subscribers[job_id].append(callback)

    def unsubscribe(self, job_id: str, callback: Callable) -> None:
        """Unsubscribe from job progress updates."""
        if job_id in self.subscribers:
            try:
                self.subscribers[job_id].remove(callback)
            except ValueError:
                pass

    async def _notify_subscribers(self, job_id: str, event_type: str, data: dict) -> None:
        """Notify all subscribers of a job update."""
        if job_id not in self.subscribers:
            return

        message = {"type": event_type, **data}
        for callback in self.subscribers[job_id]:
            try:
                await callback(message)
            except Exception:
                pass

    async def _update_progress(self, source: str, status: str, job_id: str) -> None:
        """Update progress for a source and notify subscribers."""
        job = self.jobs.get(job_id)
        if job:
            job["progress"][source] = status
            await self._notify_subscribers(job_id, "progress", {
                "source": source,
                "status": status,
                "progress": job["progress"]
            })

    async def _process_job(self, job_id: str) -> None:
        """Process a tagging job in the background."""
        job = self.jobs.get(job_id)
        if not job:
            return

        start_time = time.time()
        job["status"] = "processing"
        job["started_at"] = datetime.utcnow()

        await self._notify_subscribers(job_id, "started", {
            "job_id": job_id,
            "game_name": job["game_name"]
        })

        try:
            # Create progress callback that updates this job
            async def progress_callback(source: str, status: str):
                await self._update_progress(source, status, job_id)

            # Run the tagger
            result = await self.tagger.tag_game(
                game_name=job["game_name"],
                sources=job["sources"],
                quality=job.get("quality", "standard"),
                progress_callback=progress_callback
            )

            # Store result
            job["result"] = result
            job["status"] = "completed" if "error" not in result else "failed"
            job["error_message"] = result.get("error")
            job["completed_at"] = datetime.utcnow()
            job["processing_time_seconds"] = time.time() - start_time

            await self._notify_subscribers(job_id, "completed", {
                "job_id": job_id,
                "status": job["status"],
                "result": result,
                "processing_time_seconds": job["processing_time_seconds"]
            })

        except Exception as e:
            job["status"] = "failed"
            job["error_message"] = str(e)
            job["completed_at"] = datetime.utcnow()
            job["processing_time_seconds"] = time.time() - start_time

            await self._notify_subscribers(job_id, "failed", {
                "job_id": job_id,
                "error": str(e)
            })

    def estimate_remaining_time(self, job_id: str) -> Optional[int]:
        """Estimate remaining time for a job in seconds."""
        job = self.jobs.get(job_id)
        if not job or job["status"] != "processing":
            return None

        progress = job["progress"]
        sources = job["sources"]

        # Rough time estimates per source
        source_times = {
            "steam": 3,
            "xbox": 3,
            "youtube": 60,  # Video download is slow
            "analysis": 10
        }

        completed = sum(
            source_times.get(s, 0)
            for s, status in progress.items()
            if status == "completed"
        )

        total = sum(source_times.get(s, 0) for s in sources) + source_times["analysis"]

        return max(0, total - completed)

    def cleanup_old_jobs(self, max_age_hours: int = 24) -> int:
        """Remove old completed jobs from memory."""
        cutoff = datetime.utcnow()
        removed = 0

        for job_id in list(self.jobs.keys()):
            job = self.jobs[job_id]
            if job["completed_at"]:
                age = (cutoff - job["completed_at"]).total_seconds() / 3600
                if age > max_age_hours:
                    del self.jobs[job_id]
                    if job_id in self.subscribers:
                        del self.subscribers[job_id]
                    removed += 1

        return removed


# Global job manager instance (initialized on startup)
_job_manager: Optional[JobManager] = None


def get_job_manager() -> JobManager:
    """Get the global job manager instance."""
    global _job_manager
    if _job_manager is None:
        raise RuntimeError("Job manager not initialized. Call init_job_manager first.")
    return _job_manager


def init_job_manager(api_key: str) -> JobManager:
    """Initialize the global job manager."""
    global _job_manager
    _job_manager = JobManager(api_key)
    return _job_manager
