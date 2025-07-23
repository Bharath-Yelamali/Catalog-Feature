
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
import { fetchBulkOrderParts } from '../api/parts';
import { getInventoryReserveFromPart } from '../utils/inventoryCalculations';

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
  // Bulk order parts state
  const [bulkParts, setBulkParts] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // Fetch bulk order parts on mount
  useEffect(() => {
    let isMounted = true;
    setBulkLoading(true);
    setBulkError(null);
    fetchBulkOrderParts({ accessToken })
      .then(parts => {
        if (isMounted) {
          console.log('[HomePage] Bulk order table data:', parts);
          setBulkParts(parts);
          setBulkLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setBulkError(err.message || 'Failed to fetch bulk order parts');
          setBulkLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [accessToken]);
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
      {/* Header for bulk order parts list */}
      {accessToken && (
        <>
          <div style={{ width: '100%', maxWidth: '1360px', margin: '40px auto 0 auto', textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#ffffffff', marginBottom: '-20px' }}>
              Parts Needing Order (Low Inventory)
            </div>
          </div>
          <div className="homepage-column-box" style={{ width: '100%', maxWidth: '1360px', minHeight: '600px', background: '#292929ff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '32px 24px', margin: '40px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '64px' }}>
            {/* Scrollable inner box for text */}
            <div style={{ width: '100%', maxWidth: '1300px', height: '650px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: '24px', overflowY: 'auto', color: '#222', fontSize: '18px' }}>
              {/* Bulk order parts list */}
              {bulkLoading && <div>Loading bulk order parts...</div>}
              {bulkError && <div style={{ color: 'red' }}>Error: {bulkError}</div>}
              {!bulkLoading && !bulkError && bulkParts.length === 0 && (
                <div>No bulk order parts found.</div>
              )}
              {!bulkLoading && !bulkError && bulkParts.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                  <thead>
                    <tr style={{ background: '#ebebebff' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Inventory Item #</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Manufacturer Part #</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Total</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>In Use</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Essential Reserve</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Amount Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(
                      bulkParts.reduce((acc, part) => {
                        const key = part.m_inventory_item?.item_number || part.item_number || 'Unknown';
                        if (!acc[key]) {
                          acc[key] = part;
                        }
                        return acc;
                      }, {})
                    )
                    .filter(part => {
                      const { inUse } = getInventoryReserveFromPart(part);
                      return inUse !== 0;
                    })
                    .map((part, idx) => {
                      // Use utility for calculations
                      const { essentialReserve, amountNeeded, inUse } = getInventoryReserveFromPart(part);
                      const total = part.total ?? 0;
                      return (
                        <tr key={part.m_inventory_item?.item_number || part.item_number || idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', textAlign: 'left' }}>{part.m_inventory_item?.item_number || part.item_number || 'No Item Number'}</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{part.m_mfg_part_number || part.manufacturer_part_number || part.mfg_part_number || 'N/A'}</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{
                            part.m_inventory_description ||
                            part.m_inventory_item?.description ||
                            part.description ||
                            part.m_inventory_item?.part_description ||
                            part.part_description ||
                            part.m_description ||
                            'N/A'
                          }</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{total}</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{inUse}</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{essentialReserve}</td>
                          <td style={{ padding: '12px', textAlign: 'left' }}>{amountNeeded}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
