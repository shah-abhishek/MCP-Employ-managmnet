import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.gemini' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function listModels() {
  const url = `${BASE_URL}?key=${GEMINI_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed to list models:', res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log('Available Gemini models for your API key:');
  if (data.models) {
    data.models.forEach(model => {
      console.log(`- ${model.name}`);
    });
  } else {
    console.log('No models found or insufficient permissions.');
  }
}

listModels();
