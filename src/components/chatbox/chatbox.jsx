import React, { useState, useRef } from 'react';
import sendIcon from '../../assets/send.svg';
import '../../styles/ChatBox.css';

const Chatbox = ({ open, onClose, children, onSend }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // Store chat messages
  const textareaRef = useRef(null);

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

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, from: 'user' }]);
      if (onSend) onSend(input);
      setInput('');
      setTimeout(() => autoResizeTextarea(), 0); // reset height after clearing
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <div className={`copilot-chat-sidebar${open ? ' open' : ''}`}>
      <div className="copilot-chat-header">
        <span>Chat</span>
        <button className="copilot-chat-close" onClick={onClose} aria-label="Close chat">×</button>
      </div>
      <div className="copilot-chat-content">
        {messages.map((msg, idx) => (
          <div key={idx} className="copilot-chat-message">
            <div className="copilot-chat-bubble">
              {msg.text}
            </div>
          </div>
        ))}
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
        >
          <img src={sendIcon} alt="Send" />
        </button>
      </form>
    </div>
  );
};

export default Chatbox;
