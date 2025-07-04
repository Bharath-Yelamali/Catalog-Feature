import React from 'react';
import PropTypes from 'prop-types';

/**
 * GlobalSearchBar - a text input for global search, styled to align with other search bar controls.
 */
export function GlobalSearchBar({ value, onChange, placeholder = 'Global search...' }) {
  return (
    <input
      type="text"
      className="global-search-input"
      placeholder={placeholder}
      style={{
        marginLeft: 16,
        padding: '6px 12px',
        border: '1px solid #bcd6f7',
        borderRadius: 6,
        fontSize: 15,
        width: 220
      }}
      value={value}
      onChange={onChange}
      aria-label="Global search"
    />
  );
}

GlobalSearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};
