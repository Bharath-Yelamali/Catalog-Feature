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
  showLeftColumn = true // Whether to show the left column with WHERE/AND/OR
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
  nestingLevel = 1
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

  // Get the group's position in the overall list of conditions + groups
  // This would need to be passed from FilterDropdown
  const groupPosition = groupIndex;

  // Popup state for add button
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const addBtnRef = useRef(null);

  // Handler for adding a new condition to this group
  const handleAddCondition = () => {
    if (onAddConditionToGroup && nestingLevel <= maxNesting) {
      onAddConditionToGroup(groupId || group.id, {
        field: searchableFields[0]?.key || '',
        operator: 'contains',
        value: ''
      });
      setAddPopupOpen(false);
    }
  };

  // Handler for adding a new group to this group
  const handleAddGroup = () => {
    if (onAddGroupToGroup && nestingLevel < maxNesting) {
      onAddGroupToGroup(groupIndex, {
        id: `group-${Date.now()}`,
        type: 'group',
        conditions: [],
        logicalOperator: 'or',
        nestingLevel: nestingLevel + 1
      });
      setAddPopupOpen(false);
    }
  };

  // Close popup when clicking outside
  React.useEffect(() => {
    if (!addPopupOpen) return;
    function handleClick(e) {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target)) {
        setAddPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [addPopupOpen]);

  return (
    <div className="filter-group">
      {/* Group header: show only if group has children */}
      {group.conditions.length > 0 ? (
        <div className="filter-group__header filter-group__header--filled">
          <span className="filter-group__header-text" style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>
            Any of the following are true…
          </span>
          <div className="filter-group__header-btn-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              className="filter-group__add-btn"
              title="Add"
              type="button"
              ref={addBtnRef}
              onClick={() => setAddPopupOpen((v) => !v)}
              style={{ position: 'relative' }}
            >
              <img src="/images/plus.svg" alt="Add" className="filter-group__add-icon" />
              {addPopupOpen && (
                <div
                  className="filter-group__add-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    marginTop: '6px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                  }}
                  onMouseEnter={() => setAddPopupOpen(true)}
                  onMouseLeave={() => setAddPopupOpen(false)}
                >
                  <button className="filter-group__add-popup-btn" type="button" style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', color: '#222' }} onClick={handleAddCondition}>
                    <img src="/images/plus.svg" alt="Add" style={{ width: '16px', height: '16px', marginRight: '10px' }} />
                    Add Condition
                  </button>
                  <button className="filter-group__add-popup-btn" type="button" style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', color: '#222' }} onClick={handleAddGroup}>
                    <img src="/images/plus.svg" alt="Add" style={{ width: '16px', height: '16px', marginRight: '10px' }} />
                    Add Condition Group
                  </button>
                </div>
              )}
            </button>
            <button className="filter-group__remove-btn" title="Remove group" type="button" onClick={() => onRemoveGroup(groupIndex)}>
              <img src="/images/garbage.svg" alt="Remove" className="filter-group__remove-icon" />
            </button>
            <button className="filter-group__drag-btn" title="Drag group" type="button">
              <img src="/images/dots.svg" alt="Drag" className="filter-group__drag-icon" />
            </button>
          </div>
        </div>
      ) : (
        <div className="filter-group__header filter-group__header--empty">
          <span className="filter-group__empty-text" style={{ flex: 1, textAlign: 'left' }}>
            Drag conditions here to add them to this group
          </span>
          <div className="filter-group__header-btn-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              className="filter-group__add-btn"
              title="Add"
              type="button"
              ref={addBtnRef}
              onClick={() => setAddPopupOpen((v) => !v)}
              style={{ position: 'relative' }}
            >
              <img src="/images/plus.svg" alt="Add" className="filter-group__add-icon" />
              {addPopupOpen && (
                <div
                  className="filter-group__add-popup"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    marginTop: '6px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    padding: '8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                  }}
                  onMouseEnter={() => setAddPopupOpen(true)}
                  onMouseLeave={() => setAddPopupOpen(false)}
                >
                  <button className="filter-group__add-popup-btn" type="button" style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', color: '#222' }} onClick={handleAddCondition}>
                    <img src="/images/plus.svg" alt="Add" style={{ width: '16px', height: '16px', marginRight: '10px' }} />
                    Add Condition
                  </button>
                  <button className="filter-group__add-popup-btn" type="button" style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', color: '#222' }} onClick={handleAddGroup}>
                    <img src="/images/plus.svg" alt="Add" style={{ width: '16px', height: '16px', marginRight: '10px' }} />
                    Add Condition Group
                  </button>
                </div>
              )}
            </button>
            <button className="filter-group__remove-btn" title="Remove group" type="button" onClick={() => onRemoveGroup(groupIndex)}>
              <img src="/images/garbage.svg" alt="Remove" className="filter-group__remove-icon" />
            </button>
            <button className="filter-group__drag-btn" title="Drag group" type="button">
              <img src="/images/dots.svg" alt="Drag" className="filter-group__drag-icon" />
            </button>
          </div>
        </div>
      )}
      {/* Conditions within the group, rendered below the button row */}
      {group.conditions.map((condition, conditionIndex) => (
        <div key={condition.id} className="filter-item-combined">
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
            draggedCondition={null} // You can wire up drag state if needed
            dragHoverTarget={null}
            onFieldChange={(idx, value) => onConditionFieldChange(groupIndex, idx, value)}
            onOperatorChange={(idx, value) => onConditionOperatorChange(groupIndex, idx, value)}
            onValueChange={(idx, value) => onConditionValueChange(groupIndex, idx, value)}
            onRemove={(idx) => {
              // Remove the condition from this group's conditions array only
              if (typeof onRemoveCondition === 'function') {
                onRemoveCondition(groupIndex, idx);
              }
            }}
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDragEnter={() => {}}
            onDragLeave={() => {}}
            onDrop={() => {}}
            onDragEnd={() => {}}
            searchableFields={searchableFields}
            inputValues={{ [conditionIndex]: condition.value }}
            showLeftColumn={false}
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
