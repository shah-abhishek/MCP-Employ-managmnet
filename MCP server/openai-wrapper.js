import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import db from './src/database.js';

// Load OpenAI-specific environment
dotenv.config({ path: '.env.openai' });

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Database tools definition for OpenAI function calling
const tools = [
  {
    type: "function",
    function: {
      name: "get_database_stats",
      description: "Get overall database statistics including user count, task count, and breakdowns by status/priority",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_users",
      description: "Get all users from the database (passwords excluded for security)",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of users to return (default: 100)",
            default: 100,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_by_username",
      description: "Get a specific user by their username",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The username to search for",
          },
        },
        required: ["username"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_tasks",
      description: "Get all tasks from the database",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of tasks to return (default: 100)",
            default: 100,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tasks_by_status",
      description: "Get all tasks with a specific status",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Task status",
            enum: ["todo", "in_progress", "completed", "cancelled"],
          },
        },
        required: ["status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tasks_by_priority",
      description: "Get all tasks with a specific priority",
      parameters: {
        type: "object",
        properties: {
          priority: {
            type: "string",
            description: "Task priority",
            enum: ["low", "medium", "high", "urgent"],
          },
        },
        required: ["priority"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_tasks",
      description: "Search tasks by title, description, or tags",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description: "Search term to look for in task title, description, or tags",
          },
        },
        required: ["searchTerm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tasks_by_user",
      description: "Get all tasks created by or assigned to a specific user",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "The user ID or username to search for",
          },
        },
        required: ["userId"],
      },
    },
  },
];

// Function to execute database operations
async function executeFunction(name, args) {
  try {
    switch (name) {
      case 'get_database_stats':
        return await db.getDatabaseStats();
      
      case 'get_all_users':
        const limit = args?.limit || 100;
        return await db.getUsers({}, limit);
      
      case 'get_user_by_username':
        if (!args?.username) throw new Error('username is required');
        return await db.getUserByUsername(args.username);
      
      case 'get_all_tasks':
        const taskLimit = args?.limit || 100;
        return await db.getTasks({}, taskLimit);
      
      case 'get_tasks_by_status':
        if (!args?.status) throw new Error('status is required');
        return await db.getTasksByStatus(args.status);
      
      case 'get_tasks_by_priority':
        if (!args?.priority) throw new Error('priority is required');
        return await db.getTasksByPriority(args.priority);
      
      case 'search_tasks':
        if (!args?.searchTerm) throw new Error('searchTerm is required');
        return await db.searchTasks(args.searchTerm);
      
      case 'get_tasks_by_user':
        if (!args?.userId) throw new Error('userId is required');
        // Handle both username and ObjectId
        let userId = args.userId;
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
          const user = await db.getUserByUsername(userId);
          if (!user) throw new Error('User not found');
          userId = user._id.toString();
        }
        return await db.getTasksByUser(userId);
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error) {
    throw new Error(`Function execution failed: ${error.message}`);
  }
}

// Main chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant with access to a task management database. You can query users, tasks, and get statistics. 
        
Current database contains:
- Users with usernames, emails, and profile information
- Tasks with titles, descriptions, status (todo/in_progress/completed/cancelled), priority (low/medium/high/urgent), tags, and assignments

When users ask questions about the database, use the available functions to get accurate, real-time data. Always provide helpful, formatted responses.`
      },
      ...conversation,
      { role: "user", content: message }
    ];

    // Make OpenAI API call with function calling
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const assistantMessage = response.choices[0].message;
    
    // Handle function calls
    if (assistantMessage.tool_calls) {
      const functionResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        try {
          const result = await executeFunction(functionName, functionArgs);
          functionResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result, null, 2)
          });
        } catch (error) {
          functionResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: `Error: ${error.message}`
          });
        }
      }
      
      // Get final response with function results
      const finalResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          ...messages,
          assistantMessage,
          ...functionResults
        ],
      });
      
      res.json({
        response: finalResponse.choices[0].message.content,
        functionCalls: assistantMessage.tool_calls.map(tc => ({
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        }))
      });
    } else {
      res.json({
        response: assistantMessage.content,
        functionCalls: []
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    database: db.isConnected,
    timestamp: new Date().toISOString()
  });
});

// Available functions endpoint
app.get('/functions', (req, res) => {
  res.json({
    functions: tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }))
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management OpenAI MCP Wrapper',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /health',
      functions: 'GET /functions'
    }
  });
});

async function startServer() {
  // Connect to database
  const connected = await db.connect();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`🚀 OpenAI MCP Wrapper running on http://localhost:${port}`);
    console.log(`📊 Database connected: ${db.isConnected}`);
    console.log(`🔧 Available endpoints:`);
    console.log(`   POST /chat - Main chat interface`);
    console.log(`   GET /health - Health check`);
    console.log(`   GET /functions - Available functions`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await db.disconnect();
  process.exit(0);
});

startServer().catch(console.error);