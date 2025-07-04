import React from 'react';
import PropTypes from 'prop-types';
import { FilterDropdown } from '../../FilterDropdown';

/**
 * FilterButton component for managing filter conditions
 * @param {Object} props - Component props
 * @returns {JSX.Element} Filter button and dropdown
 */
export function FilterButton({
  activeFilterCount,
  filterDropdownOpen,
  setFilterDropdownOpen,
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
  return (
    <div className="filter-container">
      <button
        className={`filter-button ${activeFilterCount > 0 ? 'filter-button--active' : ''}`}
        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
        aria-label="Advanced Search table data"
      >
        <img 
          src="/images/filter.svg" 
          alt="" 
          className="filter-button__icon"
        />
        {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : 'Advanced Search'}
      </button>

      {filterDropdownOpen && (
        <FilterDropdown
          filterConditions={filterConditions}
          setFilterConditions={setFilterConditions}
          inputValues={inputValues}
          setInputValues={setInputValues}
          hasUnprocessedChanges={hasUnprocessedChanges}
          setHasUnprocessedChanges={setHasUnprocessedChanges}
          logicalOperator={logicalOperator}
          setLogicalOperator={setLogicalOperator}
          draggedCondition={draggedCondition}
          dragHoverTarget={dragHoverTarget}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragEnter={handleDragEnter}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          searchableFields={searchableFields}
        />
      )}
    </div>
  );
}

// PropTypes for FilterButton
FilterButton.propTypes = {
  activeFilterCount: PropTypes.number.isRequired,
  filterDropdownOpen: PropTypes.bool.isRequired,
  setFilterDropdownOpen: PropTypes.func.isRequired,
  filterConditions: PropTypes.array.isRequired,
  setFilterConditions: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
  setInputValues: PropTypes.func.isRequired,
  hasUnprocessedChanges: PropTypes.bool.isRequired,
  setHasUnprocessedChanges: PropTypes.func.isRequired,
  logicalOperator: PropTypes.oneOf(['and', 'or']).isRequired,
  setLogicalOperator: PropTypes.func.isRequired,
  draggedCondition: PropTypes.number,
  dragHoverTarget: PropTypes.number,
  handleDragStart: PropTypes.func.isRequired,
  handleDragOver: PropTypes.func.isRequired,
  handleDragEnter: PropTypes.func.isRequired,
  handleDragLeave: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  searchableFields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isMainTable: PropTypes.bool.isRequired
  })).isRequired
};
