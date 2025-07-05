import React from 'react';
import { UnifiedFilterList } from './UnifiedFilterList';
import plusIcon from '../assets/plus.svg';

export function FilterDropdown({
  filterConditions,
  setFilterConditions,
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
  // Handler functions for flat filter conditions
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
    setInputValues(prev => ({ ...prev, [index]: value }));
    setFilterConditions(prevConditions => {
      const newConditions = [...prevConditions];
      newConditions[index].value = value;
      return newConditions;
    });
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
    setFilterConditions([...filterConditions, {
      id: Date.now(),
      field: defaultField,
      operator: 'contains',
      value: ''
    }]);
    setInputValues(prev => ({ ...prev, [newIndex]: '' }));
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
          <UnifiedFilterList
            filterConditions={filterConditions}
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
            setHasUnprocessedChanges={setHasUnprocessedChanges}
          />
        </div>
      )}
      <div className="filter-dropdown__actions">
        <button onClick={handleAddCondition} className="filter-action-btn">
          <img 
            src={plusIcon} 
            alt="" 
            className="filter-action-btn__icon"
          />
          Add Condition
        </button>
      </div>
    </div>
  );
}
