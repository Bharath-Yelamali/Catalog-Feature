import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

// Individual Filter Condition Component
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
  inputValues = {}
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

  // Memoized event handlers to prevent unnecessary re-renders
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
    if (onDragStart) {
      onDragStart(e, index);
    }
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
      {/* AND/OR dropdown or "Where" label */}
      {index > 0 && (
        <>
          {index === 1 ? (
            <select
              value={logicalOperator}
              onChange={onOperatorChange}
              className="filter-condition__operator--select"
              aria-label="Logical operator between conditions"
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          ) : (
            <span className="filter-condition__operator">
              {logicalOperator?.toUpperCase()}
            </span>
          )}
        </>
      )}
      {index === 0 && <span className="filter-condition__where">Where</span>}
      
      {/* Condition box with controls */}
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
          <option value="is">is...</option>
          <option value="is not">is not...</option>
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
            src="/images/garbage.svg" 
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
            src="/images/dots.svg" 
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
  inputValues: PropTypes.object
};

// Default props for FilterCondition
FilterCondition.defaultProps = {
  searchableFields: [],
  inputValues: {},
  draggedCondition: null,
  dragHoverTarget: null
};

// Filter Group Component
export function FilterGroup({
  group,
  groupIndex,
  onConditionFieldChange,
  onConditionOperatorChange,
  onConditionValueChange,
  onRemoveCondition,
  onRemoveGroup,
  searchableFields = [],
  filterConditions = [],
  setFilterConditions,
  inputValues = {},
  setInputValues,
  setHasUnprocessedChanges
}) {
  // Input validation
  if (!group || typeof group !== 'object' || !Array.isArray(group.conditions)) {
    console.error('FilterGroup: Invalid group prop');
    return null;
  }

  if (typeof groupIndex !== 'number' || groupIndex < 0) {
    console.error('FilterGroup: Invalid groupIndex prop');
    return null;
  }

  const handleGroupLogicalOperatorChange = useCallback((e) => {
    // This would be passed down from parent if needed
    console.log('Group logical operator changed:', e.target.value);
  }, []);

  const handleDragToGroup = useCallback((e) => {
    try {
      e.preventDefault();
      e.currentTarget.style.backgroundColor = '#e9ecef';
      e.currentTarget.style.borderColor = '#adb5bd';
      
      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
      if (isNaN(draggedIndex) || draggedIndex < 0 || draggedIndex >= filterConditions.length) {
        console.warn('Invalid dragged index:', draggedIndex);
        return;
      }

      // Move condition to this group
      const conditionToMove = filterConditions[draggedIndex];
      if (!conditionToMove) {
        console.warn('No condition found at index:', draggedIndex);
        return;
      }
      
      // Remove condition from main list
      const newConditions = filterConditions.filter((_, i) => i !== draggedIndex);
      if (setFilterConditions) {
        setFilterConditions(newConditions);
      }
      
      // Add condition to this group (would need to be implemented in parent)
      
      // Update input values
      if (setInputValues) {
        const newInputValues = {};
        newConditions.forEach((condition, newIndex) => {
          const oldIndex = filterConditions.findIndex(c => c.id === condition.id);
          newInputValues[newIndex] = inputValues[oldIndex] || condition.value || '';
        });
        setInputValues(newInputValues);
      }
      
      if (setHasUnprocessedChanges) {
        setHasUnprocessedChanges(true);
      }
      
      console.log(`Moved condition to group ${groupIndex}`);
    } catch (error) {
      console.error('Error in handleDragToGroup:', error);
    }
  }, [filterConditions, setFilterConditions, inputValues, setInputValues, setHasUnprocessedChanges, groupIndex]);

  return (
    <div 
      className="filter-group"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = '#d1ecf1';
        e.currentTarget.style.borderColor = '#bee5eb';
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.style.backgroundColor = '#e9ecef';
          e.currentTarget.style.borderColor = '#adb5bd';
        }
      }}
      onDrop={handleDragToGroup}
    >
      {/* Group header */}
      <div className={`filter-group__header ${
        group.conditions.length === 0 ? 'filter-group__header--empty' : 'filter-group__header--filled'
      }`}>
        {group.conditions.length === 0 && (
          <span className="filter-group__empty-text">
            Drag conditions here to add them to this group
          </span>
        )}
        
        {/* Remove button for group */}
        <button
          onClick={() => onRemoveGroup(groupIndex)}
          className="filter-group__remove-btn"
          title="Remove group"
        >
          <img 
            src="/images/garbage.svg" 
            alt="Remove" 
            className="filter-group__remove-icon"
          />
        </button>
      </div>
      
      {/* Conditions within the group */}
      {group.conditions.map((condition, conditionIndex) => (
        <div 
          key={condition.id} 
          className="filter-group__condition"
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', `group-${groupIndex}-${conditionIndex}`);
            e.target.style.opacity = '0.5';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.backgroundColor = '#e8f4fd';
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }
          }}
          onDragEnd={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          {conditionIndex > 0 && (
            <>
              {conditionIndex === 1 ? (
                <select
                  value={group.logicalOperator}
                  onChange={handleGroupLogicalOperatorChange}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="filter-group__condition-operator--select"
                >
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                </select>
              ) : (
                <span className="filter-condition__operator">
                  {group.logicalOperator}
                </span>
              )}
            </>
          )}
          {conditionIndex === 0 && <span className="filter-condition__where">Where</span>}
          
          {/* Field dropdown */}
          <select
            value={condition.field}
            onChange={(e) => onConditionFieldChange(groupIndex, conditionIndex, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="filter-form-select"
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
            value={condition.operator}
            onChange={(e) => onConditionOperatorChange(groupIndex, conditionIndex, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="filter-form-select filter-form-select--operator"
          >
            <option value="contains">contains...</option>
            <option value="does not contain">does not contain...</option>
            <option value="is">is...</option>
            <option value="is not">is not...</option>
          </select>
          
          {/* Value input */}
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onConditionValueChange(groupIndex, conditionIndex, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Enter a value"
            className="filter-form-input"
          />
          
          {/* Remove condition from group button */}
          <button
            onClick={() => onRemoveCondition(groupIndex, conditionIndex)}
            className="filter-group__condition-remove"
            title="Remove from group"
          >
            <img 
              src="/images/garbage.svg" 
              alt="Remove" 
              className="filter-group__condition-remove-icon"
            />
          </button>
          
          {/* Drag handle */}
          <div className="filter-group__drag-handle" title="Drag to reorder">
            <img 
              src="/images/dots.svg" 
              alt="Drag to reorder" 
              className="filter-group__drag-handle-icon"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// PropTypes for FilterGroup
FilterGroup.propTypes = {
  group: PropTypes.shape({
    conditions: PropTypes.array.isRequired,
    logicalOperator: PropTypes.oneOf(['and', 'or'])
  }).isRequired,
  groupIndex: PropTypes.number.isRequired,
  onConditionFieldChange: PropTypes.func.isRequired,
  onConditionOperatorChange: PropTypes.func.isRequired,
  onConditionValueChange: PropTypes.func.isRequired,
  onRemoveCondition: PropTypes.func.isRequired,
  onRemoveGroup: PropTypes.func.isRequired,
  searchableFields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isMainTable: PropTypes.bool.isRequired
  })),
  filterConditions: PropTypes.array,
  setFilterConditions: PropTypes.func,
  inputValues: PropTypes.object,
  setInputValues: PropTypes.func,
  setHasUnprocessedChanges: PropTypes.func
};

// Default props for FilterGroup
FilterGroup.defaultProps = {
  searchableFields: [],
  filterConditions: [],
  inputValues: {},
  setFilterConditions: null,
  setInputValues: null,
  setHasUnprocessedChanges: null
};
