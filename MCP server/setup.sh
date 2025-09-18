#!/bin/bash

# MCP Task Management Server - Multi-Platform Setup Script
# This script sets up the MCP server for both Claude Desktop and OpenAI integration

echo "🚀 MCP Task Management Server Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the MCP server directory."
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking system dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install core MCP dependencies
echo "📦 Installing core MCP dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install core dependencies"
    exit 1
fi

echo "✅ Core dependencies installed"

# Install OpenAI dependencies (optional)
echo "🤖 Installing OpenAI integration dependencies..."
npm install openai express cors

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to install OpenAI dependencies. OpenAI integration won't work."
else
    echo "✅ OpenAI dependencies installed"
fi

# Check if MongoDB is running
echo "🗄️  Checking MongoDB connection..."
if command_exists mongosh; then
    mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is running and accessible"
    else
        echo "⚠️  Warning: MongoDB is not running or not accessible"
        echo "   Please start MongoDB before using the server"
    fi
else
    echo "⚠️  Warning: mongosh not found. Please install MongoDB"
fi

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# MCP Server Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=task_management
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

if [ ! -f ".env.openai" ]; then
    cat > .env.openai << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=task_management
PORT=3001
EOF
    echo "✅ Created .env.openai file"
    echo "   ⚠️  Don't forget to add your OpenAI API key to .env.openai"
else
    echo "✅ .env.openai file already exists"
fi

# Create Claude Desktop config if it doesn't exist
if [ ! -f "claude_desktop_config.json" ]; then
    CURRENT_DIR=$(pwd)
    cat > claude_desktop_config.json << EOF
{
  "mcpServers": {
    "task-management-db": {
      "command": "node",
      "args": ["$CURRENT_DIR/src/index.js"],
      "env": {
        "MONGODB_URL": "mongodb://localhost:27017",
        "DATABASE_NAME": "task_management"
      }
    }
  }
}
EOF
    echo "✅ Created claude_desktop_config.json"
    echo "   📋 Copy this configuration to your Claude Desktop settings"
else
    echo "✅ claude_desktop_config.json already exists"
fi

# Test MCP server
echo "🧪 Testing MCP server..."
timeout 10s node src/index.js >/dev/null 2>&1 &
TEST_PID=$!
sleep 2

if ps -p $TEST_PID > /dev/null; then
    echo "✅ MCP server starts successfully"
    kill $TEST_PID >/dev/null 2>&1
else
    echo "❌ MCP server failed to start"
fi

# Create convenience scripts
echo "📜 Creating convenience scripts..."

# Start script for MCP server
cat > start-mcp.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting MCP Server for Claude Desktop..."
node src/index.js
EOF
chmod +x start-mcp.sh

# Start script for OpenAI wrapper
cat > start-openai.sh << 'EOF'
#!/bin/bash
echo "🤖 Starting OpenAI Wrapper Server..."
if [ ! -f ".env.openai" ]; then
    echo "❌ .env.openai file not found"
    exit 1
fi

# Check if API key is set
if grep -q "your-api-key-here" .env.openai; then
    echo "⚠️  Warning: Please set your OpenAI API key in .env.openai"
    echo "   Current value: your-api-key-here"
    echo "   Update with: OPENAI_API_KEY=sk-..."
fi

node openai-wrapper.js
EOF
chmod +x start-openai.sh

# Test script
cat > test-setup.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing MCP Setup..."

echo "1. Testing MongoDB connection..."
if command -v mongosh >/dev/null 2>&1; then
    mongosh --eval "db.runCommand('ping')" --quiet
    if [ $? -eq 0 ]; then
        echo "   ✅ MongoDB connection successful"
    else
        echo "   ❌ MongoDB connection failed"
    fi
else
    echo "   ❌ mongosh not found"
fi

echo "2. Testing MCP server..."
timeout 5s node src/index.js >/dev/null 2>&1 &
if [ $? -eq 0 ]; then
    echo "   ✅ MCP server can start"
else
    echo "   ❌ MCP server failed to start"
fi

echo "3. Testing OpenAI wrapper..."
if [ -f "openai-wrapper.js" ]; then
    echo "   ✅ OpenAI wrapper file exists"
    if npm list openai >/dev/null 2>&1; then
        echo "   ✅ OpenAI dependency installed"
    else
        echo "   ❌ OpenAI dependency missing"
    fi
else
    echo "   ❌ OpenAI wrapper file missing"
fi

echo "4. Checking environment files..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ❌ .env file missing"
fi

if [ -f ".env.openai" ]; then
    echo "   ✅ .env.openai file exists"
    if grep -q "your-api-key-here" .env.openai; then
        echo "   ⚠️  OpenAI API key not set"
    else
        echo "   ✅ OpenAI API key configured"
    fi
else
    echo "   ❌ .env.openai file missing"
fi

echo "Setup test complete!"
EOF
chmod +x test-setup.sh

echo "✅ Created convenience scripts:"
echo "   - start-mcp.sh: Start MCP server for Claude Desktop"
echo "   - start-openai.sh: Start OpenAI wrapper server"
echo "   - test-setup.sh: Test the setup"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. For Claude Desktop:"
echo "   - Copy claude_desktop_config.json content to Claude Desktop settings"
echo "   - Restart Claude Desktop"
echo "   - Start asking questions about your database!"
echo ""
echo "2. For OpenAI Integration:"
echo "   - Add your OpenAI API key to .env.openai"
echo "   - Run: ./start-openai.sh"
echo "   - Open chat-interface.html in your browser"
echo ""
echo "3. Test your setup:"
echo "   - Run: ./test-setup.sh"
echo ""
echo "💡 Quick Commands:"
echo "   ./start-mcp.sh      # Start for Claude Desktop"
echo "   ./start-openai.sh   # Start for OpenAI"
echo "   ./test-setup.sh     # Test everything"
echo ""
echo "🔗 Available Database Tools:"
echo "   - Get database statistics"
echo "   - User management queries"
echo "   - Task operations and filtering"
echo "   - Search and analytics"
echo ""
echo "Happy querying! 🚀"