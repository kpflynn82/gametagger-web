"""WebSocket endpoint for real-time job progress updates."""
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.job_manager import get_job_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/job/{job_id}")
async def job_websocket(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job progress updates."""
    await websocket.accept()

    job_manager = get_job_manager()
    job = job_manager.get_job(job_id)

    if not job:
        await websocket.send_json({"type": "error", "message": "Job not found"})
        await websocket.close()
        return

    # Create callback for progress updates
    async def send_update(message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    # Subscribe to job updates
    job_manager.subscribe(job_id, send_update)

    try:
        # Send current state immediately
        await websocket.send_json({
            "type": "state",
            "job_id": job_id,
            "status": job["status"],
            "progress": job["progress"],
            "game_name": job["game_name"]
        })

        # If already completed, send result
        if job["status"] == "completed":
            await websocket.send_json({
                "type": "completed",
                "job_id": job_id,
                "result": job.get("result"),
                "processing_time_seconds": job.get("processing_time_seconds")
            })
        elif job["status"] == "failed":
            await websocket.send_json({
                "type": "failed",
                "job_id": job_id,
                "error": job.get("error_message")
            })

        # Keep connection alive and wait for updates
        while True:
            try:
                # Wait for client messages (ping/pong or close)
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                # Handle ping
                if message == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break

            # Check if job is done
            job = job_manager.get_job(job_id)
            if job and job["status"] in ["completed", "failed"]:
                # Give time for final update to be sent
                await asyncio.sleep(1)
                break

    except WebSocketDisconnect:
        pass
    finally:
        job_manager.unsubscribe(job_id, send_update)
