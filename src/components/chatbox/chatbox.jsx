import React, { useState, useRef, useEffect } from 'react';

import sendIcon from '../../assets/send.svg';
import garbageIcon from '../../assets/garbage.svg';
import wizardIcon from '../../assets/wizard.svg';
import jsonIcon from '../../assets/json.svg';
import '../../styles/ChatBox.css';
import { sendAIChat, sendIntentAI } from '../../api/aiChat';

const Chatbox = ({ open, onClose, children, onSend, searchResults, onGlobalSearchConditions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // Store chat messages
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(true); // Toggle for showing JSON
  const [lastSearchJson, setLastSearchJson] = useState(null); // Store last valid search JSON
  const [lastLogicalOperator, setLastLogicalOperator] = useState('and'); // Store last logical operator
  const textareaRef = useRef(null);
  const chatContentRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    autoResizeTextarea();
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const typeOutMessage = (fullText) => {
    let i = 0;
    setMessages((prev) => [...prev, { text: '', from: 'assistant', typing: true }]);
    const interval = setInterval(() => {
      setMessages((prev) => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last && last.from === 'assistant' && last.typing) {
          last.text = fullText.slice(0, i + 1);
          if (i + 1 === fullText.length) {
            last.typing = false;
            clearInterval(interval);
          }
        }
        return msgs;
      });
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 5); // ~110 chars/sec (twice as fast)
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, from: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    if (onSend) onSend(input);
    setInput('');
    setTimeout(() => autoResizeTextarea(), 0);
    setLoading(true);

    try {
      // Step 1: Get intent using the dedicated intent model
      const intentResult = await sendIntentAI({ question: userMessage.text });
      let intent, logicalOperator;
      // Handle stringified JSON, object, or string intent responses
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
      console.log('[Chatbox] Detected intent:', intent);
      console.log('[Chatbox] Detected logicalOperator:', logicalOperator);

      // Show a 'Thinking... (intent: ...)' message after intent is detected
      setMessages((prev) => [
        ...prev,
        { text: `(intent: ${JSON.stringify({ intent, logicalOperator })})`, from: 'assistant', typing: false, isIntent: true }
      ]);

      let aiAnswer = '';

      if (intent === 'analyze_results') {
        // Step 2a: Analyze results using the main answer model
        const payload = { question: userMessage.text, results: searchResults };
        console.log('[Chatbox] Posting to answer model (analyze_results):', payload);
        const answerResult = await sendAIChat(payload);
        aiAnswer = answerResult.answer;
      } else if (intent === 'general') {
        // Step 2b: General question using the main answer model
        const payload = { question: userMessage.text };
        console.log('[Chatbox] Posting to answer model (general):', payload);
        const answerResult = await sendAIChat(payload);
        aiAnswer = answerResult.answer;
      } else if (intent === 'refine') {
        // Step 2d: Refine previous search
        // Get last user query from messages array
        const lastUserMessage = messages.filter(m => m.from === 'user').slice(-1)[0];
        const lastUserQuery = lastUserMessage ? lastUserMessage.text : '';
        const payload = {
          previousQuery: lastUserQuery,
          previousSearch: lastSearchJson,
          logicalOperator: lastLogicalOperator,
          question: userMessage.text
        };
        // Removed verbose log of instructions payload
        const res = await fetch('/api/ai-search-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.isJson) {
          setLastSearchJson(data.search);
          setLastLogicalOperator(logicalOperator);
          // Trigger filtering (same as search intent)
          const conditions = Object.entries(data.search).map(([field, { operator, value }]) => ({
            field,
            operator,
            value
          }));
          if (typeof window.onGlobalSearchConditions === 'function') {
            console.log('[Chatbox] Calling window.onGlobalSearchConditions with:', { conditions, logicalOperator });
            window.onGlobalSearchConditions({ conditions, logicalOperator });
          } else if (typeof onGlobalSearchConditions === 'function') {
            console.log('[Chatbox] Calling onGlobalSearchConditions prop with:', { conditions, logicalOperator });
            onGlobalSearchConditions({ conditions, logicalOperator });
          } else {
            console.warn('[Chatbox] No global search callback found to trigger filter update.');
          }
          // Add a message to chat
          setMessages((prev) => [
            ...prev,
            { text: 'Refined search JSON:\n' + JSON.stringify(data.search, null, 2), from: 'assistant', isJson: true },
            { text: 'Search refined!', from: 'assistant' }
          ]);
          aiAnswer = '';
        } else if (data.isJson === false && typeof data.result === 'string') {
          setMessages((prev) => [
            ...prev,
            { text: data.result, from: 'assistant' }
          ]);
          aiAnswer = '';
        } else if (data.error) {
          setMessages((prev) => [
            ...prev,
            { text: 'Error: ' + data.error + (data.raw ? ('\nRaw: ' + data.raw) : ''), from: 'assistant' }
          ]);
          aiAnswer = '';
        } else {
          setMessages((prev) => [
            ...prev,
            { text: 'No refined search JSON returned.', from: 'assistant' }
          ]);
          aiAnswer = '';
        }
      } else if (intent === 'search') {
        // Step 2c: Call /api/ai-search-query and print the JSON in the chatbox
        try {
          const payload = { question: userMessage.text };
          console.log('[Chatbox] Posting to answer model (search):', payload);
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
            console.log('[Chatbox] Model JSON received:', data.search);
            console.log('[Chatbox] Converted conditions array:', conditions);
            // Trigger filtering (replace with your actual callback/prop)
            if (typeof window.onGlobalSearchConditions === 'function') {
              console.log('[Chatbox] Calling window.onGlobalSearchConditions with:', { conditions, logicalOperator });
              window.onGlobalSearchConditions({ conditions, logicalOperator });
            } else if (typeof onGlobalSearchConditions === 'function') {
              console.log('[Chatbox] Calling onGlobalSearchConditions prop with:', { conditions, logicalOperator });
              onGlobalSearchConditions({ conditions, logicalOperator });
            } else {
              console.warn('[Chatbox] No global search callback found to trigger filter update.');
            }
            setMessages((prev) => [
              ...prev,
              { text: 'AI-generated search JSON:\n' + JSON.stringify(data.search, null, 2), from: 'assistant', isJson: true },
              { text: 'Search completed!', from: 'assistant' }
            ]);
            aiAnswer = '';
          } else if (data.isJson === false && typeof data.result === 'string') {
            setMessages((prev) => [
              ...prev,
              { text: data.result, from: 'assistant' }
            ]);
            aiAnswer = '';
          } else if (data.error) {
            setMessages((prev) => [
              ...prev,
              { text: 'Error: ' + data.error + (data.raw ? ('\nRaw: ' + data.raw) : ''), from: 'assistant' }
            ]);
            aiAnswer = '';
          } else {
            setMessages((prev) => [
              ...prev,
              { text: 'No search JSON returned.', from: 'assistant' }
            ]);
            aiAnswer = '';
          }
        } catch (err) {
          setMessages((prev) => {
            const msgs = prev.filter((m, i) => !(i === prev.length - 1 && m.isIntent));
            return [
              ...msgs,
              { text: 'Failed to get search response from AI.', from: 'assistant' }
            ];
          });
          aiAnswer = '';
        }
      } else {
        aiAnswer = "Sorry, I couldn't determine your intent.";
      }

      if (aiAnswer) typeOutMessage(aiAnswer);
    } catch (err) {
      console.error('[Chatbox] Error from sendAIChat:', err);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I couldn't get a response from the assistant.", from: 'assistant' }
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    autoResizeTextarea();
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const chatContent = chatContentRef.current;
    if (chatContent) {
      chatContent.scrollTop = chatContent.scrollHeight;
    }
  }, [messages, input]);

  return (
    <div className={`copilot-chat-sidebar${open ? ' open' : ''}`}>
      <div className="copilot-chat-header">
        <span className="copilot-chat-header-title">Chat</span>
        <div className="copilot-json-toggle-group">
          <label className="copilot-json-slider">
            <input
              type="checkbox"
              checked={showJson}
              onChange={() => setShowJson((prev) => !prev)}
              className="copilot-json-slider-input"
            />
            <span className={`copilot-json-slider-bar${showJson ? ' checked' : ''}`}>
              <span className={`copilot-json-slider-knob${showJson ? ' checked' : ''}`}/>
            </span>
          </label>
          <img src={jsonIcon} alt="JSON" className="copilot-json-icon" />
          <span className="copilot-json-label">JSON Response</span>
        </div>
        <button
          className="copilot-chat-clear"
          aria-label="Clear chat history"
          onClick={handleClearChat}
        >
          <img src={garbageIcon} alt="Clear chat" className="copilot-chat-clear-icon" />
        </button>
        <button className="copilot-chat-close" onClick={onClose} aria-label="Close chat">×</button>
      </div>
      <div className="copilot-chat-content" ref={chatContentRef}>
        {messages.length === 0 && !loading && (
          <div className="copilot-chat-empty-state">
            <img src={wizardIcon} alt="Wizard" className="copilot-chat-empty-state-icon" />
            <div className="copilot-chat-empty-state-text">
              Start a conversation by typing your question below!
            </div>
          </div>
        )}
        {messages.map((msg, idx) => {
          if ((msg.isJson || msg.isIntent) && !showJson) return null;
          return (
            <div key={idx} className={`copilot-chat-message ${msg.from}`}>
              <div
                className={`copilot-chat-bubble${msg.from === 'assistant' ? ' ai-bubble' : ''}`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="copilot-chat-message assistant">
            <div className="copilot-chat-bubble ai-bubble">
              Thinking...
            </div>
          </div>
        )}
        {children}
      </div>
      <form className="copilot-chat-input-bar" onSubmit={handleSend}>
        <textarea
          ref={textareaRef}
          className="copilot-chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          rows={2}
        />
        <button
          type="submit"
          className="copilot-chat-send"
          aria-label="Send message"
          disabled={loading}
        >
          <img src={sendIcon} alt="Send" />
        </button>
      </form>
    </div>
  );
};

export default Chatbox;
