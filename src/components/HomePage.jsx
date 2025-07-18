
/**
 * HomePage.jsx
 *
 * This component renders the landing page for the Scout hardware procurement app.
 * It features animated header text, a demo chatbox with typewriter effect, and navigation buttons.
 *
 * @module src/components/HomePage
 * @author Bharath-Yelamali
 * @created 2025-07-17
 */

import React, { useEffect, useState } from 'react';
import shuffleIcon from '../assets/shuffle.svg';
import sendIcon from '../assets/send.svg';

/**
 * AnimatedText component
 * Renders text with a typewriter/animated fade-in effect, supporting both plain strings and arrays of colored segments.
 *
 * @param {Object} props
 * @param {string|Array<{text: string, color?: string}>} props.text - The text or segments to animate
 * @param {string} [props.className] - Optional CSS class
 * @param {number} [props.baseDelay=0] - Initial animation delay in seconds
 * @param {number} [props.delayStep=0.04] - Delay per character in seconds
 * @param {Object} [props.style] - Optional style object
 */
function AnimatedText({ text, className, baseDelay = 0, delayStep = 0.04, style }) {
  // Support both string and array of {text, color}
  if (typeof text === 'string') {
    return (
      <span className={className} style={style}>
        {text.split('').map((char, i) => (
          <span
            key={i}
            style={{
              opacity: 0,
              display: 'inline-block',
              animation: 'fadeInChar 0.5s forwards',
              animationDelay: `${baseDelay + i * delayStep}s`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    );
  }
  // If array, render each segment with its color
  let charIdx = 0;
  return (
    <span className={className} style={style}>
      {text.map((seg, segIdx) => (
        seg.text.split('').map((char, i) => {
          const idx = charIdx++;
          return (
            <span
              key={segIdx + '-' + i}
              style={{
                opacity: 0,
                display: 'inline-block',
                animation: 'fadeInChar 0.5s forwards',
                animationDelay: `${baseDelay + idx * delayStep}s`,
                color: seg.color || undefined,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })
      ))}
    </span>
  );
}


/**
 * Header text segments for the animated title.
 * @type {Array<{text: string, color?: string}>}
 */
const headerText = [
  { text: "Scout", color: "#2d72d9" },
  { text: " is your hub for hardware discovery and procurement.", color: undefined }
];

/**
 * Animation duration for the header text (in seconds).
 * @type {number}
 */
const headerDuration = 0.1 + (headerText[0].text.length + headerText[1].text.length) * 0.01 + 0.05; // baseDelay + (chars * delayStep) + animation duration (shorter)

/**
 * Example demo chatbox inputs for the typewriter effect.
 * @type {string[]}
 */
const demoInputs = [
  "How do I search for parts by manufacturer and type?",
  "Can I filter parts by both status and location?",
  "Show me parts with manufacturer Acme or Delta.",
  "Find all parts where the type is SSD and the status is active.",
  "How do I use 'or' in my search?",
  "List parts with location 'Warehouse A' or 'Warehouse B'.",
  "What fields can I use to filter parts?",
  "Find parts with serial number starting with 'X1'.",
  "How do I clear all filters?",
  "Show me parts with manufacturer Acme and location 'Main Facility'."
];

/**
 * Delay per character for the typewriter effect (in seconds).
 * @type {number}
 */
const typewriterDelay = 0.025;


/**
 * HomePage component
 * Renders the animated landing page, demo chatbox, and navigation buttons.
 *
 * @param {Object} props
 * @param {Function} props.setPage - Function to set the current page
 * @param {string} [props.accessToken] - User access token (if logged in)
 */
const HomePage = ({ setPage, accessToken }) => {
  // Index of the current demo input
  const [demoIdx, setDemoIdx] = useState(0);
  // Key to force re-render of AnimatedText for animation reset
  const [resetKey, setResetKey] = useState(0);

  // Cycle through demo inputs with a typewriter effect and delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDemoIdx(idx => {
        const nextIdx = (idx + 1) % demoInputs.length;
        setResetKey(prev => prev + 1); // force re-render for animation
        return nextIdx;
      });
    }, demoInputs[demoIdx].length * typewriterDelay * 1000 + 4000); // 4s buffer after typewriter
    return () => clearTimeout(timeout);
  }, [demoIdx]);

  return (
    <div className="homepage-root">
      {/* Animated header text */}
      <AnimatedText
        text={headerText}
        className="homepage-header-text"
        baseDelay={0.1}
        delayStep={0.012}
      />
      {/* Subheader/description */}
      <div
        className="homepage-footer-text"
        style={{ animationDelay: `${headerDuration}s` }}
      >
        Plan, track, and create procurement requests with ease. Streamline your hardware sourcing and order management.
      </div>
      {/* Get Started button for unauthenticated users */}
      {!accessToken && (
        <button
          className="homepage-get-started-btn"
          style={{ animationDelay: `${headerDuration + 0.7}s` }}
          onClick={() => setPage && setPage('login')}
        >
          Get Started
        </button>
      )}
      {/* Demo Chatbox with animated suggestions */}
      <div className="homepage-demo-chatbox">
        <AnimatedText
          key={resetKey}
          text={demoInputs[demoIdx]}
          baseDelay={0.1}
          delayStep={typewriterDelay}
          style={{ textAlign: 'left', width: '100%' }}
        />
        {/* Shuffle suggestion button */}
        <button
          className="homepage-suggestion-btn"
          onClick={() => setDemoIdx(idx => {
            let nextIdx;
            do {
              nextIdx = Math.floor(Math.random() * demoInputs.length);
            } while (nextIdx === demoIdx && demoInputs.length > 1);
            setResetKey(prev => prev + 1);
            return nextIdx;
          })}
        >
          <img src={shuffleIcon} alt="Shuffle" className="homepage-suggestion-icon" />
          Create a new suggestion
        </button>
        {/* Use suggestion button */}
        <button
          className="homepage-use-btn"
          onClick={() => {
            if (accessToken) {
              setPage && setPage('search');
            } else {
              // Set a flag in localStorage to redirect after login
              localStorage.setItem('redirectAfterLogin', 'search');
              setPage && setPage('login');
            }
          }}
        >
          <img src={sendIcon} alt="Send" className="homepage-use-icon" />
          Use it now
        </button>
      </div>
    </div>
  );
};

export default HomePage;
