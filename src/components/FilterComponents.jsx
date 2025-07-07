import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';
import garbageIcon from '../assets/garbage.svg';
import dotsIcon from '../assets/dots.svg';

// Individual Filter Condition Component (flat only)
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
  inputValues = {},
  showLeftColumn = true
}) {
  // Input validation
  if (!condition || typeof condition !== 'object') {
    console.error('FilterCondition: Invalid condition prop');
    return null;
  }
  if (typeof index !== 'number' || index < 0) {
    console.error('FilterCondition: Invalid index prop');
    return null;
  }
  const isDragging = draggedCondition === index;
  const isDragHover = dragHoverTarget === index;

  // Memoized event handlers
  const handleFieldChange = useCallback((e) => {
    if (onFieldChange) {
      onFieldChange(index, e.target.value);
    }
  }, [index, onFieldChange]);
  const handleOperatorChange = useCallback((e) => {
    if (onOperatorChange) {
      onOperatorChange(index, e.target.value);
    }
  }, [index, onOperatorChange]);
  const handleValueChange = useCallback((e) => {
    if (onValueChange) {
      onValueChange(index, e.target.value);
    }
  }, [index, onValueChange]);
  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(index);
    }
  }, [index, onRemove]);
  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('application/root-condition', JSON.stringify({ conditionIndex: index }));
    if (onDragStart) onDragStart(e, index);
  }, [index, onDragStart]);
  const handleDragEnter = useCallback((e) => {
    if (onDragEnter) {
      onDragEnter(e, index);
    }
  }, [index, onDragEnter]);
  const handleDragLeave = useCallback((e) => {
    if (onDragLeave) {
      onDragLeave(e, index);
    }
  }, [index, onDragLeave]);
  const handleDrop = useCallback((e) => {
    if (onDrop) {
      onDrop(e, index);
    }
  }, [index, onDrop]);

  return (
    <div className="filter-condition">
      {showLeftColumn && (
        <LogicalOperatorSelector 
          index={index}
          logicalOperator={logicalOperator}
          onOperatorChange={onOperatorChange}
          isFirstItem={true}
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
          onChange={handleFieldChange}
          onMouseDown={(e) => e.stopPropagation()}
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
          onChange={handleOperatorChange}
          onMouseDown={(e) => e.stopPropagation()}
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
          value={inputValues[index] || ''}
          onChange={handleValueChange}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Enter a value"
          className="filter-form-input"
          aria-label="Enter filter value"
        />
        {/* Remove button */}
        <button
          onClick={handleRemove}
          onMouseDown={(e) => e.stopPropagation()}
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

// PropTypes for FilterCondition
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
    label: PropTypes.string.isRequired,
    isMainTable: PropTypes.bool.isRequired
  })),
  inputValues: PropTypes.object,
  showLeftColumn: PropTypes.bool
};

// Default props for FilterCondition
FilterCondition.defaultProps = {
  searchableFields: [],
  inputValues: {},
  draggedCondition: null,
  dragHoverTarget: null,
  showLeftColumn: true
};
