from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from typing import Optional


from motor.motor_asyncio import AsyncIOMotorClient
from beanie.odm.documents import Document
from motor.motor_asyncio import AsyncIOMotorDatabase

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None


db_manager = DatabaseManager()


async def connect_to_mongo():
    """Create database connection"""
    db_manager.client = AsyncIOMotorClient(settings.mongodb_url)
    if db_manager.client:
        db_manager.database = db_manager.client[settings.database_name]
    
    # Import models here to avoid circular imports
    from app.models.user import User
    from app.models.task import Task
    
    # Initialize beanie with the database and models
    await init_beanie(
        database=db_manager.database,  # type: ignore
        document_models=[User, Task]
    )


async def close_mongo_connection():
    """Close database connection"""
    if db_manager.client:
        db_manager.client.close()


def get_database():
    """Get database instance"""
    return db_manager.database