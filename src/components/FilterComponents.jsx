import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';

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
  inputValues = {},
  showLeftColumn = true, // Whether to show the left column with WHERE/AND/OR
  isInGroup = false, // New prop: whether this condition is inside a group
  groupId, // New prop: group ID, if applicable
  conditionIndexInGroup // New prop: index of this condition in its group
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
    if (isInGroup && typeof groupId === 'string' && typeof conditionIndexInGroup === 'number') {
      // Dragging from group: use a clear type
      e.dataTransfer.setData('application/group-condition', JSON.stringify({ groupId, conditionIndex: conditionIndexInGroup }));
    } else if (!isInGroup) {
      // Dragging from root: use a clear type
      e.dataTransfer.setData('application/root-condition', JSON.stringify({ conditionIndex: index }));
      if (onDragStart) onDragStart(e, index);
    }
  }, [index, onDragStart, isInGroup, groupId, conditionIndexInGroup]);

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
      {/* Conditionally show left column based on prop */}
      {showLeftColumn && (
        <LogicalOperatorSelector 
          index={index}
          logicalOperator={logicalOperator}
          onOperatorChange={onOperatorChange}
          isFirstItem={true}
          showLabel={true}
        />
      )}
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
  groupId, // <-- new prop
  logicalOperator,
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
  setHasUnprocessedChanges,
  showLeftColumn = true,
  onAddConditionToGroup,
  onAddGroupToGroup,
  maxNesting = 3,
  nestingLevel = 1,
  onReorderConditionInGroup // <-- new prop
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

  // Drag state for group conditions
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragHoverIndex, setDragHoverIndex] = useState(null);
  // Visual feedback for root-to-group drop
  const [isRootDropActive, setIsRootDropActive] = useState(false);

  // Drag handlers for group conditions
  const handleDragStart = (e, idx) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragHoverIndex(idx);
  };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== idx && typeof onReorderConditionInGroup === 'function') {
      onReorderConditionInGroup(groupId || group.id, draggedIndex, idx);
    }
    setDraggedIndex(null);
    setDragHoverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragHoverIndex(null);
  };

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

  // Get the group's position in the overall list of conditions + groups
  // This would need to be passed from FilterDropdown
  const groupPosition = groupIndex;

  // Handler for adding a new condition to this group
  const handleAddCondition = () => {
    if (onAddConditionToGroup && nestingLevel <= maxNesting) {
      onAddConditionToGroup(groupId || group.id, {
        field: searchableFields[0]?.key || '',
        operator: 'contains',
        value: ''
      });
    }
  };

  // Enable drag-and-drop of root conditions into this group
  const handleGroupDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent drop zones
    setIsRootDropActive(false);
    // Guard: only process if not already handled
    if (e.__dropHandled) return;
    e.__dropHandled = true;
    const rootData = e.dataTransfer.getData('application/root-condition');
    if (rootData) {
      const { conditionIndex } = JSON.parse(rootData);
      if (typeof onAddConditionToGroup === 'function') {
        onAddConditionToGroup(groupId || group.id, Number(conditionIndex), { moveFromRoot: true });
      }
    }
  };
  const handleGroupDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/root-condition')) {
      setIsRootDropActive(true);
    }
  };
  const handleGroupDragEnter = (e) => {
    if (e.dataTransfer.types.includes('application/root-condition')) {
      setIsRootDropActive(true);
    }
  };
  const handleGroupDragLeave = (e) => {
    setIsRootDropActive(false);
  };

  return (
    <div
      className={`filter-group${isRootDropActive ? ' filter-group__root-drop-active' : ''}`}
      onDrop={handleGroupDrop}
      onDragOver={handleGroupDragOver}
      onDragEnter={handleGroupDragEnter}
      onDragLeave={handleGroupDragLeave}
    >
      {/* Group header: show only if group has children */}
      {group.conditions.length > 0 ? (
        <div className="filter-group__header filter-group__header--filled">
          <span className="filter-group__header-text" style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>
            Any of the following are true…
          </span>
          <div className="filter-group__header-btn-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button className="filter-group__add-btn"
              title="Add Condition"
              type="button"
              onClick={handleAddCondition}
            >
              <img src="/images/plus.svg" alt="Add" className="filter-group__add-icon" />
            </button>
            <button className="filter-group__remove-btn" title="Remove group" type="button" onClick={() => onRemoveGroup(groupIndex)}>
              <img src="/images/garbage.svg" alt="Remove" className="filter-group__remove-icon" />
            </button>
          </div>
        </div>
      ) : (
        <div className="filter-group__header filter-group__header--empty">
          <span className="filter-group__empty-text" style={{ flex: 1, textAlign: 'left' }}>
            Drag conditions here to add them to this group
          </span>
          <div className="filter-group__header-btn-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button className="filter-group__add-btn"
              title="Add Condition"
              type="button"
              onClick={handleAddCondition}
            >
              <img src="/images/plus.svg" alt="Add" className="filter-group__add-icon" />
            </button>
            <button className="filter-group__remove-btn" title="Remove group" type="button" onClick={() => onRemoveGroup(groupIndex)}>
              <img src="/images/garbage.svg" alt="Remove" className="filter-group__remove-icon" />
            </button>
          </div>
        </div>
      )}
      {/* Conditions within the group, rendered below the button row */}
      {group.conditions.map((condition, conditionIndex) => (
        <div key={condition.id} className={`filter-item-combined${draggedIndex === conditionIndex ? ' filter-condition__box--dragging' : ''}${dragHoverIndex === conditionIndex ? ' filter-condition__box--drag-hover' : ''}`}> 
          {/* Left column for Where/AND/OR, always outside the box */}
          <div className="filter-left-column">
            <LogicalOperatorSelector
              index={conditionIndex}
              logicalOperator={group.logicalOperator || 'or'}
              onOperatorChange={(_, value) => {
                // Implement group-specific handling here if needed
                console.log('Changing group condition operator to:', value);
              }}
              isFirstItem={conditionIndex === 0}
              showLabel={true}
              textClassName="filter-universal-operator--text"
              dropdownClassName="filter-universal-operator--select"
            />
          </div>
          {/* Use FilterCondition for consistent rendering */}
          <FilterCondition
            condition={condition}
            index={conditionIndex}
            logicalOperator={group.logicalOperator || 'or'}
            draggedCondition={draggedIndex}
            dragHoverTarget={dragHoverIndex}
            onFieldChange={(idx, value) => onConditionFieldChange(groupIndex, idx, value)}
            onOperatorChange={(idx, value) => onConditionOperatorChange(groupIndex, idx, value)}
            onValueChange={(idx, value) => onConditionValueChange(groupIndex, idx, value)}
            onRemove={(idx) => {
              // Remove the condition from this group's conditions array only
              if (typeof onRemoveCondition === 'function') {
                onRemoveCondition(groupIndex, idx);
              }
            }}
            onDragStart={(e) => handleDragStart(e, conditionIndex)}
            onDragOver={(e) => handleDragOver(e, conditionIndex)}
            onDragEnter={(e) => handleDragOver(e, conditionIndex)}
            onDragLeave={handleDragEnd}
            onDrop={(e) => handleDrop(e, conditionIndex)}
            onDragEnd={handleDragEnd}
            searchableFields={searchableFields}
            inputValues={{ [conditionIndex]: condition.value }}
            showLeftColumn={false}
            isInGroup={true}
            groupId={groupId || group.id}
            conditionIndexInGroup={conditionIndex}
          />
        </div>
      ))}
    </div>
  );
}

// PropTypes for FilterGroup
export const FilterGroupPropTypes = {
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

FilterGroup.propTypes = FilterGroupPropTypes;

// Default props for FilterGroup
FilterGroup.defaultProps = {
  searchableFields: [],
  filterConditions: [],
  inputValues: {},
  setFilterConditions: null,
  setInputValues: null,
  setHasUnprocessedChanges: null
};
