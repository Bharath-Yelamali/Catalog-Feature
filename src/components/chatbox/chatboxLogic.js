// chatboxLogic.js
// Helper functions for Chatbox AI/intent/search logic

import { sendAIChat, sendIntentAI } from '../../api/aiChat';

/**
 * Detects the intent and logical operator from a user message.
 * @param {object} userMessage
 * @returns {Promise<{intent: string, logicalOperator: string}>}
 */
export const detectIntent = async (userMessage) => {
  const intentResult = await sendIntentAI({ question: userMessage.text });
  let intent, logicalOperator;
  if (typeof intentResult.intent === 'string' && intentResult.intent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(intentResult.intent);
      intent = parsed.intent;
      logicalOperator = parsed.logicalOperator || 'and';
    } catch (e) {
      intent = intentResult.intent;
      logicalOperator = intentResult.logicalOperator || 'and';
    }
  } else if (typeof intentResult.intent === 'object' && intentResult.intent !== null) {
    intent = intentResult.intent.intent;
    logicalOperator = intentResult.intent.logicalOperator || 'and';
  } else {
    intent = intentResult.intent;
    logicalOperator = intentResult.logicalOperator || 'and';
  }
  return { intent, logicalOperator };
};

/**
 * Handles AI chat response for analyze_results/general intents.
 * @param {string} intent
 * @param {object} userMessage
 * @param {object} searchResults
 * @returns {Promise<string|null>}
 */
export const handleAIResponse = async (intent, userMessage, searchResults) => {
  if (intent === 'analyze_results') {
    const payload = { question: userMessage.text, results: searchResults };
    const answerResult = await sendAIChat(payload);
    return answerResult.answer;
  } else if (intent === 'general') {
    const payload = { question: userMessage.text };
    const answerResult = await sendAIChat(payload);
    return answerResult.answer;
  }
  return null;
};

/**
 * Handles search/refine intent logic and updates state via callbacks.
 * @param {object} params
 * @returns {Promise<string|null>}
 */
export const handleSearchOrRefine = async ({
  intent,
  userMessage,
  logicalOperator,
  messages,
  lastSearchJson,
  lastLogicalOperator,
  setLastSearchJson,
  setLastLogicalOperator,
  setMessages,
  onGlobalSearchConditions
}) => {
  if (intent === 'refine') {
    const lastUserMessage = messages.filter(m => m.from === 'user').slice(-1)[0];
    const lastUserQuery = lastUserMessage ? lastUserMessage.text : '';
    const payload = {
      previousQuery: lastUserQuery,
      previousSearch: lastSearchJson,
      logicalOperator: lastLogicalOperator,
      question: userMessage.text
    };
    const res = await fetch('/api/ai-search-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.isJson) {
      setLastSearchJson(data.search);
      setLastLogicalOperator(logicalOperator);
      const conditions = Object.entries(data.search).map(([field, { operator, value }]) => ({
        field,
        operator,
        value
      }));
      if (typeof window.onGlobalSearchConditions === 'function') {
        window.onGlobalSearchConditions({ conditions, logicalOperator });
      } else if (typeof onGlobalSearchConditions === 'function') {
        onGlobalSearchConditions({ conditions, logicalOperator });
      }
      setMessages((prev) => [
        ...prev,
        { text: 'Refined search JSON:\n' + JSON.stringify(data.search, null, 2), from: 'assistant', isJson: true },
        { text: 'Search refined!', from: 'assistant' }
      ]);
      return '';
    } else if (data.isJson === false && typeof data.result === 'string') {
      setMessages((prev) => [
        ...prev,
        { text: data.result, from: 'assistant' }
      ]);
      return '';
    } else if (data.error) {
      setMessages((prev) => [
        ...prev,
        { text: 'Error: ' + data.error + (data.raw ? ('\nRaw: ' + data.raw) : ''), from: 'assistant' }
      ]);
      return '';
    } else {
      setMessages((prev) => [
        ...prev,
        { text: 'No refined search JSON returned.', from: 'assistant' }
      ]);
      return '';
    }
  } else if (intent === 'search') {
    try {
      const payload = { question: userMessage.text };
      const res = await fetch('/api/ai-search-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.isJson) {
        setLastSearchJson(data.search);
        setLastLogicalOperator(logicalOperator);
        const conditions = Object.entries(data.search).map(([field, { operator, value }]) => ({
          field,
          operator,
          value
        }));
        if (typeof window.onGlobalSearchConditions === 'function') {
          window.onGlobalSearchConditions({ conditions, logicalOperator });
        } else if (typeof onGlobalSearchConditions === 'function') {
          onGlobalSearchConditions({ conditions, logicalOperator });
        }
        setMessages((prev) => [
          ...prev,
          { text: 'AI-generated search JSON:\n' + JSON.stringify(data.search, null, 2), from: 'assistant', isJson: true },
          { text: 'Search completed!', from: 'assistant' }
        ]);
        return '';
      } else if (data.isJson === false && typeof data.result === 'string') {
        setMessages((prev) => [
          ...prev,
          { text: data.result, from: 'assistant' }
        ]);
        return '';
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { text: 'Error: ' + data.error + (data.raw ? ('\nRaw: ' + data.raw) : ''), from: 'assistant' }
        ]);
        return '';
      } else {
        setMessages((prev) => [
          ...prev,
          { text: 'No search JSON returned.', from: 'assistant' }
        ]);
        return '';
      }
    } catch (err) {
      setMessages((prev) => {
        const msgs = prev.filter((m, i) => !(i === prev.length - 1 && m.isIntent));
        return [
          ...msgs,
          { text: 'Failed to get search response from AI.', from: 'assistant' }
        ];
      });
      return '';
    }
  }
  return null;
};
