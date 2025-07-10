require('dotenv/config');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Azure OpenAI REST API endpoint and deployment info from .env
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';

router.use(express.json());

// Read system prompt from .env or from a file if specified
let SYSTEM_PROMPT = process.env.AZURE_OPENAI_SYSTEM_PROMPT;
if (process.env.AZURE_OPENAI_SYSTEM_PROMPT_FILE) {
  try {
    const promptPath = path.resolve(process.env.AZURE_OPENAI_SYSTEM_PROMPT_FILE);
    SYSTEM_PROMPT = fs.readFileSync(promptPath, 'utf8');
    console.log('[aiChat.js] Loaded system prompt from file:', promptPath);
  } catch (err) {
    console.error('[aiChat.js] Failed to read system prompt file:', err);
  }
}

router.post('/ai-chat', async (req, res) => {
  try {
    const { question, results } = req.body;
    console.log('[aiChat.js] Received /ai-chat POST');
    console.log('[aiChat.js] question:', question);
    console.log('[aiChat.js] results:', Array.isArray(results) ? `Array of length ${results.length}` : results);
    // Compose prompt for the AI
    const prompt = `Search Results: ${JSON.stringify(results, null, 2)}\nUser: ${question}`;

    // Prepare request to Azure OpenAI /chat/completions endpoint
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    const headers = {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    };
    const data = {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    console.log('[aiChat.js] Sending request to Azure OpenAI /chat/completions...');
    const response = await axios.post(url, data, { headers });
    const aiMessage = response.data.choices?.[0]?.message?.content || 'No response.';
    console.log('[aiChat.js] AI response:', aiMessage);
    res.json({ answer: aiMessage });
  } catch (error) {
    console.error('[aiChat.js] Error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});

module.exports = router;
