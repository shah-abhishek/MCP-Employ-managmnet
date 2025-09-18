# Task Management MCP Server

An MCP (Model Context Protocol) server that provides access to your task management MongoDB database through chat interfaces.

## Features

- **Database Statistics**: Get overview of users, tasks, and breakdowns
- **User Queries**: Find users by ID, username, or get all users
- **Task Management**: Query tasks by various criteria
- **Search Functionality**: Search tasks by content
- **User Analytics**: Get task statistics per user
- **Real-time Data**: Direct connection to your MongoDB database

## Available Tools

### Database Statistics
- `get_database_stats` - Get overall database statistics

### User Operations
- `get_all_users` - List all users (passwords excluded)
- `get_user_by_id` - Find user by MongoDB ObjectId
- `get_user_by_username` - Find user by username

### Task Operations
- `get_all_tasks` - List all tasks
- `get_task_by_id` - Find task by MongoDB ObjectId
- `get_tasks_by_user` - Get tasks for a specific user
- `get_tasks_by_status` - Filter tasks by status (todo, in_progress, completed, cancelled)
- `get_tasks_by_priority` - Filter tasks by priority (low, medium, high, urgent)
- `search_tasks` - Search tasks by title, description, or tags

### Analytics
- `get_user_task_stats` - Get task statistics for a user

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running with your task management database
- MCP-compatible client (like Claude Desktop)

### Installation

1. **Install dependencies:**
   ```bash
   cd "MCP server"
   npm install
   ```

2. **Configure environment:**
   Edit `.env` file with your MongoDB connection:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=task_management
   ```

3. **Test the server:**
   ```bash
   npm start
   ```

### Claude Desktop Integration

Add this to your Claude Desktop configuration file:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "task-management-db": {
      "command": "node",
      "args": ["/path/to/your/MCP server/src/index.js"],
      "env": {
        "MONGODB_URL": "mongodb://localhost:27017",
        "DATABASE_NAME": "task_management"
      }
    }
  }
}
```

## Usage Examples

Once connected, you can ask questions like:

- "What's the current database statistics?"
- "Show me all tasks with high priority"
- "Find all tasks for user testuser"
- "Search for tasks containing 'test'"
- "Get user statistics for testuser"
- "Show me all completed tasks"
- "What users are in the database?"

## Data Security

- User passwords are automatically excluded from all responses
- Read-only access to the database
- No modification capabilities for safety

## Development

### Project Structure
```
MCP server/
├── src/
│   ├── index.js      # Main MCP server
│   └── database.js   # MongoDB connection & queries
├── package.json      # Dependencies and scripts
├── .env             # Environment configuration
└── README.md        # This file
```

### Adding New Tools

1. Add the tool definition in the `ListToolsRequestSchema` handler
2. Add the implementation in the `CallToolRequestSchema` handler
3. Add corresponding database methods in `database.js` if needed

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure MongoDB is running and accessible
2. **Module Not Found**: Run `npm install` to install dependencies
3. **Claude Not Connecting**: Check the configuration file path and format

### Logs

The server logs connections and operations to the console. Check these for debugging information.

## License

MIT License