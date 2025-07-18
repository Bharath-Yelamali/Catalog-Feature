import React from 'react';
import chatIcon from '../../assets/chat.svg';

function ChatboxOpenButton({ chatOpen, onOpen }) {
  if (chatOpen) return null;
  return (
    <button
      style={{
        position: 'fixed',
        bottom: 32,
        right: 15,
        zIndex: 1000,
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 56,
        height: 56,
        fontSize: 28,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0
      }}
      aria-label="Open Chatbox"
      onClick={onOpen}
    >
      <img src={chatIcon} alt="Open Chat" style={{ width: 32, height: 32 }} />
    </button>
  );
}

export default ChatboxOpenButton;
