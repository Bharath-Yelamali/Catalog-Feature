import React from 'react';

const Chatbox = ({ open, onClose, children }) => (
  <div className={`copilot-chat-sidebar${open ? ' open' : ''}`}>
    <div className="copilot-chat-header">
      <span>Copilot Chat</span>
      <button className="copilot-chat-close" onClick={onClose} aria-label="Close chat">×</button>
    </div>
    <div className="copilot-chat-content">
      {children || <div>Copilot is ready to help!</div>}
    </div>
  </div>
);

export default Chatbox;
