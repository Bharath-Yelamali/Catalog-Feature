import React from 'react';
import PropTypes from 'prop-types';
import { FilterCondition } from './FilterComponents';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';

/**
 * UnifiedFilterList component for flat filter conditions with a unified left column
 */
export function UnifiedFilterList({
  filterConditions = [],
  logicalOperator = 'and',
  onOperatorChange,
  inputValues = {},
  searchableFields = [],
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
  onDragEnd,
  setHasUnprocessedChanges
}) {
  // Only flat filter conditions
  if (filterConditions.length === 0) {
    return (
      <div className="filter-dropdown__empty">
        No filter conditions added yet. Click "Add Condition" to start filtering.
      </div>
    );
  }

  return (
    <div className="filter-items-list">
      {filterConditions.map((item, index) => (
        <div key={item.id} className="filter-item"
          draggable={true}
          onDragStart={onDragStart ? (e) => onDragStart(e, index) : undefined}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        >
          {/* Left column based on position in the unified list */}
          <div className="filter-left-column">
            <LogicalOperatorSelector 
              index={index}
              logicalOperator={logicalOperator}
              onOperatorChange={onOperatorChange}
              isFirstItem={index === 0}
              showLabel={true}
              textClassName="filter-universal-operator--text"
              dropdownClassName="filter-universal-operator--select"
            />
          </div>

          {/* Content area for flat condition */}
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
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              searchableFields={searchableFields}
              inputValues={inputValues}
              showLeftColumn={false}
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
  inputValues: PropTypes.object,
  searchableFields: PropTypes.array,
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
  onDragEnd: PropTypes.func,
  setHasUnprocessedChanges: PropTypes.func
};

UnifiedFilterList.defaultProps = {
  inputValues: {},
  searchableFields: [],
  draggedCondition: null,
  dragHoverTarget: null,
  onDragStart: () => {},
  onDragOver: () => {},
  onDragEnter: () => {},
  onDragLeave: () => {},
  onDrop: () => {},
  onDragEnd: () => {},
  setHasUnprocessedChanges: () => {}
};
