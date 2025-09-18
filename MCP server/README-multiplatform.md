# Task Management MCP Server - Multi-Platform Support

A Model Context Protocol (MCP) server that provides access to your task management MongoDB database through multiple AI platforms.

## 🤖 Supported AI Platforms

### 1. **Claude Desktop** (Native MCP Support)
- Direct integration through MCP protocol
- Configuration via `claude_desktop_config.json`

### 2. **OpenAI ChatGPT** (Function Calling)
- HTTP API wrapper with OpenAI function calling
- Web interface for testing
- Integration with GPT-4/GPT-3.5

### 3. **Custom Applications**
- RESTful API endpoints
- Easy integration with any AI platform
- Standard HTTP interface

## 🚀 Quick Setup

### For Claude Desktop:
```bash
npm install
# Add configuration to Claude Desktop
# Server runs automatically
```

### For OpenAI:
```bash
npm install openai express cors
# Set OPENAI_API_KEY in .env.openai
node openai-wrapper.js
# Open chat-interface.html in browser
```

## 📋 Available Database Tools

### **Analytics & Statistics**
- `get_database_stats` - User count, task count, status/priority breakdowns
- `get_user_task_stats` - Individual user statistics

### **User Management**
- `get_all_users` - List all users (secure, no passwords)
- `get_user_by_id` - Find user by MongoDB ObjectId
- `get_user_by_username` - Find user by username

### **Task Operations**
- `get_all_tasks` - List all tasks
- `get_task_by_id` - Find specific task
- `get_tasks_by_user` - Tasks for specific user
- `get_tasks_by_status` - Filter by status
- `get_tasks_by_priority` - Filter by priority  
- `search_tasks` - Search by content/tags

## 🔧 Platform-Specific Setup

### Claude Desktop Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Claude Desktop:**
   Add to your Claude Desktop config file:
   ```json
   {
     "mcpServers": {
       "task-management-db": {
         "command": "node",
         "args": ["/path/to/MCP server/src/index.js"],
         "env": {
           "MONGODB_URL": "mongodb://localhost:27017",
           "DATABASE_NAME": "task_management"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### OpenAI Setup

1. **Install additional dependencies:**
   ```bash
   npm install openai express cors
   ```

2. **Configure OpenAI API:**
   Copy `.env.openai` and add your API key:
   ```env
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=task_management
   PORT=3001
   ```

3. **Start the OpenAI wrapper:**
   ```bash
   node openai-wrapper.js
   ```

4. **Use the web interface:**
   Open `chat-interface.html` in your browser or integrate with your own app.

### API Endpoints (OpenAI Mode)

- `POST /chat` - Main chat interface
- `GET /health` - Server health check
- `GET /functions` - Available database functions
- `GET /` - API information

## 💬 Example Conversations

### With Claude Desktop:
Just ask natural questions:
- "What's the current database status?"
- "Show me high priority tasks"
- "Find tasks for testuser"

### With OpenAI Web Interface:
Same natural language queries work through the web interface.

### With Custom Integration:
```javascript
const response = await fetch('http://localhost:3001/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Show me all completed tasks",
    conversation: []
  })
});
```

## 🛡️ Security Features

- **Read-only database access**
- **Password exclusion** - User passwords never exposed
- **Input validation** - All parameters validated
- **Error handling** - Graceful error responses
- **CORS protection** - Configurable origins

## 🔧 Architecture

```
MCP Server/
├── src/
│   ├── index.js              # MCP server (Claude Desktop)
│   └── database.js           # MongoDB connection & queries
├── openai-wrapper.js         # OpenAI function calling wrapper
├── chat-interface.html       # Web testing interface
├── package.json              # Core dependencies
├── .env                      # MCP configuration  
├── .env.openai              # OpenAI configuration
└── claude_desktop_config.json # Claude Desktop setup
```

## 🚀 Why Multi-Platform?

### **Claude Desktop**
- ✅ Native MCP support
- ✅ Seamless integration
- ✅ Auto-discovery of tools

### **OpenAI**
- ✅ Function calling support
- ✅ Web interface available
- ✅ Custom app integration
- ✅ Broader ecosystem

### **Custom Platforms**
- ✅ RESTful API
- ✅ Any AI provider
- ✅ Custom implementations

## 🔄 Development

### Adding New Database Functions

1. **Add to database.js:**
   ```javascript
   async newFunction(params) {
     // Implementation
   }
   ```

2. **Add to MCP server (index.js):**
   ```javascript
   // Tool definition + handler
   ```

3. **Add to OpenAI wrapper:**
   ```javascript
   // Function definition + executor
   ```

## 📊 Current Database

Your database contains:
- **Users**: testuser (and others you add)
- **Tasks**: Test tasks with various statuses and priorities
- **Real-time data**: Live connection to MongoDB

## 🤝 Choose Your Preferred Platform

- **For Claude users**: Use the MCP server directly
- **For OpenAI users**: Use the HTTP wrapper
- **For developers**: Build on the API endpoints
- **For everyone**: Web interface works immediately

The same powerful database querying capabilities work across all platforms! 🎉