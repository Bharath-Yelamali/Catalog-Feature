/**
 * UnifiedFilterList.jsx
 *
 * Renders a flat, reorderable list of filter conditions for a search/filter UI.
 * Each filter condition is displayed with a unified left column for logical operators (AND/OR),
 * and supports drag-and-drop reordering. This component is designed for flat (non-nested) filter structures.
 *
 * Usage:
 *   - Used in filter dropdowns or advanced search UIs to allow users to build and manage multiple filter conditions.
 *   - Integrates with drag-and-drop for reordering, and exposes handlers for all filter and DnD events.
 *
 * Props:
 *   @param {Array} filterConditions - Array of filter condition objects to display.
 *   @param {string} logicalOperator - The logical operator ('and'/'or') applied between conditions.
 *   @param {function} onOperatorChange - Handler for changing the logical operator.
 *   @param {object} inputValues - Current values for filter fields.
 *   @param {Array} searchableFields - List of fields that can be filtered.
 *   @param {number|null} draggedCondition - Index of the currently dragged condition (for DnD state).
 *   @param {number|null} dragHoverTarget - Index of the current drag hover target (for DnD state).
 *   @param {function} onFieldChange - Handler for changing the filter field.
 *   @param {function} onValueChange - Handler for changing the filter value.
 *   @param {function} onRemoveCondition - Handler for removing a filter condition.
 *   @param {function} onDragStart - Handler for drag start event.
 *   @param {function} onDragOver - Handler for drag over event.
 *   @param {function} onDragEnter - Handler for drag enter event.
 *   @param {function} onDragLeave - Handler for drag leave event.
 *   @param {function} onDrop - Handler for drop event.
 *   @param {function} onDragEnd - Handler for drag end event.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { FilterCondition } from './FilterComponents';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';

/**
 * UnifiedFilterList component for flat filter conditions with a unified left column
 */
export function UnifiedFilterList({
  filterConditions,
  logicalOperator,
  onOperatorChange,
  inputValues,
  searchableFields,
  draggedCondition,
  dragHoverTarget,
  onFieldChange,
  onValueChange,
  onRemoveCondition,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd
}) {

  // If there are no filter conditions, show an empty state message.
  if (filterConditions.length === 0) {
    return (
      <div className="filter-dropdown__empty">
        No filter conditions added yet. Click "Add Condition" to start filtering.
      </div>
    );
  }

  // Render the list of filter conditions
  return (
    <div className="filter-items-list">
      {/* Map over each filter condition and render its row */}
      {filterConditions.map((item, index) => (
        <div
          key={item.id}
          className="filter-item"
          draggable={true}
          // Drag-and-drop event handlers for reordering filter conditions
          onDragStart={onDragStart ? (e) => onDragStart(e, index) : undefined}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        >
          {/* Left column: Logical operator selector (AND/OR) for this row */}
          <div className="filter-left-column">
            <LogicalOperatorSelector
              index={index}
              logicalOperator={logicalOperator}
              onOperatorChange={onOperatorChange}
              isFirstItem={index === 0} // Hide operator for the first item
              showLabel={true}
              textClassName="filter-universal-operator--text"
              dropdownClassName="filter-universal-operator--select"
            />
          </div>

          {/* Main content: The filter condition fields and controls */}
          <div className="filter-item-content">
            <FilterCondition
              condition={item}
              index={index}
              logicalOperator={logicalOperator}
              draggedCondition={draggedCondition}
              dragHoverTarget={dragHoverTarget}
              onFieldChange={onFieldChange}
              onOperatorChange={onOperatorChange}
              onValueChange={onValueChange}
              onRemove={onRemoveCondition}
              // Pass through all drag-and-drop handlers for nested drag support
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              searchableFields={searchableFields}
              inputValues={inputValues}
              showLeftColumn={false} // Left column is handled by parent
            />
          </div>
        </div>
      ))}
    </div>
  );
}

UnifiedFilterList.propTypes = {
  filterConditions: PropTypes.array.isRequired,
  logicalOperator: PropTypes.string.isRequired,
  onOperatorChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
  searchableFields: PropTypes.array.isRequired,
  draggedCondition: PropTypes.number,
  dragHoverTarget: PropTypes.number,
  onFieldChange: PropTypes.func.isRequired,
  onValueChange: PropTypes.func.isRequired,
  onRemoveCondition: PropTypes.func.isRequired,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragEnter: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDrop: PropTypes.func,
  onDragEnd: PropTypes.func
};
