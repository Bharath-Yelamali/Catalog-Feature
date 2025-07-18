
/**
 * FilterComponents.jsx
 *
 * This file contains the FilterCondition component, which renders a single filter condition row
 * with field, operator, and value controls, as well as drag-and-drop and remove functionality.
 *
 * @module src/components/FilterComponents
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';
import garbageIcon from '../../assets/garbage.svg';
import dotsIcon from '../../assets/dots.svg';

// Individual Filter Condition Component (flat only)
/**
 * Renders a single filter condition row with field, operator, value, drag-and-drop, and remove controls.
 *
 * @param {Object} props - The component props
 * @param {Object} props.condition - The filter condition object
 * @param {number} props.index - The index of this condition in the list
 * @param {'and'|'or'} props.logicalOperator - The logical operator for this condition
 * @param {number} [props.draggedCondition] - The index of the currently dragged condition
 * @param {number} [props.dragHoverTarget] - The index of the drag hover target
 * @param {Function} props.onFieldChange - Callback for field change
 * @param {Function} props.onOperatorChange - Callback for operator change
 * @param {Function} props.onValueChange - Callback for value change
 * @param {Function} props.onRemove - Callback for remove
 * @param {Function} props.onDragStart - Callback for drag start
 * @param {Function} props.onDragOver - Callback for drag over
 * @param {Function} props.onDragEnter - Callback for drag enter
 * @param {Function} props.onDragLeave - Callback for drag leave
 * @param {Function} props.onDrop - Callback for drop
 * @param {Function} props.onDragEnd - Callback for drag end
 * @param {Array} [props.searchableFields=[]] - Array of searchable field objects
 * @param {boolean} [props.showLeftColumn=true] - Whether to show the left column
 */
export function FilterCondition({ 
  condition,
  index,
  logicalOperator,
  draggedCondition,
  dragHoverTarget,
  onFieldChange,
  onOperatorChange,
  onValueChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  searchableFields = [],
  showLeftColumn = true
}) {
  /**
   * Input validation for required props
   */
  if (!condition || typeof condition !== 'object') {
    console.error('FilterCondition: Invalid condition prop');
    return null;
  }
  if (typeof index !== 'number' || index < 0) {
    console.error('FilterCondition: Invalid index prop');
    return null;
  }
  /**
   * Drag state for styling
   */
  const isDragging = draggedCondition === index;
  const isDragHover = dragHoverTarget === index;

  /**
   * Utility to stop event propagation
   * @param {Event} e
   */
  const stopPropagation = useCallback((e) => e.stopPropagation(), []);

  /**
   * Generic handler for field/operator/value changes
   * @param {'field'|'operator'|'value'} type
   * @param {Event} e
   */
  const handleChange = useCallback((type, e) => {
    const value = e.target.value;
    switch (type) {
      case 'field':
        onFieldChange && onFieldChange(index, value);
        break;
      case 'operator':
        onOperatorChange && onOperatorChange(index, value);
        break;
      case 'value':
        onValueChange && onValueChange(index, value);
        break;
      default:
        break;
    }
  }, [index, onFieldChange, onOperatorChange, onValueChange]);

  /**
   * Handler for removing this filter condition
   */
  const handleRemove = useCallback(() => {
    onRemove && onRemove(index);
  }, [index, onRemove]);

  /**
   * Drag-and-drop event handlers
   */
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('application/root-condition', JSON.stringify({ conditionIndex: index }));
    onDragStart && onDragStart(e, index);
  }, [index, onDragStart]);
  const handleDragEnter = useCallback((e) => {
    onDragEnter && onDragEnter(e, index);
  }, [index, onDragEnter]);
  const handleDragLeave = useCallback((e) => {
    onDragLeave && onDragLeave(e, index);
  }, [index, onDragLeave]);
  const handleDrop = useCallback((e) => {
    onDrop && onDrop(e, index);
  }, [index, onDrop]);

  // Use condition.value as the source of truth for value
  // Make isFirstItem dynamic: only true for index === 0
  return (
    <div className="filter-condition">
      {showLeftColumn && (
        <LogicalOperatorSelector
          index={index}
          logicalOperator={logicalOperator}
          onOperatorChange={onOperatorChange}
          isFirstItem={index === 0}
          showLabel={true}
        />
      )}
      <div
        className={`filter-condition__box ${
          isDragging ? 'filter-condition__box--dragging' : ''
        } ${isDragHover ? 'filter-condition__box--drag-hover' : ''}`}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={onDragEnd}
        role="listitem"
        aria-label={`Filter condition ${index + 1}`}
      >
        {/* Field dropdown */}
        <select
          value={condition.field || ''}
          onChange={handleChange.bind(null, 'field')}
          onMouseDown={stopPropagation}
          className="filter-form-select"
          aria-label="Select field to filter"
        >
          <option value="">Select field...</option>
          {searchableFields.map(field => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
        {/* Operator dropdown */}
        <select
          value={condition.operator || 'contains'}
          onChange={handleChange.bind(null, 'operator')}
          onMouseDown={stopPropagation}
          className="filter-form-select filter-form-select--operator"
          aria-label="Select filter operator"
        >
          <option value="contains">contains...</option>
          <option value="does not contain">does not contain...</option>
          <option value="is">==</option>
          <option value="is not">!=</option>
        </select>
        {/* Value input */}
        <input
          type="text"
          value={condition.value || ''}
          onChange={handleChange.bind(null, 'value')}
          onMouseDown={stopPropagation}
          placeholder="Enter a value"
          className="filter-form-input"
          aria-label="Enter filter value"
        />
        {/* Remove button */}
        <button
          onClick={handleRemove}
          onMouseDown={stopPropagation}
          className="filter-form-button--remove"
          title="Remove condition"
          aria-label={`Remove filter condition ${index + 1}`}
        >
          <img
            src={garbageIcon}
            alt=""
            className="filter-form-button--remove-icon"
          />
        </button>
        {/* Drag handle */}
        <div
          className="filter-drag-handle"
          title="Drag to reorder"
          aria-label={`Drag to reorder condition ${index + 1}`}
        >
          <img
            src={dotsIcon}
            alt=""
            className="filter-drag-handle__icon"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * PropTypes for FilterCondition
 */
FilterCondition.propTypes = {
  condition: PropTypes.shape({
    field: PropTypes.string,
    operator: PropTypes.string,
    value: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  logicalOperator: PropTypes.oneOf(['and', 'or']).isRequired,
  draggedCondition: PropTypes.number,
  dragHoverTarget: PropTypes.number,
  onFieldChange: PropTypes.func.isRequired,
  onOperatorChange: PropTypes.func.isRequired,
  onValueChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnter: PropTypes.func.isRequired,
  onDragLeave: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  searchableFields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  showLeftColumn: PropTypes.bool
};

/**
 * Default props for FilterCondition
 */
FilterCondition.defaultProps = {
  searchableFields: [],
  draggedCondition: null,
  dragHoverTarget: null,
  showLeftColumn: true
};
