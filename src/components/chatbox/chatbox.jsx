import React, { useState, useRef, useEffect } from 'react';
import sendIcon from '../../assets/send.svg';
import garbageIcon from '../../assets/garbage.svg';
import wizardIcon from '../../assets/wizard.svg';
import '../../styles/ChatBox.css';
import { sendAIChat, sendIntentAI } from '../../api/aiChat';

const Chatbox = ({ open, onClose, children, onSend, searchResults }) => {
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
      const intent = intentResult.intent;
      console.log('[Chatbox] Detected intent:', intent);

      // Show a 'Thinking... (intent: ...)' message after intent is detected
      setMessages((prev) => [
        ...prev,
        { text: `Thinking... (intent: ${intent})`, from: 'assistant', typing: false }
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
        // Step 2c: Trigger a search in your app (implement as needed)
        aiAnswer = "I'll search for that! (Search integration not implemented)";
        // Optionally, call a prop or function to trigger search here
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
