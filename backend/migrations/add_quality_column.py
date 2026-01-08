"""Add quality column to analyses table."""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgresql://", "postgresql+asyncpg://")


async def migrate():
    """Add quality column if it doesn't exist."""
    if not DATABASE_URL:
        print("DATABASE_URL not set")
        return

    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        # Check if column exists
        result = await conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'analyses' AND column_name = 'quality'
        """))
        exists = result.fetchone()

        if not exists:
            print("Adding 'quality' column to analyses table...")
            await conn.execute(text("""
                ALTER TABLE analyses ADD COLUMN quality VARCHAR(20) DEFAULT 'standard'
            """))
            print("Column added successfully!")
        else:
            print("'quality' column already exists")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
