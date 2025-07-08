import React, { useState, useRef } from 'react';
import sendIcon from '../../assets/send.svg';

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
      <div className="copilot-chat-content" style={{
        overflowY: 'auto',
        flex: 1,
        padding: '1em 0.5em 0.5em 0.5em',
        background: 'rgba(40, 44, 52, 1)'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '0.5em',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #4f8cff 0%, #2356a8 100%)',
                color: '#fff',
                borderRadius: '1.2em',
                padding: '0.6em 1.2em',
                maxWidth: '70%',
                wordBreak: 'break-word',
                textAlign: 'right',
                fontSize: '1em',
                boxShadow: '0 1px 4px rgba(58,58,58,0.08)'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {children}
      </div>
      <form className="copilot-chat-input-bar" onSubmit={handleSend} style={{ position: 'relative', margin: '0.5em 0.5em 0.75em 0.5em' }}>
        <textarea
          ref={textareaRef}
          className="copilot-chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          rows={2}
          style={{
            resize: 'none',
            width: '100%',
            minHeight: '2.5em',
            maxHeight: '12em',
            fontSize: '1.1em',
            padding: '0.75em 2.2em 0.75em 0.75em',
            borderRadius: '0.5em',
            border: '1px solid rgb(255, 255, 255)',
            boxSizing: 'border-box',
            background: 'rgb(102, 102, 102)',
            color: 'rgb(255, 250, 250)',
            margin: 0,
            outline: 'none',
            boxShadow: '0 1px 4px rgba(58, 58, 58, 0.08)',
            overflow: 'hidden',
            WebkitOverflowScrolling: 'auto',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        />
        <button
          type="submit"
          className="copilot-chat-send"
          aria-label="Send message"
          style={{
            position: 'absolute',
            right: '0.7em',
            bottom: '0.7em',
            background: 'rgba(0,0,0,0)',
            border: 'none',
            color: 'rgba(255,255,255,1)',
            fontSize: '1.1em',
            cursor: 'pointer',
            padding: 0,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src={sendIcon} alt="Send" style={{ width: 18, height: 18, display: 'block', filter: 'invert(1) brightness(2)' }} />
        </button>
      </form>
      <style>
        {`
          .copilot-chat-input::placeholder {
            color: #fff;
            opacity: 1;
          }
          .copilot-chat-input::-webkit-scrollbar {
            display: none;
          }
          .copilot-chat-content::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default Chatbox;
