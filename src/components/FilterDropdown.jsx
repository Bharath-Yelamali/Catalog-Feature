import React from 'react';
import { FilterCondition, FilterGroup } from './FilterComponents';
import { UnifiedFilterList } from './UnifiedFilterList';

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
  console.log('FilterDropdown received searchableFields:', searchableFields);
  
  // Handler functions for conditions
  const handleFieldChange = (index, value) => {
    const newConditions = [...filterConditions];
    newConditions[index].field = value;
    setFilterConditions(newConditions);
    setHasUnprocessedChanges(true);
  };

  // Recursive helper to add a condition to a group by groupId
  function addConditionToGroup(groups, groupId, newCondition, moveFromRootIndex = null) {
    return groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, newCondition]
        };
      }
      // Recursively update subgroups
      return {
        ...group,
        conditions: group.conditions.map(cond =>
          cond.type === 'group'
            ? addConditionToGroup([cond], groupId, newCondition, moveFromRootIndex)[0]
            : cond
        )
      };
    });
  }

  // Handler for adding a condition to a group (from button or drag)
  const handleAddConditionToGroup = (groupId, conditionOrIndex, opts = {}) => {
    if (opts.moveFromRoot) {
      // Move a root-level condition into the group
      const idx = conditionOrIndex;
      const conditionToMove = filterConditions[idx];
      if (!conditionToMove) return;
      setFilterConditions(prev => prev.filter((_, i) => i !== idx));
      setConditionGroups(prevGroups => addConditionToGroup(prevGroups, groupId, conditionToMove));
      setHasUnprocessedChanges(true);
    } else {
      // Add a new condition via button
      setConditionGroups(prevGroups => addConditionToGroup(prevGroups, groupId, {
        ...conditionOrIndex,
        id: `group-condition-${Date.now()}-${Math.floor(Math.random()*10000)}`
      }));
      setHasUnprocessedChanges(true);
    }
  };

  const handleOperatorChange = (index, value) => {
    console.log(`handleOperatorChange called with index: ${index}, value: ${value}`);
    if (index === 'logical') {
      console.log('Setting logical operator to:', value);
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
    const defaultField = searchableFields && searchableFields.length > 0 
      ? searchableFields[0].key 
      : 'inventoryItemNumber';
      
    console.log('Adding new condition with searchableFields:', searchableFields);
    
    setFilterConditions([...filterConditions, {
      id: Date.now(),
      field: defaultField,
      operator: 'contains',
      value: ''
    }]);
    // Initialize input value for the new condition
    setInputValues(prev => ({ ...prev, [newIndex]: '' }));
    setHasUnprocessedChanges(true);
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}-${Math.floor(Math.random()*10000)}`,
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
    // Remove the condition from the group only (do not move to root)
    const newGroups = [...conditionGroups];
    newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
    setConditionGroups(newGroups);
    // Optionally clean up input values for this condition if needed
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

  // Utility: reorder array
  function reorderArray(arr, fromIndex, toIndex) {
    const newArr = [...arr];
    const [moved] = newArr.splice(fromIndex, 1);
    newArr.splice(toIndex, 0, moved);
    return newArr;
  }

  // Handler: reorder conditions within a group
  function handleReorderConditionInGroup(groupIndex, fromIndex, toIndex) {
    setConditionGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const group = { ...newGroups[groupIndex] };
      group.conditions = reorderArray(group.conditions, fromIndex, toIndex);
      newGroups[groupIndex] = group;
      return newGroups;
    });
    setHasUnprocessedChanges(true);
  }

  // Handler for moving a condition from a group to the root (via drag-and-drop)
  const handleMoveConditionToRoot = (groupId, conditionIndex) => {
    let extracted = { newGroups: null, condition: null };
    function removeAndExtract(groups) {
      return groups.map(group => {
        if (group.id === groupId) {
          const newConds = group.conditions.filter((cond, idx) => {
            if (idx === conditionIndex) {
              extracted.condition = cond;
              return false;
            }
            return true;
          });
          return { ...group, conditions: newConds };
        }
        // Recursively check subgroups
        return {
          ...group,
          conditions: group.conditions.map(cond =>
            cond.type === 'group'
              ? removeAndExtract([cond])[0]
              : cond
          )
        };
      });
    }
    setConditionGroups(prevGroups => {
      extracted = { newGroups: null, condition: null };
      const newGroups = removeAndExtract(prevGroups);
      extracted.newGroups = newGroups;
      return newGroups;
    });
    // Use a timeout to ensure setConditionGroups has run before updating root
    setTimeout(() => {
      if (extracted.condition) {
        setFilterConditions(prev => [
          ...prev,
          { ...extracted.condition, id: `root-condition-${Date.now()}-${Math.floor(Math.random()*10000)}` }
        ]);
        setHasUnprocessedChanges(true);
      }
    }, 0);
  };

  return (
    <div className={`filter-dropdown ${(filterConditions.length === 0 && conditionGroups.length === 0) ? 'filter-dropdown--empty' : ''}`}>
      {(filterConditions.length === 0 && conditionGroups.length === 0) ? (
        <div className="filter-dropdown__empty">
          No filter conditions are applied
        </div>
      ) : (
        <div className="filter-dropdown__conditions"
          onDragOver={e => {
            // Allow drop if dragging a group condition
            if (e.dataTransfer.types.includes('application/group-condition')) {
              e.preventDefault();
            }
          }}
          onDrop={e => {
            // Handle drop from group condition
            const data = e.dataTransfer.getData('application/group-condition');
            if (data) {
              try {
                const { groupId, conditionIndex } = JSON.parse(data);
                if (typeof groupId === 'string' && typeof conditionIndex === 'number') {
                  handleMoveConditionToRoot(groupId, conditionIndex);
                }
              } catch (err) {
                // Ignore
              }
            }
          }}
        >
          <div className="filter-dropdown__header">
            In this view, show records
          </div>
          
          {/* Unified filter list with universal left column */}
          <UnifiedFilterList
            filterConditions={filterConditions}
            conditionGroups={conditionGroups}
            logicalOperator={logicalOperator}
            onOperatorChange={handleOperatorChange}
            inputValues={inputValues}
            searchableFields={searchableFields}
            draggedCondition={draggedCondition}
            dragHoverTarget={dragHoverTarget}
            onFieldChange={handleFieldChange}
            onValueChange={handleValueChange}
            onRemoveCondition={handleRemoveCondition}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onRemoveGroup={handleRemoveGroup}
            onAddConditionToGroup={handleAddConditionToGroup}
            onRemoveConditionFromGroup={handleRemoveConditionFromGroup}
            onFieldChangeInGroup={handleGroupConditionFieldChange}
            onOperatorChangeInGroup={handleGroupConditionOperatorChange}
            onValueChangeInGroup={handleGroupConditionValueChange}
            onReorderConditionInGroup={handleReorderConditionInGroup}
            onMoveConditionToRoot={handleMoveConditionToRoot}
            setHasUnprocessedChanges={setHasUnprocessedChanges}
          />
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
