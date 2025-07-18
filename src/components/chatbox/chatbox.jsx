/**
 * Chatbox Component
 * ------------------
 * Provides a sidebar chat interface for user and AI assistant interaction.
 * Features include:
 * - Message history and assistant typing animation
 * - Intent detection and AI response handling
 * - JSON response toggle and chat clearing
 * - Auto-resizing input and accessibility features
 *
 * @fileoverview Chatbox UI for AI assistant, with message rendering, intent detection, and utility helpers.
 * @author Bharath Yelamali
 */
import React, { useState, useRef, useEffect } from 'react';
import sendIcon from '../../assets/send.svg';
import garbageIcon from '../../assets/garbage.svg';
import wizardIcon from '../../assets/wizard.svg';
import jsonIcon from '../../assets/json.svg';
import '../../styles/ChatBox.css';
// import { sendAIChat, sendIntentAI } from '../../api/aiChat'; // Unused imports removed
import { detectIntent, handleAIResponse, handleSearchOrRefine } from './chatboxLogic';


/**
 * Renders a single chat message bubble (user or assistant).
 * Hides intent/JSON messages if toggled off.
 *
 * @param {Object} props
 * @param {Object} props.msg - Message object to render
 * @returns {JSX.Element|null}
 */
function ChatMessage({ msg }) {
  if ((msg.isJson || msg.isIntent) && typeof msg.showJson !== 'undefined' && !msg.showJson) return null;
  return (
    <div className={`copilot-chat-message ${msg.from}`}>
      <div className={`copilot-chat-bubble${msg.from === 'assistant' ? ' ai-bubble' : ''}`}>
        {msg.text}
      </div>
    </div>
  );
}

/**
 * Automatically resizes the textarea to fit its content.
 *
 * @param {React.RefObject<HTMLTextAreaElement>} textareaRef - Ref to the textarea element
 */
function autoResizeTextarea(textareaRef) {
  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}

/**
 * Simulates typing animation for assistant's response by incrementally updating message text.
 *
 * @param {string} fullText - The full message to type out
 * @param {Function} setMessages - State setter for messages
 */
function typeOutMessage(fullText, setMessages) {
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
  }, 5);
}

/**
 * Main chat UI component for user/assistant conversation.
 * Handles input, message state, intent detection, and rendering.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the chat sidebar is open
 * @param {Function} props.onClose - Handler to close the chat
 * @param {React.ReactNode} props.children - Optional children to render in chat
 * @param {Function} props.onSend - Callback when user sends a message
 * @param {Array} props.searchResults - Search results for AI context
 * @param {Function} props.onGlobalSearchConditions - Handler for global search conditions
 * @returns {JSX.Element}
 */
const Chatbox = ({ open, onClose, children, onSend, searchResults, onGlobalSearchConditions }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // Store chat messages
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(true); // Toggle for showing JSON
  const [lastSearchJson, setLastSearchJson] = useState(null); // Store last valid search JSON
  const [lastLogicalOperator, setLastLogicalOperator] = useState('and'); // Store last logical operator
  const textareaRef = useRef(null);
  const chatContentRef = useRef(null);

  /**
   * Handles input change in the textarea and resizes it.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e
   */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    autoResizeTextarea(textareaRef);
  };



  /**
   * Handles sending a user message, intent detection, and AI response.
   * @param {React.FormEvent} e
   */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, from: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    if (onSend) onSend(input);
    setInput('');
    setTimeout(() => autoResizeTextarea(textareaRef), 0);
    setLoading(true);

    try {
      const { intent, logicalOperator } = await detectIntent(userMessage);
      // Show a 'Thinking... (intent: ...)' message after intent is detected
      setMessages((prev) => [
        ...prev,
        { text: `(intent: ${JSON.stringify({ intent, logicalOperator })})`, from: 'assistant', typing: false, isIntent: true }
      ]);

      let aiAnswer = null;
      if (intent === 'analyze_results' || intent === 'general') {
        aiAnswer = await handleAIResponse(intent, userMessage, searchResults);
      } else if (intent === 'refine' || intent === 'search') {
        aiAnswer = await handleSearchOrRefine({
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
        });
      } else {
        aiAnswer = "Sorry, I couldn't determine your intent.";
      }

      if (aiAnswer) typeOutMessage(aiAnswer, setMessages);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Chatbox] Error from sendAIChat:', err);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I couldn't get a response from the assistant.", from: 'assistant' }
      ]);
    }
    setLoading(false);
  };

  /**
   * Handles Enter key to send message (Shift+Enter for newline).
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };



  /**
   * Clears the chat history and input field.
   */
  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    autoResizeTextarea(textareaRef);
  };

  /**
   * Auto-scrolls to the bottom of the chat when messages or input change.
   */
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
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={{ ...msg, showJson }} />
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
