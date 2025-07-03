import React from 'react';
import PropTypes from 'prop-types';
import { FilterCondition, FilterGroup } from './FilterComponents';
import { LogicalOperatorSelector } from './LogicalOperatorSelector';

/**
 * UnifiedFilterList component that handles both conditions and groups with a unified left column
 * for WHERE/AND/OR operators
 */
export function UnifiedFilterList({
  filterConditions = [],
  conditionGroups = [],
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
  onRemoveGroup,
  onAddConditionToGroup,
  onRemoveConditionFromGroup,
  onFieldChangeInGroup,
  onOperatorChangeInGroup,
  onValueChangeInGroup,
  setHasUnprocessedChanges
}) {
  // Combine and sort conditions and groups by their positions
  const allFilterItems = [
    ...filterConditions.map(condition => ({ ...condition, type: 'condition' })),
    ...conditionGroups.map(group => ({ ...group, type: 'group' }))
  ].sort((a, b) => a.position - b.position);

  // Check if there are no items
  if (allFilterItems.length === 0) {
    return (
      <div className="filter-dropdown__empty">
        No filter conditions added yet. Click "Add Condition" to start filtering.
      </div>
    );
  }

  return (
    <div className="filter-items-list">
      {allFilterItems.map((item, index) => (
        <div key={item.id} className="filter-item">
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

          {/* Content area based on item type */}
          <div className="filter-item-content">
            {item.type === 'condition' ? (
              <FilterCondition
                condition={item}
                index={filterConditions.findIndex(c => c.id === item.id)}
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
                showLeftColumn={false} // Don't show left column in condition since it's now handled at the unified level
              />
            ) : (
              <FilterGroup
                group={item}
                groupIndex={conditionGroups.findIndex(g => g.id === item.id)}
                groupId={item.id}
                logicalOperator={logicalOperator}
                onRemoveGroup={onRemoveGroup}
                onConditionFieldChange={onFieldChangeInGroup}
                onConditionOperatorChange={onOperatorChangeInGroup}
                onConditionValueChange={onValueChangeInGroup}
                onRemoveCondition={onRemoveConditionFromGroup}
                searchableFields={searchableFields}
                inputValues={inputValues}
                setHasUnprocessedChanges={setHasUnprocessedChanges}
                showLeftColumn={false} // Don't show left column in group since it's now handled at the unified level
                onAddConditionToGroup={onAddConditionToGroup}
                // ...pass other handlers as needed...
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

UnifiedFilterList.propTypes = {
  filterConditions: PropTypes.array.isRequired,
  conditionGroups: PropTypes.array.isRequired,
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
  onRemoveGroup: PropTypes.func.isRequired,
  onAddConditionToGroup: PropTypes.func.isRequired,
  onRemoveConditionFromGroup: PropTypes.func.isRequired,
  onFieldChangeInGroup: PropTypes.func.isRequired,
  onOperatorChangeInGroup: PropTypes.func.isRequired,
  onValueChangeInGroup: PropTypes.func.isRequired,
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
