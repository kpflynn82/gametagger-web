"""Lightweight batch genre classifier using Claude only."""
import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Optional, Callable

import anthropic
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker

# 59 standardized genres from VGMS v3.2
PRIMARY_GENRES = [
    "Action RPG", "Action Adventure", "First-Person Shooter", "Third-Person Shooter",
    "Bullet Hell", "Beat 'em Up", "Looter Shooter", "Extraction Shooter",
    "JRPG", "Turn-Based RPG", "Tactical RPG", "MMORPG", "Roguelike",
    "2D Platformer", "3D Platformer", "Metroidvania",
    "Real-Time Strategy", "Turn-Based Strategy", "Tower Defense", "4X Strategy",
    "Grand Strategy", "Auto Battler", "MOBA",
    "Life Simulation", "Farm Simulation", "Management Simulation", "Racing Simulation",
    "Flight Simulation", "City Builder",
    "Puzzle", "Puzzle Platformer", "Match-3", "Physics Puzzle",
    "Adventure", "Narrative Adventure", "Visual Novel",
    "2D Fighting", "3D Fighting",
    "Arcade Racing", "Kart Racing", "Rally Racing",
    "Sports", "Horror",
    "Card Game", "Deck Builder", "Board Game", "Digital TCG",
    "Battle Royale", "Party Game",
    "Sandbox", "Survival", "Open World Survival Craft",
    "Arcade", "Rhythm Game", "Cozy Game", "Idle Game", "Souls-like",
    "Immersive Sim", "Educational"
]

GENRE_PROMPT = """Classify this video game into ONE primary genre.

GAME: {game_name}

You MUST select exactly ONE genre from this list:
{genres}

Return ONLY a JSON object with these fields:
- detected_game: The full official game title (correct any typos/abbreviations)
- primary_genre: One genre from the list above (EXACT match required)
- confidence: "high" (well-known game), "medium" (recognizable), or "low" (uncertain/obscure)

Example response:
{{"detected_game": "The Legend of Zelda: Breath of the Wild", "primary_genre": "Action Adventure", "confidence": "high"}}

Return ONLY valid JSON, no other text."""


class BatchClassifier:
    """Lightweight classifier for bulk genre-only classification."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)

    async def classify_single(self, game_name: str) -> dict:
        """Classify a single game, returning genre info only."""
        prompt = GENRE_PROMPT.format(
            game_name=game_name,
            genres=", ".join(PRIMARY_GENRES)
        )

        try:
            response = await self.client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            # Extract text response
            text = response.content[0].text.strip()

            # Parse JSON
            # Handle potential markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            result = json.loads(text)

            # Validate genre
            if result.get("primary_genre") not in PRIMARY_GENRES:
                # Try case-insensitive match
                for genre in PRIMARY_GENRES:
                    if genre.lower() == result.get("primary_genre", "").lower():
                        result["primary_genre"] = genre
                        break
                else:
                    result["primary_genre"] = "Action Adventure"  # Safe fallback

            return {
                "detected_game": result.get("detected_game", game_name),
                "primary_genre": result["primary_genre"],
                "confidence": result.get("confidence", "medium"),
                "error": None
            }

        except json.JSONDecodeError as e:
            return {
                "detected_game": game_name,
                "primary_genre": None,
                "confidence": "low",
                "error": f"JSON parse error: {str(e)}"
            }
        except Exception as e:
            return {
                "detected_game": game_name,
                "primary_genre": None,
                "confidence": "low",
                "error": str(e)
            }


async def process_batch(
    batch_id: str,
    games: list[str],
    progress_callback: Optional[Callable[[int, int], None]] = None
):
    """
    Process a batch of games in the background.
    Updates database with progress and results.
    """
    from app.models import BatchJob, BatchResult

    classifier = BatchClassifier()
    total = len(games)

    async with async_session_maker() as session:
        # Update job to processing
        await session.execute(
            update(BatchJob)
            .where(BatchJob.batch_id == batch_id)
            .values(status="processing")
        )
        await session.commit()

        processed = 0

        for game_name in games:
            try:
                # Classify the game
                result = await classifier.classify_single(game_name)

                # Store result
                batch_result = BatchResult(
                    batch_id=batch_id,
                    game_name=game_name,
                    detected_game=result["detected_game"],
                    primary_genre=result["primary_genre"],
                    confidence=result["confidence"],
                    error=result["error"]
                )
                session.add(batch_result)

                processed += 1

                # Update progress
                await session.execute(
                    update(BatchJob)
                    .where(BatchJob.batch_id == batch_id)
                    .values(processed_games=processed)
                )
                await session.commit()

                if progress_callback:
                    progress_callback(processed, total)

                # Rate limiting - 0.5s between requests
                await asyncio.sleep(0.5)

            except Exception as e:
                # Store error result but continue
                batch_result = BatchResult(
                    batch_id=batch_id,
                    game_name=game_name,
                    error=str(e)
                )
                session.add(batch_result)
                processed += 1
                await session.commit()

        # Mark job as completed
        await session.execute(
            update(BatchJob)
            .where(BatchJob.batch_id == batch_id)
            .values(
                status="completed",
                processed_games=processed,
                completed_at=datetime.utcnow()
            )
        )
        await session.commit()


def create_batch_job(games: list[str]) -> str:
    """Create a new batch job and return the batch_id."""
    return str(uuid.uuid4())
