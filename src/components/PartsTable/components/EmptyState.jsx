import React from 'react';
import personIcon from '../../../assets/person.svg';

function EmptyState({ isInitial }) {
  return (
    <div
      className="search-results-empty"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        color: '#64748b',
        fontSize: 18,
      }}
    >
      <img
        src={personIcon}
        alt="Person"
        style={{ width: 180, height: 180, marginBottom: 22, opacity: 0.7 }}
      />
      {isInitial
        ? 'Input a search to get started.'
        : 'No parts match the current filters.'}
    </div>
  );
}

export default EmptyState;
