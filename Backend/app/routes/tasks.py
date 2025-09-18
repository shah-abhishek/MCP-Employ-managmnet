from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from app.models.task import Task, TaskCreate, TaskUpdate, TaskResponse, TaskStatus, TaskPriority, TaskStatusUpdate
from app.models.user import User
from app.core.dependencies import get_current_active_user
from beanie import PydanticObjectId, SortDirection

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task"""
    task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        created_by=str(current_user.id),
        assigned_to=task_data.assigned_to or [],
        tags=task_data.tags or []
    )
    
    await task.insert()
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_by=task.created_by,
        assigned_to=task.assigned_to,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at
    )


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    current_user: User = Depends(get_current_active_user),
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority"),
    assigned_to_me: Optional[bool] = Query(False),
    created_by_me: Optional[bool] = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get tasks with optional filtering"""
    query = {}
    
    # Filter by status
    if status_filter:
        query["status"] = status_filter
    
    # Filter by priority
    if priority_filter:
        query["priority"] = priority_filter
    
    # Filter by assignment
    if assigned_to_me:
        query["assigned_to"] = {"$in": [str(current_user.id)]}
    
    # Filter by creator
    if created_by_me:
        query["created_by"] = str(current_user.id)
    
    # If no specific filters, show tasks user is involved with
    if not any([assigned_to_me, created_by_me, status_filter, priority_filter]):
        query["$or"] = [
            {"created_by": str(current_user.id)},
            {"assigned_to": {"$in": [str(current_user.id)]}}
        ]
    
    tasks = await Task.find(query).skip(skip).limit(limit).sort([("created_at", SortDirection.DESCENDING)]).to_list()
    
    return [
        TaskResponse(
            id=str(task.id),
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            created_by=task.created_by,
            assigned_to=task.assigned_to,
            tags=task.tags,
            created_at=task.created_at,
            updated_at=task.updated_at,
            completed_at=task.completed_at
        )
        for task in tasks
    ]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific task by ID"""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has access to this task
    user_id = str(current_user.id)
    assigned_to = task.assigned_to or []
    if task.created_by != user_id and user_id not in assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this task"
        )
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_by=task.created_by,
        assigned_to=task.assigned_to,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at
    )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a task"""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user can edit this task (creator or assigned)
    user_id = str(current_user.id)
    assigned_to = task.assigned_to or []
    if task.created_by != user_id and user_id not in assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to edit this task"
        )
    
    # Update fields
    update_data = task_data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        # Set completed_at if status is being changed to completed
        if task_data.status == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()
        elif task_data.status and task_data.status != TaskStatus.COMPLETED:
            update_data["completed_at"] = None
        
        await task.update({"$set": update_data})
        await task.save()
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_by=task.created_by,
        assigned_to=task.assigned_to,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at
    )


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update only the task status"""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user can edit this task
    user_id = str(current_user.id)
    assigned_to = task.assigned_to or []
    if task.created_by != user_id and user_id not in assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to edit this task"
        )
    
    # Update status
    update_data = {
        "status": status_data.status,
        "updated_at": datetime.utcnow()
    }
    
    # Set completed_at if status is being changed to completed
    if status_data.status == TaskStatus.COMPLETED and task.status != TaskStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    elif status_data.status != TaskStatus.COMPLETED:
        update_data["completed_at"] = None
    
    await task.update({"$set": update_data})
    await task.save()
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_by=task.created_by,
        assigned_to=task.assigned_to,
        tags=task.tags,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a task"""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Only creator can delete the task
    if task.created_by != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only task creator can delete this task"
        )
    
    await task.delete()
    return None