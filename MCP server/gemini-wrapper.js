import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './src/database.js';
import fetch from 'node-fetch';

// Load Gemini-specific environment
dotenv.config({ path: '.env.gemini' });

const app = express();
const port = process.env.PORT || 3002;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

app.use(cors());
app.use(express.json());

// Helper: Call Gemini API
async function callGemini(messages) {
  const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  // Gemini returns candidates[0].content.parts[0].text
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
}

// Main chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const messages = [
      { role: 'system', content: 'You are a helpful assistant with access to a task management database.' },
      ...conversation,
      { role: 'user', content: message }
    ];
    // Call Gemini
    const geminiResponse = await callGemini(messages);
    // TODO: Save conversation to MongoDB
    res.json({ response: geminiResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: db.isConnected, timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management Gemini MCP Wrapper',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /health'
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
    console.log(`🚀 Gemini MCP Wrapper running on http://localhost:${port}`);
    console.log(`📊 Database connected: ${db.isConnected}`);
    console.log(`🔧 Available endpoints:`);
    console.log(`   POST /chat - Main chat interface`);
    console.log(`   GET /health - Health check`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await db.disconnect();
  process.exit(0);
});

startServer().catch(console.error);
