import React from 'react';
import personIcon from '../../../assets/wizard.svg';

function EmptyState({ isInitial }) {
  return (
    <div className="search-results-empty">
      <img
        src={personIcon}
        alt="Wizard"
        className="wizard-icon"
      />
      {isInitial ? (
        <>
          <div className="empty-header">
            Welcome to Accio
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
        <div className="empty-error">
          No parts match the current filters.
        </div>
      )}
    </div>
  );
}

export default EmptyState;
