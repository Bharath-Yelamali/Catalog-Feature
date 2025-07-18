
# Chatbox Component — How It Works

This folder contains the main chat UI (`chatbox.jsx`) and its supporting logic (`chatboxLogic.js`) for the AI assistant sidebar chat. Below is a detailed explanation of how these files work together to deliver the chat experience.

## Core Flow

1. **User Input & State Management**
   - The chatbox UI maintains state for the message list, input value, loading status, and toggles (like JSON visibility).
   - When a user types a message and sends it (via Enter or the send button), the message is added to the chat history and triggers the AI logic.

2. **Intent Detection & AI Response**
   - The chatbox calls `detectIntent` from `chatboxLogic.js` to analyze the user's message and determine the intent (e.g., search, refine, general question).
   - Depending on the detected intent, the chatbox then calls either `handleAIResponse` (for general/analysis) or `handleSearchOrRefine` (for search/refine actions).
   - These logic functions may update the chat state, trigger new searches, or return AI-generated responses.

3. **Message Rendering & Typing Animation**
   - Messages are rendered in a scrollable sidebar, with user and assistant messages styled differently.
   - When the assistant responds, a typing animation is simulated by incrementally revealing the message text.
   - Special messages (like detected intent or JSON responses) can be toggled on/off for clarity.

4. **UI Features**
   - The chatbox supports clearing the chat, toggling JSON/intent messages, and auto-resizing the input area.
   - The chat view auto-scrolls to the latest message as new messages arrive.

## File Roles

- **`chatbox.jsx`**
  - Handles all UI rendering, state management, and user interaction.
  - Integrates with the logic helpers to process input and update the chat.
  - Exposes props for parent components to control open/close state, pass search results, and handle message sending.

- **`chatboxLogic.js`**
  - Provides pure functions for intent detection and AI response logic.
  - Keeps business logic separate from UI, making it easier to test and extend.
  - Exports:
    - `detectIntent(userMessage)` — Returns the intent and logical operator.
    - `handleAIResponse(intent, userMessage, searchResults)` — Returns a string response for general/analysis queries.
    - `handleSearchOrRefine(options)` — Handles search/refine flows, updating state as needed.

## Extending & Customizing

- To add new intents or AI behaviors, update `chatboxLogic.js`.
- For UI or styling changes, edit `chatbox.jsx` and/or `../../styles/ChatBox.css`.
- The chatbox is designed to be modular and easy to integrate into any React app.

---

For more details, see the code comments in each file or contact the project maintainer.
