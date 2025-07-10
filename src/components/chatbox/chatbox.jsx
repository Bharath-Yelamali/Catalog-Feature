import React, { useState, useRef, useEffect } from 'react';
import sendIcon from '../../assets/send.svg';
import '../../styles/ChatBox.css';
import { sendAIChat } from '../../api/aiChat';

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
    if (input.trim()) {
      const userMessage = { text: input, from: 'user' };
      setMessages((prev) => [...prev, userMessage]);
      if (onSend) onSend(input);
      setInput('');
      setTimeout(() => autoResizeTextarea(), 0);
      // --- LOGGING ---
      console.log('[Chatbox] User input:', userMessage.text);
      console.log('[Chatbox] searchResults:', searchResults);
      setLoading(true);
      try {
        console.log('[Chatbox] Calling sendAIChat with:', { question: userMessage.text, results: searchResults });
        const aiAnswer = await sendAIChat({ question: userMessage.text, results: searchResults });
        console.log('[Chatbox] AI response:', aiAnswer);
        typeOutMessage(aiAnswer);
      } catch (err) {
        console.error('[Chatbox] Error from sendAIChat:', err);
        setMessages((prev) => [...prev, { text: "Sorry, I couldn't get a response from the assistant.", from: 'assistant' }]);
      }
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
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
        <span>Chat</span>
        <button className="copilot-chat-close" onClick={onClose} aria-label="Close chat">×</button>
      </div>
      <div className="copilot-chat-content" ref={chatContentRef}>
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
