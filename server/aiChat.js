// ...existing code...
require('dotenv/config');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Dedicated intent model config from .env
const AZURE_OPENAI_INTENT_KEY = process.env.AZURE_OPENAI_INTENT_KEY;
const AZURE_OPENAI_INTENT_ENDPOINT = process.env.AZURE_OPENAI_INTENT_ENDPOINT;
const AZURE_OPENAI_INTENT_DEPLOYMENT = process.env.AZURE_OPENAI_INTENT_DEPLOYMENT;
const AZURE_OPENAI_INTENT_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';
let INTENT_SYSTEM_PROMPT = process.env.AZURE_OPENAI_INTENT_PROMPT;
if (process.env.AZURE_OPENAI_INTENT_PROMPT_FILE) {
  try {
    const intentPromptPath = path.resolve(process.env.AZURE_OPENAI_INTENT_PROMPT_FILE);
    INTENT_SYSTEM_PROMPT = fs.readFileSync(intentPromptPath, 'utf8');
    console.log('[aiChat.js] Loaded intent system prompt from file:', intentPromptPath);
  } catch (err) {
    console.error('[aiChat.js] Failed to read intent system prompt file:', err);
  }
}

// New endpoint for intent detection using the dedicated intent model
router.post('/ai-intent', async (req, res) => {
  try {
    const { question } = req.body;
    console.log('[aiChat.js] Received /ai-intent POST');
    console.log('[aiChat.js] question:', question);

    const systemPrompt = INTENT_SYSTEM_PROMPT || "You are an intent classifier. Given a user message, classify the intent as one of: 'analyze_results', 'search', or 'general'. Only return the intent label.";
    const prompt = question;

    // Prepare request to Azure OpenAI /chat/completions endpoint for intent model
    const url = `${AZURE_OPENAI_INTENT_ENDPOINT}/openai/deployments/${AZURE_OPENAI_INTENT_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_INTENT_API_VERSION}`;
    const headers = {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_INTENT_KEY,
    };
    const data = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 16,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    console.log('[aiChat.js] Sending request to Azure OpenAI INTENT /chat/completions...');
    const response = await axios.post(url, data, { headers });
    const aiMessage = response.data.choices?.[0]?.message?.content || 'No response.';
    console.log('[aiChat.js] Intent model response:', aiMessage);
    res.json({ intent: aiMessage.trim() });
  } catch (error) {
    console.error('[aiChat.js] Error in /ai-intent:', error?.response?.data || error.message || error);
    res.status(500).json({ error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});

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

    let systemPrompt = SYSTEM_PROMPT;
    let prompt;
    if (results && Array.isArray(results) && results.length > 0) {
      prompt = `Search Results: ${JSON.stringify(results, null, 2)}\nUser: ${question}`;
    } else {
      prompt = question;
    }

    // Prepare request to Azure OpenAI /chat/completions endpoint
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    const headers = {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    };
    const data = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
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

// --- AI Search Query Endpoint ---
// This endpoint takes a user question and returns a generated search JSON using Azure OpenAI
router.post('/ai-search-query', async (req, res) => {
  try {
    const { question } = req.body;
    console.log('[aiChat.js] Received /ai-search-query POST');
    console.log('[aiChat.js] question:', question);


    // Use the same system prompt as /ai-chat (from answer-system-prompt.txt or env)
    let searchSystemPrompt = SYSTEM_PROMPT;
    if (!searchSystemPrompt) {
      searchSystemPrompt = process.env.AZURE_OPENAI_SYSTEM_PROMPT || '';
    }

    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    const headers = {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    };
    const data = {
      messages: [
        { role: 'system', content: searchSystemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    console.log('[aiChat.js] Sending request to Azure OpenAI for search JSON...');
    const response = await axios.post(url, data, { headers });
    const aiMessage = response.data.choices?.[0]?.message?.content || '{}';
    console.log('[aiChat.js] Raw model output for /ai-search-query:', aiMessage);
    let searchJson;
    try {
      searchJson = JSON.parse(aiMessage);
      return res.json({ search: searchJson, isJson: true });
    } catch (err) {
      // If the model returns extra text, try to extract JSON
      const match = aiMessage.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          searchJson = JSON.parse(match[0]);
          return res.json({ search: searchJson, isJson: true });
        } catch (parseErr) {
          // fall through to send raw text
        }
      }
      // If not valid JSON, return the raw text and isJson: false
      return res.json({ result: aiMessage, isJson: false });
    }
  } catch (error) {
    console.error('[aiChat.js] Error in /ai-search-query:', error?.response?.data || error.message || error);
    res.status(500).json({ error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});
