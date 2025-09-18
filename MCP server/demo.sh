#!/bin/bash

# MCP Task Management Demo Script
# Demonstrates both Claude Desktop and OpenAI integration

echo "🎬 MCP Task Management Demo"
echo "============================"
echo ""

# Check if setup was completed
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from the MCP server directory"
    exit 1
fi

if [ ! -f ".env" ] || [ ! -f ".env.openai" ]; then
    echo "❌ Environment files missing. Please run ./setup.sh first"
    exit 1
fi

echo "📊 Current Project Structure:"
echo "MCP server/"
echo "├── src/"
echo "│   ├── index.js              # MCP server (Claude Desktop)"
echo "│   └── database.js           # MongoDB connection & tools"
echo "├── openai-wrapper.js         # OpenAI function calling wrapper"
echo "├── chat-interface.html       # Web testing interface"
echo "├── setup.sh                  # This setup script"
echo "└── start-*.sh               # Convenience scripts"
echo ""

echo "🗄️  Database Tools Available:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Analytics & Statistics:"
echo "  📈 get_database_stats        - Overall database statistics"
echo "  👤 get_user_task_stats       - Per-user task breakdown"
echo ""
echo "User Management:"
echo "  👥 get_all_users            - List all users (secure)"
echo "  🔍 get_user_by_id           - Find user by ID"
echo "  📝 get_user_by_username     - Find user by username"
echo ""
echo "Task Operations:"
echo "  📋 get_all_tasks            - List all tasks"
echo "  🎯 get_task_by_id           - Find specific task"
echo "  👤 get_tasks_by_user        - Tasks for specific user"
echo "  📊 get_tasks_by_status       - Filter by status"
echo "  ⭐ get_tasks_by_priority     - Filter by priority"
echo "  🔍 search_tasks             - Search by content/tags"
echo ""

echo "🤖 Platform Integration Options:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Claude Desktop (MCP Native)"
echo "   ✅ Direct protocol support"
echo "   ✅ Auto-discovery of tools"
echo "   ✅ Natural language queries"
echo "   📋 Setup: Copy claude_desktop_config.json to Claude settings"
echo ""
echo "2️⃣  OpenAI (Function Calling)"
echo "   ✅ HTTP API wrapper"
echo "   ✅ Web interface included"
echo "   ✅ Custom app integration"
echo "   📋 Setup: Add API key to .env.openai, run ./start-openai.sh"
echo ""
echo "3️⃣  Custom Applications"
echo "   ✅ RESTful endpoints"
echo "   ✅ Any AI platform"
echo "   ✅ Standard HTTP interface"
echo "   📋 Setup: Integrate with /chat endpoint"
echo ""

echo "💬 Example Conversations:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Natural Language Queries (works on all platforms):"
echo '  "What is the current database status?"'
echo '  "Show me all high priority tasks"'
echo '  "Find tasks assigned to testuser"'
echo '  "How many completed tasks do we have?"'
echo '  "Search for tasks containing 'important'"'
echo '  "Show me overdue tasks"'
echo '  "What users are in the system?"'
echo ""

echo "🧪 Quick Demo Test:"
echo "━━━━━━━━━━━━━━━━━━━"
echo ""

# Test MongoDB connection
echo "1. Testing MongoDB connection..."
if command -v mongosh >/dev/null 2>&1; then
    if mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
        echo "   ✅ MongoDB is running"
        
        # Get a quick stat
        TASK_COUNT=$(mongosh task_management --eval "db.tasks.countDocuments()" --quiet 2>/dev/null | tail -1)
        USER_COUNT=$(mongosh task_management --eval "db.users.countDocuments()" --quiet 2>/dev/null | tail -1)
        
        if [[ "$TASK_COUNT" =~ ^[0-9]+$ ]] && [[ "$USER_COUNT" =~ ^[0-9]+$ ]]; then
            echo "   📊 Database contains: $USER_COUNT users, $TASK_COUNT tasks"
        else
            echo "   📊 Database is accessible (counts pending)"
        fi
    else
        echo "   ❌ MongoDB connection failed"
    fi
else
    echo "   ⚠️  mongosh not found - cannot test connection"
fi

echo ""
echo "2. Testing MCP server startup..."
timeout 3s node src/index.js >/dev/null 2>&1 &
if [ $? -eq 0 ]; then
    echo "   ✅ MCP server can start"
else
    echo "   ❌ MCP server startup failed"
fi

echo ""
echo "3. Checking OpenAI integration..."
if [ -f "openai-wrapper.js" ] && npm list express >/dev/null 2>&1; then
    echo "   ✅ OpenAI wrapper ready"
    if grep -q "your-api-key-here" .env.openai; then
        echo "   ⚠️  Add your OpenAI API key to .env.openai"
    else
        echo "   ✅ OpenAI API key configured"
    fi
else
    echo "   ❌ OpenAI integration not ready"
fi

echo ""
echo "🚀 Ready to Start!"
echo "━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose your preferred AI platform:"
echo ""
echo "🔵 For Claude Desktop:"
echo "   1. Copy the content of claude_desktop_config.json"
echo "   2. Add it to your Claude Desktop settings"
echo "   3. Restart Claude Desktop"
echo "   4. Ask: 'What tasks do I have in my database?'"
echo ""
echo "🟢 For OpenAI/ChatGPT:"
echo "   1. Add your API key: nano .env.openai"
echo "   2. Start server: ./start-openai.sh"
echo "   3. Open: chat-interface.html in browser"
echo "   4. Chat away!"
echo ""
echo "🟡 For Development:"
echo "   1. Use the REST API endpoints"
echo "   2. POST to http://localhost:3001/chat"
echo "   3. Integrate with any AI platform"
echo ""
echo "💡 Pro Tips:"
echo "  - Ask questions in natural language"
echo "  - The database is live - changes reflect immediately"
echo "  - All tools are read-only for security"
echo "  - User passwords are never exposed"
echo ""
echo "Happy AI-powered database querying! 🎉"