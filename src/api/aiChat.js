/**
 * Sends a user message to the backend intent detection endpoint.
 * @param {Object} params
 * @param {string} params.question - The user's question/message.
 * @returns {Promise<Object>} The detected intent ({ intent })
 */
export async function sendIntentAI({ question }) {
  const response = await fetch(`${BASE_URL}/ai-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to get intent');
  return await response.json(); // { intent: ... }
}
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Sends a chat message and search results to the backend AI chat endpoint.
 * @param {Object} params
 * @param {string} params.question - The user's question/message.
 * @param {Array|Object} params.results - The latest search results.
 * @returns {Promise<string>} The AI assistant's answer.
 */
/**
 * Sends a chat message and search results to the backend AI chat endpoint.
 * @param {Object} params
 * @param {string} params.question - The user's question/message.
 * @param {Array|Object} params.results - The latest search results.
 * @returns {Promise<Object>} The AI assistant's response ({ answer }).
 */
export async function sendAIChat({ question, results }) {
  const response = await fetch(`${BASE_URL}/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, results }),
  });
  if (!response.ok) throw new Error('Failed to get AI response');
  const data = await response.json();
  return data; // { answer }
}
