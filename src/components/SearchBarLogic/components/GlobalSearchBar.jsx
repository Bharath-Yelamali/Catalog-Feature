/**
 * GlobalSearchBar Component
 * -------------------------
 * Renders a text input for global search, styled to align with other search bar controls.
 *
 * Features:
 * - Debounced input for efficient server-side filtering
 * - Triggers a filter search with OR'ed conditions across all searchable fields
 * - Integrates with parent filter/search logic
 *
 * @fileoverview Global search input for the main table UI, with debounced filter trigger.
 */
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { searchableFields } from '../constants';

/**
 * GlobalSearchBar - a text input for global search, styled to align with other search bar controls.
 * Triggers a filter search with 8 OR'ed conditions for server-side filtering.
 */
export function GlobalSearchBar({ value, setInputValue, onGlobalSearchConditionsChange, placeholder = 'Global search...' }) {
  const debounceTimeout = useRef(null);

  // Handler for input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (typeof setInputValue === 'function') {
      setInputValue(newValue);
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      handleGlobalSearch(newValue);
    }, 350);
  };

  // Build 8 OR'ed conditions and trigger the filter search
  const handleGlobalSearch = (searchText) => {
    if (!onGlobalSearchConditionsChange) return;
    if (!searchText || searchText.trim() === '') {
      onGlobalSearchConditionsChange({ conditions: [], logicalOperator: 'or' });
      return;
    }
    // Build 8 conditions (one per field)
    const conditions = searchableFields.map(field => ({
      field: field.key, // UI key
      operator: 'contains',
      value: searchText.trim()
    }));
    onGlobalSearchConditionsChange({ conditions, logicalOperator: 'or' });
  };

  return (
    <input
      type="text"
      className="global-search-input"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      aria-label="Global search"
    />
  );
}

GlobalSearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  setInputValue: PropTypes.func,
  onGlobalSearchConditionsChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};
