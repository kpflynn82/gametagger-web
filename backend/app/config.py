"""Application configuration."""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    anthropic_api_key: str = ""

    # Database - Railway provides DATABASE_URL in postgres:// format
    # We need to convert to postgresql+asyncpg:// for SQLAlchemy async
    database_url: str = "sqlite+aiosqlite:///./data/gametagger.db"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    cors_origins: list[str] = ["*"]  # Allow all origins for now

    # Rate limiting
    rate_limit_per_minute: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_async_database_url(self) -> str:
        """Convert database URL to async format."""
        url = self.database_url
        # Railway provides postgres:// but SQLAlchemy needs postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
