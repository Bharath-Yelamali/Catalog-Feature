/**
 * EmptyState Component
 * ---------------------
 * Displays a friendly empty state for the parts table, with different content for initial and filtered states.
 *
 * - Shows a welcome message and usage tips when the table is first loaded (isInitial=true).
 * - Shows an error message when no parts match the current filters (isInitial=false).
 *
 * @fileoverview UI for empty/zero-state in the parts table.
 * @param {Object} props
 * @param {boolean} props.isInitial - Whether this is the initial empty state or a filtered empty state
 * @returns {JSX.Element}
 */
import React from 'react';
import personIcon from '../../../assets/wizard.svg';

/**
 * Displays a friendly empty state for the parts table.
 * @param {Object} props
 * @param {boolean} props.isInitial - True for initial load, false for filtered empty state
 */
function EmptyState({ isInitial }) {
  return (
    <div className="search-results-empty">
      {/* Wizard/mascot icon for visual engagement */}
      <img
        src={personIcon}
        alt="Wizard"
        className="wizard-icon"
      />
      {isInitial ? (
        <>
          {/* Initial state: welcome and usage tips */}
          <div className="empty-header">
            Welcome to Scout
          </div>
          <div className="empty-desc">
            Get started by searching for parts or using the tools below:
          </div>
          <ul className="empty-list">
            <li>Search globally for any part or item</li>
            <li>Use the chat to answer any questions</li>
            <li>Try advanced search for more refined results</li>
          </ul>
        </>
      ) : (
        // Filtered state: no results found
        <div className="empty-error">
          No parts match the current filters.
        </div>
      )}
    </div>
  );
}

export default EmptyState;
