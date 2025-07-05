import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * GlobalSearchBar - a text input for global search, styled to align with other search bar controls.
 * Now triggers a fetch to the /parts endpoint for server-side filtering.
 */
export function GlobalSearchBar({ value, setResults, accessToken, placeholder = 'Global search...' }) {
  const [inputValue, setInputValue] = useState(value);
  const debounceTimeout = useRef(null);

  // Synchronize local inputValue with parent value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handler for input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Debounce API calls
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchPartsServerSide(newValue);
    }, 350);
  };

  // Fetch from /parts endpoint (server-side filtering)
  const fetchPartsServerSide = async (searchText) => {
    try {
      const params = [];
      if (searchText && searchText.trim() !== '') {
        params.push(`search=${encodeURIComponent(searchText.trim())}`);
      }
      const url = `/parts${params.length ? '?' + params.join('&') : ''}`;
      const response = await fetch(url, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch parts (server-side global search)');
      const data = await response.json();
      setResults(data.value || []);
    } catch (err) {
      setResults([]);
    }
  };

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
      value={inputValue}
      onChange={handleChange}
      aria-label="Global search"
    />
  );
}

GlobalSearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  setResults: PropTypes.func.isRequired,
  accessToken: PropTypes.string,
  placeholder: PropTypes.string
};
