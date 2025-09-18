#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import db from './database.js';

const server = new Server(
  {
    name: 'task-management-db-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to format results
function formatResult(data, type = 'data') {
  if (!data) {
    return `No ${type} found.`;
  }
  
  if (Array.isArray(data) && data.length === 0) {
    return `No ${type} found.`;
  }
  
  return JSON.stringify(data, null, 2);
}

// Helper function to validate ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_database_stats',
        description: 'Get overall database statistics including user count, task count, and breakdowns by status/priority',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_all_users',
        description: 'Get all users from the database (passwords excluded for security)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of users to return (default: 100)',
              default: 100,
            },
          },
        },
      },
      {
        name: 'get_user_by_id',
        description: 'Get a specific user by their ID',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the user',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_user_by_username',
        description: 'Get a specific user by their username',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'The username to search for',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_all_tasks',
        description: 'Get all tasks from the database',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of tasks to return (default: 100)',
              default: 100,
            },
          },
        },
      },
      {
        name: 'get_task_by_id',
        description: 'Get a specific task by its ID',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The MongoDB ObjectId of the task',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'get_tasks_by_user',
        description: 'Get all tasks created by or assigned to a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The user ID to search for (can be ObjectId or username)',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_tasks_by_status',
        description: 'Get all tasks with a specific status',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Task status (todo, in_progress, completed, cancelled)',
              enum: ['todo', 'in_progress', 'completed', 'cancelled'],
            },
          },
          required: ['status'],
        },
      },
      {
        name: 'get_tasks_by_priority',
        description: 'Get all tasks with a specific priority',
        inputSchema: {
          type: 'object',
          properties: {
            priority: {
              type: 'string',
              description: 'Task priority (low, medium, high, urgent)',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
          },
          required: ['priority'],
        },
      },
      {
        name: 'search_tasks',
        description: 'Search tasks by title, description, or tags',
        inputSchema: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description: 'Search term to look for in task title, description, or tags',
            },
          },
          required: ['searchTerm'],
        },
      },
      {
        name: 'get_user_task_stats',
        description: 'Get task statistics for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The user ID to get statistics for',
            },
          },
          required: ['userId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_database_stats': {
        const stats = await db.getDatabaseStats();
        return {
          content: [
            {
              type: 'text',
              text: `Database Statistics:
              
📊 **Overview**
- Total Users: ${stats.userCount}
- Total Tasks: ${stats.taskCount}

📋 **Tasks by Status**
${Object.entries(stats.tasksByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

⚡ **Tasks by Priority**
${Object.entries(stats.tasksByPriority).map(([priority, count]) => `- ${priority}: ${count}`).join('\n')}

🕒 **Recent Tasks**
${stats.recentTasks.map(task => `- "${task.title}" (${task.status}) - ${new Date(task.created_at).toLocaleDateString()}`).join('\n')}`,
            },
          ],
        };
      }

      case 'get_all_users': {
        const limit = args?.limit || 100;
        const users = await db.getUsers({}, limit);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${users.length} users:\n\n${formatResult(users, 'users')}`,
            },
          ],
        };
      }

      case 'get_user_by_id': {
        if (!args?.userId) {
          throw new Error('userId is required');
        }
        
        if (!isValidObjectId(args.userId)) {
          throw new Error('Invalid user ID format');
        }
        
        const user = await db.getUserById(args.userId);
        return {
          content: [
            {
              type: 'text',
              text: user ? formatResult(user, 'user') : 'User not found',
            },
          ],
        };
      }

      case 'get_user_by_username': {
        if (!args?.username) {
          throw new Error('username is required');
        }
        
        const user = await db.getUserByUsername(args.username);
        return {
          content: [
            {
              type: 'text',
              text: user ? formatResult(user, 'user') : 'User not found',
            },
          ],
        };
      }

      case 'get_all_tasks': {
        const limit = args?.limit || 100;
        const tasks = await db.getTasks({}, limit);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks:\n\n${formatResult(tasks, 'tasks')}`,
            },
          ],
        };
      }

      case 'get_task_by_id': {
        if (!args?.taskId) {
          throw new Error('taskId is required');
        }
        
        if (!isValidObjectId(args.taskId)) {
          throw new Error('Invalid task ID format');
        }
        
        const task = await db.getTaskById(args.taskId);
        return {
          content: [
            {
              type: 'text',
              text: task ? formatResult(task, 'task') : 'Task not found',
            },
          ],
        };
      }

      case 'get_tasks_by_user': {
        if (!args?.userId) {
          throw new Error('userId is required');
        }
        
        // If it looks like a username, get the user first
        let userId = args.userId;
        if (!isValidObjectId(userId)) {
          const user = await db.getUserByUsername(userId);
          if (!user) {
            throw new Error('User not found');
          }
          userId = user._id.toString();
        }
        
        const tasks = await db.getTasksByUser(userId);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks for user:\n\n${formatResult(tasks, 'tasks')}`,
            },
          ],
        };
      }

      case 'get_tasks_by_status': {
        if (!args?.status) {
          throw new Error('status is required');
        }
        
        const tasks = await db.getTasksByStatus(args.status);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks with status "${args.status}":\n\n${formatResult(tasks, 'tasks')}`,
            },
          ],
        };
      }

      case 'get_tasks_by_priority': {
        if (!args?.priority) {
          throw new Error('priority is required');
        }
        
        const tasks = await db.getTasksByPriority(args.priority);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks with priority "${args.priority}":\n\n${formatResult(tasks, 'tasks')}`,
            },
          ],
        };
      }

      case 'search_tasks': {
        if (!args?.searchTerm) {
          throw new Error('searchTerm is required');
        }
        
        const tasks = await db.searchTasks(args.searchTerm);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks matching "${args.searchTerm}":\n\n${formatResult(tasks, 'tasks')}`,
            },
          ],
        };
      }

      case 'get_user_task_stats': {
        if (!args?.userId) {
          throw new Error('userId is required');
        }
        
        // If it looks like a username, get the user first
        let userId = args.userId;
        if (!isValidObjectId(userId)) {
          const user = await db.getUserByUsername(userId);
          if (!user) {
            throw new Error('User not found');
          }
          userId = user._id.toString();
        }
        
        const stats = await db.getUserTaskStats(userId);
        return {
          content: [
            {
              type: 'text',
              text: `Task Statistics for User:

📈 **Task Counts**
- Created Tasks: ${stats.createdTasks}
- Assigned Tasks: ${stats.assignedTasks}

📊 **Status Breakdown**
${Object.entries(stats.statusBreakdown).map(([status, count]) => `- ${status}: ${count}`).join('\n')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  // Connect to database
  const connected = await db.connect();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await db.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down server...');
    await db.disconnect();
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Task Management MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});