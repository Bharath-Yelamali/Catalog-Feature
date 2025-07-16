/**
 * aiChat.js
 *
 * Express router for AI-powered endpoints using Azure OpenAI.
 * Provides:
 *   - /ai-intent: Classifies user intent from a message
 *   - /ai-chat: Generates conversational responses (optionally with search results)
 *   - /ai-search-query: Generates a search JSON from a user query (optionally with context)
 *
 * Helper functions for prompt loading and Azure OpenAI requests are included at the bottom.
 */
// ...existing code...
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// ...helpers moved to bottom...

// Dedicated intent model config from .env
const AZURE_OPENAI_INTENT_KEY = process.env.AZURE_OPENAI_INTENT_KEY;
const AZURE_OPENAI_INTENT_ENDPOINT = process.env.AZURE_OPENAI_INTENT_ENDPOINT;
const AZURE_OPENAI_INTENT_DEPLOYMENT = process.env.AZURE_OPENAI_INTENT_DEPLOYMENT;
const AZURE_OPENAI_INTENT_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';
const INTENT_SYSTEM_PROMPT = loadPrompt('AZURE_OPENAI_INTENT_PROMPT', 'AZURE_OPENAI_INTENT_PROMPT_FILE', 'intent system prompt');

/**
 * POST /ai-intent
 * Detects the intent of a user question using a dedicated intent model.
 * Request body: { question: string }
 * Response: { success: boolean, intent?: string, error?: string }
 */
