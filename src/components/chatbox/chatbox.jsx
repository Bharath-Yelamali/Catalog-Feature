import React, { useState, useRef, useEffect } from 'react';
import sendIcon from '../../assets/send.svg';
import garbageIcon from '../../assets/garbage.svg';
import wizardIcon from '../../assets/wizard.svg';
import '../../styles/ChatBox.css';
import { sendAIChat, sendIntentAI } from '../../api/aiChat';

const Chatbox = ({ open, onClose, children, onSend, searchResults, onGlobalSearchConditions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // Store chat messages
  const [loading, setLoading] = useState(false);
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
        { text: `Thinking... (intent: ${JSON.stringify({ intent, logicalOperator })})`, from: 'assistant', typing: false }
      ]);

      let aiAnswer = '';

      if (intent === 'analyze_results') {
        // Step 2a: Analyze results using the main answer model
        const answerResult = await sendAIChat({ question: userMessage.text, results: searchResults });
        aiAnswer = answerResult.answer;
      } else if (intent === 'general') {
        // Step 2b: General question using the main answer model
        const answerResult = await sendAIChat({ question: userMessage.text });
        aiAnswer = answerResult.answer;
      } else if (intent === 'search') {
        // Step 2c: Call /api/ai-search-query and print the JSON in the chatbox
        try {
          const res = await fetch('/api/ai-search-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: userMessage.text })
          });
          const data = await res.json();
          if (data.search) {
            // Convert model JSON to conditions array
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
            aiAnswer = 'AI-generated search JSON:\n' + JSON.stringify(data.search, null, 2);
          } else if (data.error) {
            aiAnswer = 'Error: ' + data.error + (data.raw ? ('\nRaw: ' + data.raw) : '');
          } else {
            aiAnswer = 'No search JSON returned.';
          }
        } catch (err) {
          aiAnswer = 'Failed to get search JSON from AI.';
        }
      } else {
        aiAnswer = "Sorry, I couldn't determine your intent.";
      }

      typeOutMessage(aiAnswer);
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
      <div className="copilot-chat-header" style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 'none', fontWeight: 'bold' }}>Chat</span>
        <button
          className="copilot-chat-clear"
          aria-label="Clear chat history"
          style={{ background: 'none', border: 'none', padding: 0, marginLeft: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={handleClearChat}
        >
          <img src={garbageIcon} alt="Clear chat" style={{ width: '20px', height: '20px', filter: 'invert(1)', marginRight: '8px' }} />
        </button>
        <button className="copilot-chat-close" onClick={onClose} aria-label="Close chat">×</button>
      </div>
      <div className="copilot-chat-content" ref={chatContentRef}>
        {messages.length === 0 && !loading && (
          <div className="copilot-chat-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <img src={wizardIcon} alt="Wizard" style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 0.8 }} />
            <div style={{ color: '#aaa', fontSize: '.9em', textAlign: 'center' }}>
              Start a conversation by typing your question below!
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`copilot-chat-message ${msg.from}`}>
            <div
              className={`copilot-chat-bubble${msg.from === 'assistant' ? ' ai-bubble' : ''}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
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
