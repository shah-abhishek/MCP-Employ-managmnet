from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Document):
    """Task model for MongoDB using Beanie ODM"""
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    created_by: str  # User ID who created the task
    assigned_to: Optional[List[str]] = []  # List of user IDs assigned to the task
    tags: Optional[List[str]] = []
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    completed_at: Optional[datetime] = None
    
    class Settings:
        collection = "tasks"
        indexes = [
            [("created_by", 1)],           # Index on creator
            [("status", 1)],               # Index on status
            [("priority", 1)],             # Index on priority
            [("due_date", 1)],             # Index on due date
            [("created_at", -1)],          # Index on creation date (descending)
            [("assigned_to", 1)]           # Index on assigned users
        ]

    def __repr__(self) -> str:
        return f"<Task {self.title}>"

    def __str__(self) -> str:
        return self.title


class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    assigned_to: Optional[List[str]] = []
    tags: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime] = None
    created_by: str
    assigned_to: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status only"""
    status: TaskStatus