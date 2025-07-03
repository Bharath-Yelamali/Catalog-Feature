import React from 'react';
import { FilterCondition, FilterGroup } from './FilterComponents';

export function FilterDropdown({
  filterConditions,
  setFilterConditions,
  conditionGroups,
  setConditionGroups,
  inputValues,
  setInputValues,
  hasUnprocessedChanges,
  setHasUnprocessedChanges,
  logicalOperator,
  setLogicalOperator,
  draggedCondition,
  dragHoverTarget,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  searchableFields
}) {
  
  // Handler functions for conditions
  const handleFieldChange = (index, value) => {
    const newConditions = [...filterConditions];
    newConditions[index].field = value;
    setFilterConditions(newConditions);
    setHasUnprocessedChanges(true);
  };

  const handleOperatorChange = (index, value) => {
    if (index === 'logical') {
      setLogicalOperator(value);
    } else {
      const newConditions = [...filterConditions];
      newConditions[index].operator = value;
      setFilterConditions(newConditions);
    }
    setHasUnprocessedChanges(true);
  };

  const handleValueChange = (index, value) => {
    // Update local input state immediately for UI responsiveness
    setInputValues(prev => ({ ...prev, [index]: value }));
    
    // Update filter conditions immediately (no debouncing here)
    setFilterConditions(prevConditions => {
      const newConditions = [...prevConditions];
      newConditions[index].value = value;
      return newConditions;
    });
    
    // Mark that we have unprocessed changes
    setHasUnprocessedChanges(true);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = filterConditions.filter((_, i) => i !== index);
    setFilterConditions(newConditions);
    // Clean up input values - reindex remaining values
    const newInputValues = {};
    newConditions.forEach((condition, newIndex) => {
      const oldIndex = filterConditions.findIndex(c => c.id === condition.id);
      newInputValues[newIndex] = inputValues[oldIndex] || condition.value;
    });
    setInputValues(newInputValues);
    setHasUnprocessedChanges(true);
  };

  const handleAddCondition = () => {
    const newIndex = filterConditions.length;
    setFilterConditions([...filterConditions, {
      id: Date.now(),
      field: 'inventoryItemNumber',
      operator: 'contains',
      value: ''
    }]);
    // Initialize input value for the new condition
    setInputValues(prev => ({ ...prev, [newIndex]: '' }));
    setHasUnprocessedChanges(true);
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: Date.now(),
      type: 'group',
      conditions: [],
      logicalOperator: 'and'
    };
    setConditionGroups([...conditionGroups, newGroup]);
  };

  // Group-related handlers
  const handleGroupConditionFieldChange = (groupIndex, conditionIndex, value) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions[conditionIndex].field = value;
    setConditionGroups(newGroups);
    setHasUnprocessedChanges(true);
  };

  const handleGroupConditionOperatorChange = (groupIndex, conditionIndex, value) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions[conditionIndex].operator = value;
    setConditionGroups(newGroups);
    setHasUnprocessedChanges(true);
  };

  const handleGroupConditionValueChange = (groupIndex, conditionIndex, value) => {
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions[conditionIndex].value = value;
    setConditionGroups(newGroups);
    setHasUnprocessedChanges(true);
  };

  const handleRemoveConditionFromGroup = (groupIndex, conditionIndex) => {
    // Move condition back to main list
    const conditionToMove = conditionGroups[groupIndex].conditions[conditionIndex];
    setFilterConditions([...filterConditions, conditionToMove]);
    
    // Remove from group
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
    setConditionGroups(newGroups);
    
    // Update input values
    const newInputValues = { ...inputValues };
    newInputValues[filterConditions.length] = conditionToMove.value;
    setInputValues(newInputValues);
    
    setHasUnprocessedChanges(true);
  };

  const handleRemoveGroup = (groupIndex) => {
    // Move all conditions back to main list before removing group
    const groupConditions = conditionGroups[groupIndex].conditions;
    if (groupConditions.length > 0) {
      setFilterConditions([...filterConditions, ...groupConditions]);
      
      // Update input values for moved conditions
      const newInputValues = { ...inputValues };
      groupConditions.forEach((condition, index) => {
        newInputValues[filterConditions.length + index] = condition.value;
      });
      setInputValues(newInputValues);
    }
    
    // Remove the group
    const newGroups = conditionGroups.filter((_, i) => i !== groupIndex);
    setConditionGroups(newGroups);
    setHasUnprocessedChanges(true);
  };

  return (
    <div className={`filter-dropdown ${filterConditions.length === 0 ? 'filter-dropdown--empty' : ''}`}>
      {filterConditions.length === 0 ? (
        <div className="filter-dropdown__empty">
          No filter conditions are applied
        </div>
      ) : (
        <div className="filter-dropdown__conditions">
          <div className="filter-dropdown__header">
            In this view, show records
          </div>
          
          {/* Render filter conditions */}
          {filterConditions.map((condition, index) => (
            <FilterCondition
              key={condition.id}
              condition={condition}
              index={index}
              logicalOperator={logicalOperator}
              draggedCondition={draggedCondition}
              dragHoverTarget={dragHoverTarget}
              onFieldChange={handleFieldChange}
              onOperatorChange={handleOperatorChange}
              onValueChange={handleValueChange}
              onRemove={handleRemoveCondition}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              searchableFields={searchableFields}
              inputValues={inputValues}
            />
          ))}
          
          {/* Render condition groups */}
          {conditionGroups.map((group, groupIndex) => (
            <FilterGroup
              key={group.id}
              group={group}
              groupIndex={groupIndex}
              onConditionFieldChange={handleGroupConditionFieldChange}
              onConditionOperatorChange={handleGroupConditionOperatorChange}
              onConditionValueChange={handleGroupConditionValueChange}
              onRemoveCondition={handleRemoveConditionFromGroup}
              onRemoveGroup={handleRemoveGroup}
              searchableFields={searchableFields}
              filterConditions={filterConditions}
              setFilterConditions={setFilterConditions}
              inputValues={inputValues}
              setInputValues={setInputValues}
              setHasUnprocessedChanges={setHasUnprocessedChanges}
            />
          ))}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="filter-dropdown__actions">
        <button onClick={handleAddCondition} className="filter-action-btn">
          <img 
            src="/images/plus.svg" 
            alt="" 
            className="filter-action-btn__icon"
          />
          Add Condition
        </button>
        <button onClick={handleAddGroup} className="filter-action-btn">
          <img 
            src="/images/plus.svg" 
            alt="" 
            className="filter-action-btn__icon"
          />
          Add Condition Group
        </button>
      </div>
    </div>
  );
}
