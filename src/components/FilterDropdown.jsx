
/**
 * FilterDropdown.jsx
 *
 * This component renders a dropdown UI for managing a list of filter conditions, including
 * adding, removing, editing, and reordering conditions. It supports drag-and-drop, logical operator
 * selection, and integrates with UnifiedFilterList for rendering the list of conditions.
 *
 * @module src/components/FilterDropdown
 */

import React from 'react';
import { UnifiedFilterList } from './UnifiedFilterList';
import plusIcon from '../assets/plus.svg';

/**
 * FilterDropdown component for managing filter conditions.
 *
 * @param {Object} props - The component props
 * @param {Array} props.filterConditions - Array of filter condition objects
 * @param {Function} props.setFilterConditions - Setter for filter conditions array
 * @param {boolean} props.hasUnprocessedChanges - Whether there are unsaved changes
 * @param {Function} props.setHasUnprocessedChanges - Setter for unsaved changes flag
 * @param {'and'|'or'} props.logicalOperator - The logical operator for the filter group
 * @param {Function} props.setLogicalOperator - Setter for logical operator
 * @param {number} [props.draggedCondition] - Index of the currently dragged condition
 * @param {number} [props.dragHoverTarget] - Index of the drag hover target
 * @param {Function} props.handleDragStart - Handler for drag start
 * @param {Function} props.handleDragOver - Handler for drag over
 * @param {Function} props.handleDragEnter - Handler for drag enter
 * @param {Function} props.handleDragLeave - Handler for drag leave
 * @param {Function} props.handleDrop - Handler for drop
 * @param {Function} props.handleDragEnd - Handler for drag end
 * @param {Array} props.searchableFields - Array of searchable field objects
 */
export function FilterDropdown({
  filterConditions,
  setFilterConditions,
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

  /**
   * Handles field change for a filter condition.
   * @param {number} index - Index of the condition to update
   * @param {string} value - New field value
   */
  const handleFieldChange = (index, value) => {
    const newConditions = [...filterConditions];
    newConditions[index].field = value;
    setFilterConditions(newConditions);
    setHasUnprocessedChanges(true);
  };


  /**
   * Handles operator change for a filter condition or the logical operator.
   * @param {number|string} index - Index of the condition or 'logical' for group operator
   * @param {string} value - New operator value
   */
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

  /**
   * Handles value change for a filter condition.
   * @param {number} index - Index of the condition to update
   * @param {string} value - New value for the condition
   */
  const handleValueChange = (index, value) => {
    const newConditions = [...filterConditions];
    newConditions[index].value = value;
    setFilterConditions(newConditions);
    setHasUnprocessedChanges(true);
  };

  /**
   * Handles removing a filter condition.
   * @param {number} index - Index of the condition to remove
   */
  const handleRemoveCondition = (index) => {
    const newConditions = filterConditions.filter((_, i) => i !== index);
    setFilterConditions(newConditions);
    setHasUnprocessedChanges(true);
  };

  /**
   * Handles adding a new filter condition.
   * Adds a new condition with default values to the list.
   */
  const handleAddCondition = () => {
    const defaultField = searchableFields && searchableFields.length > 0 
      ? searchableFields[0].key 
      : 'inventoryItemNumber';
    setFilterConditions([
      ...filterConditions,
      {
        id: Date.now(),
        field: defaultField,
        operator: 'contains',
        value: ''
      }
    ]);
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