// New endpoint for intent detection using the dedicated intent model
router.post('/ai-intent', async (req, res) => {
  try {
    const { question } = req.body;
    // ...

    const systemPrompt = INTENT_SYSTEM_PROMPT || "You are an intent classifier. Given a user message, classify the intent as one of: 'analyze_results', 'search', or 'general'. Only return the intent label.";
    const aiMessage = await sendOpenAIChatRequest({
      endpoint: AZURE_OPENAI_INTENT_ENDPOINT,
      deployment: AZURE_OPENAI_INTENT_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_INTENT_API_VERSION,
      apiKey: AZURE_OPENAI_INTENT_KEY,
      systemPrompt,
      userPrompt: question,
      temperature: 0,
      maxTokens: 16
    });
    res.json({ success: true, intent: aiMessage.trim() });
  } catch (error) {
    // ...
    res.status(500).json({ success: false, error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});

// Azure OpenAI REST API endpoint and deployment info from .env
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';


// Read system prompt from .env or from a file if specified
const SYSTEM_PROMPT = loadPrompt('AZURE_OPENAI_SYSTEM_PROMPT', 'AZURE_OPENAI_SYSTEM_PROMPT_FILE', 'system prompt');


/**
 * POST /ai-chat
 * Generates an AI chat response to a user question, optionally using search results.
 * Request body: { question: string, results?: any[] }
 * Response: { success: boolean, answer?: string, error?: string }
 */
router.post('/ai-chat', async (req, res) => {
  try {
    const { question, results } = req.body;
    // ...

    let systemPrompt = SYSTEM_PROMPT;
    let prompt;
    if (results && Array.isArray(results) && results.length > 0) {
      prompt = `Search Results: ${JSON.stringify(results, null, 2)}\nUser: ${question}`;
    } else {
      prompt = question;
    }
    const aiMessage = await sendOpenAIChatRequest({
      endpoint: AZURE_OPENAI_ENDPOINT,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_API_VERSION,
      apiKey: AZURE_OPENAI_KEY,
      systemPrompt,
      userPrompt: prompt,
      temperature: 0,
      maxTokens: 512
    });
    res.json({ success: true, answer: aiMessage });
  } catch (error) {
    // ...
    res.status(500).json({ success: false, error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});


// === Helper Functions ===

/**
 * Sends a request to the Azure OpenAI chat completions endpoint.
 * @param {Object} params
 * @param {string} params.endpoint - The Azure OpenAI endpoint URL
 * @param {string} params.deployment - The deployment name
 * @param {string} params.apiVersion - The API version
 * @param {string} params.apiKey - The API key
 * @param {string} params.systemPrompt - The system prompt
 * @param {string} params.userPrompt - The user prompt
 * @param {number} params.temperature - The temperature for the model
 * @param {number} params.maxTokens - The max tokens for the response
 * @returns {Promise<string>} The model's response message content
 */
// Helper to send a request to Azure OpenAI chat completions endpoint
async function sendOpenAIChatRequest({ endpoint, deployment, apiVersion, apiKey, systemPrompt, userPrompt, temperature, maxTokens }) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const headers = {
    'Content-Type': 'application/json',
    'api-key': apiKey,
  };
  const data = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  const response = await axios.post(url, data, { headers });
  return response.data.choices?.[0]?.message?.content || '';
}

/**
 * Loads a prompt from an environment variable or a file specified by an environment variable.
 * @param {string} envVar - The environment variable for the prompt string
 * @param {string} fileEnvVar - The environment variable for the prompt file path
 * @param {string} label - A label for logging or debugging
 * @returns {string|undefined} The loaded prompt string, or undefined if not found
 */
// Helper to load prompt from env or file
function loadPrompt(envVar, fileEnvVar, label) {
  if (process.env[fileEnvVar]) {
    try {
      const promptPath = path.resolve(process.env[fileEnvVar]);
      const prompt = fs.readFileSync(promptPath, 'utf8');
      return prompt;
    } catch (err) {
      // Silently fail
    }
  }
  return process.env[envVar];
}

/**
 * POST /ai-search-query
 * Generates a search JSON from a user question, optionally using previous queries and search context.
 * Request body: { question: string, previousQuery?: string, previousSearch?: object, logicalOperator?: string }
 * Response: { success: boolean, search?: object, isJson?: boolean, result?: string, error?: string }
 */
// --- AI Search Query Endpoint ---
// This endpoint takes a user question and returns a generated search JSON using Azure OpenAI
router.post('/ai-search-query', async (req, res) => {
  try {
    // Log the full payload received for debugging
    // ...
    const { question, previousQuery, previousSearch, logicalOperator } = req.body;
    // ...

    // Use the same system prompt as /ai-chat (from answer-system-prompt.txt or env)
    let searchSystemPrompt = SYSTEM_PROMPT;
    if (!searchSystemPrompt) {
      searchSystemPrompt = process.env.AZURE_OPENAI_SYSTEM_PROMPT || '';
    }

    let userMessage;
    // If this is a refine intent, format the user message to include all context
    if (previousQuery && previousSearch) {
      userMessage = `Previous Query: ${previousQuery}\nPrevious Search JSON:\n${JSON.stringify(previousSearch, null, 2)}\nNew Query: ${question}`;
    } else {
      userMessage = question;
    }

    const aiMessage = await sendOpenAIChatRequest({
      endpoint: AZURE_OPENAI_ENDPOINT,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      apiVersion: AZURE_OPENAI_API_VERSION,
      apiKey: AZURE_OPENAI_KEY,
      systemPrompt: searchSystemPrompt,
      userPrompt: userMessage,
      temperature: 0,
      maxTokens: 512
    }) || '{}';
    let searchJson;
    try {
      searchJson = JSON.parse(aiMessage);
      return res.json({ success: true, search: searchJson, isJson: true });
    } catch (err) {
      // If the model returns extra text, try to extract JSON
      const match = aiMessage.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          searchJson = JSON.parse(match[0]);
          return res.json({ success: true, search: searchJson, isJson: true });
        } catch (parseErr) {
          // fall through to send raw text
        }
      }
      // If not valid JSON, return the raw text and isJson: false
      return res.json({ success: true, result: aiMessage, isJson: false });
    }
  } catch (error) {
    // ...
    res.status(500).json({ success: false, error: error?.response?.data?.error?.message || error.message || 'Unknown error' });
  }
});

module.exports = router;
