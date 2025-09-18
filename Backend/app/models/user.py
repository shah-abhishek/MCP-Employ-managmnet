from beanie import Document
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class User(Document):
    """User model for MongoDB using Beanie ODM"""
    username: str
    email: str
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    
    class Settings:
        collection = "users"
        indexes = [
            [("username", 1)],  # Index on username
            [("email", 1)]      # Index on email
        ]

    def __repr__(self) -> str:
        return f"<User {self.username}>"

    def __str__(self) -> str:
        return self.username


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str