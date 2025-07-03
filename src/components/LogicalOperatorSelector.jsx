import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * A shared component for displaying the logical operator (AND/OR) between conditions and groups
 * @param {Object} props - Component props
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
  const handleLogicalOperatorChange = useCallback((e) => {
    if (onOperatorChange) {
      // Pass 'logical' as index to indicate this is changing the logical operator
      onOperatorChange('logical', e.target.value);
    }
  }, [onOperatorChange]);

  // First item gets "Where" label
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
