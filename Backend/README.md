# Task Management Backend API

A modern task management system backend built with FastAPI, MongoDB, and JWT authentication.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Task Management**: Full CRUD operations for tasks
- **MongoDB Integration**: Using Beanie ODM for MongoDB operations
- **Role-based Access**: Users can only access their own tasks or tasks assigned to them
- **Task Status Tracking**: Todo, In Progress, Completed, Cancelled
- **Priority Levels**: Low, Medium, High, Urgent
- **Due Date Management**: Optional due dates for tasks
- **Task Assignment**: Assign tasks to multiple users
- **Tagging System**: Add tags to tasks for better organization
- **RESTful API**: Clean and well-documented API endpoints
- **CORS Support**: Frontend integration ready

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **MongoDB**: NoSQL database for flexible data storage
- **Beanie**: Async MongoDB ODM based on Pydantic
- **JWT**: JSON Web Tokens for secure authentication
- **Pydantic**: Data validation and serialization
- **Motor**: Async MongoDB driver
- **Uvicorn**: ASGI server for production

## Project Structure

```
Backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Application configuration
│   │   ├── database.py        # MongoDB connection setup
│   │   ├── dependencies.py    # FastAPI dependencies
│   │   └── security.py        # Authentication utilities
│   ├── models/
│   │   ├── user.py           # User model and schemas
│   │   └── task.py           # Task model and schemas
│   ├── routes/
│   │   ├── auth.py           # Authentication endpoints
│   │   └── tasks.py          # Task management endpoints
│   └── services/             # Business logic services
├── main.py                   # FastAPI application entry point
├── run.py                    # Development server script
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables
└── .env.example             # Environment template
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone and Navigate

```bash
cd Backend/
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=task_management

# JWT Configuration
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

**Local MongoDB:**
```bash
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
```

**Or use MongoDB Atlas** (cloud) by updating the `MONGODB_URL` in `.env`

### 6. Run the Application

**Development mode:**
```bash
python run.py
```

**Or with uvicorn directly:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user info

### Tasks
- `POST /api/v1/tasks/` - Create a new task
- `GET /api/v1/tasks/` - Get tasks (with filtering)
- `GET /api/v1/tasks/{task_id}` - Get specific task
- `PUT /api/v1/tasks/{task_id}` - Update task
- `PATCH /api/v1/tasks/{task_id}/status` - Update task status
- `DELETE /api/v1/tasks/{task_id}` - Delete task

### General
- `GET /` - API info
- `GET /health` - Health check

## Usage Examples

### 1. Register a User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "secret123",
    "full_name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=johndoe&password=secret123"
```

### 3. Create a Task

```bash
curl -X POST "http://localhost:8000/api/v1/tasks/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the project",
    "priority": "high",
    "due_date": "2025-09-25T10:00:00",
    "tags": ["documentation", "project"]
  }'
```

### 4. Get Tasks

```bash
curl -X GET "http://localhost:8000/api/v1/tasks/?status=todo&priority=high" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### User Collection
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "hashed_password": "string",
  "full_name": "string",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Task Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "status": "todo|in_progress|completed|cancelled",
  "priority": "low|medium|high|urgent",
  "due_date": "datetime",
  "created_by": "string",
  "assigned_to": ["string"],
  "tags": ["string"],
  "created_at": "datetime",
  "updated_at": "datetime",
  "completed_at": "datetime"
}
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Quality

```bash
# Install development dependencies
pip install black isort flake8

# Format code
black .
isort .

# Check code quality
flake8 .
```

## Deployment

### Using Docker

1. Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Build and run:
```bash
docker build -t task-management-api .
docker run -p 8000:8000 task-management-api
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
    depends_on:
      - mongo

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## Security Considerations

- Change the `SECRET_KEY` in production
- Use HTTPS in production
- Implement rate limiting
- Use environment variables for sensitive data
- Regular security updates
- Monitor access logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.