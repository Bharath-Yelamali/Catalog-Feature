
/**
 * LogicalOperatorSelector.jsx
 *
 * This component renders the logical operator (AND/OR) selector or label between filter conditions.
 * It supports a dropdown for the second condition and text for subsequent ones, and a "Where" label for the first.
 *
 * @module src/components/LogicalOperatorSelector
 * @author Bharath-Yelamali
 * @created 2025-07-17
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * LogicalOperatorSelector component
 * Displays the logical operator (AND/OR) between filter conditions or groups.
 *
 * - For the first item (index 0), optionally shows a "Where" label.
 * - For the second item (index 1), renders a dropdown to select AND/OR.
 * - For subsequent items, displays the operator as text.
 *
 * @param {Object} props - Component props
 * @param {number} props.index - The index of the condition in the list
 * @param {'and'|'or'} props.logicalOperator - The current logical operator
 * @param {Function} props.onOperatorChange - Callback for operator change
 * @param {boolean} [props.isFirstItem=false] - Whether this is the first item (for "Where" label)
 * @param {string} [props.className] - Optional wrapper class
 * @param {string} [props.textClassName] - Optional class for text
 * @param {string} [props.dropdownClassName] - Optional class for dropdown
 * @param {boolean} [props.showLabel=true] - Whether to show the "Where" label for the first item
 * @returns {JSX.Element|null} Logical operator element or null for first item
 */
export function LogicalOperatorSelector({
  index,
  logicalOperator,
  onOperatorChange,
  isFirstItem = false, // Used for the "Where" label for the first item
  className = '',
  textClassName = '',
  dropdownClassName = '',
  showLabel = true // Whether to show "Where" label for first item
}) {
  /**
   * Handles change of the logical operator dropdown.
   * Passes 'logical' as the index to indicate a group-level change.
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleLogicalOperatorChange = useCallback((e) => {
    if (onOperatorChange) {
      // Pass 'logical' as index to indicate this is changing the logical operator
      onOperatorChange('logical', e.target.value);
    }
  }, [onOperatorChange]);

  // First item gets "Where" label if enabled
  if (index === 0) {
    return showLabel && isFirstItem ? (
      <span className={`filter-universal-where ${textClassName}`}>Where</span>
    ) : null;
  }

  // Only the second item gets the dropdown, others just display the text
  if (index === 1) {
    return (
      <select
        value={logicalOperator}
        onChange={handleLogicalOperatorChange}
        className={`filter-universal-operator--select ${dropdownClassName}`}
        aria-label="Logical operator between conditions"
      >
        <option value="and">AND</option>
        <option value="or">OR</option>
      </select>
    );
  }

  // All subsequent items display the text version
  return (
    <span className={`filter-universal-operator--text ${textClassName}`}>
      {(logicalOperator || 'and').toUpperCase()}
    </span>
  );
}


/**
 * PropTypes for LogicalOperatorSelector
 */
LogicalOperatorSelector.propTypes = {
  index: PropTypes.number.isRequired,
  logicalOperator: PropTypes.oneOf(['and', 'or']).isRequired,
  onOperatorChange: PropTypes.func.isRequired,
  isFirstItem: PropTypes.bool,
  className: PropTypes.string,
  textClassName: PropTypes.string,
  dropdownClassName: PropTypes.string,
  showLabel: PropTypes.bool
};
