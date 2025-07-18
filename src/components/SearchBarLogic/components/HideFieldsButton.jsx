/**
 * HideFieldsButton Component
 * --------------------------
 * Renders a button and dropdown UI for showing/hiding table columns, with search and bulk actions.
 *
 * Features:
 * - Toggle visibility of main and instance fields
 * - Search fields by name
 * - Hide all / Show all fields with one click
 * - Accessible and keyboard-friendly
 *
 * @fileoverview Button and dropdown for managing visible columns in the main table UI.
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import hideIcon from '../../../assets/hide.svg';

/**
 * Hide Fields Button Component
 * Provides UI for showing/hiding table columns with search functionality
 * @param {Object} props - Component props
 * @param {number} props.hiddenFieldCount - Number of currently hidden fields
 * @param {boolean} props.hideFieldsDropdownOpen - Whether dropdown is open
 * @param {Function} props.setHideFieldsDropdownOpen - Function to toggle dropdown
 * @param {Array} props.filteredFields - Filtered field list based on search
 * @param {Object} props.hiddenFields - Object mapping field keys to hidden state
 * @param {Function} props.toggleFieldVisibility - Function to toggle field visibility
 * @param {string} props.fieldSearchQuery - Current search query for fields
 * @param {Function} props.setFieldSearchQuery - Function to update search query
 * @param {Function} props.setHiddenFields - Function to set hidden fields state
 * @param {Array} props.allFields - Complete list of available fields
 * @returns {JSX.Element} Hide fields button and dropdown
 */

export function HideFieldsButton({ 
  hiddenFieldCount = 0, 
  hideFieldsDropdownOpen = false, 
  setHideFieldsDropdownOpen,
  filteredFields = [],
  hiddenFields = {},
  toggleFieldVisibility,
  fieldSearchQuery = '',
  setFieldSearchQuery,
  setHiddenFields,
  allFields = []
}) {
  // Validate required props
  if (!setHideFieldsDropdownOpen || !toggleFieldVisibility || !setFieldSearchQuery || !setHiddenFields) {
    console.error('HideFieldsButton: Missing required props');
    return null;
  }


  /**
   * Hide all fields by setting all field keys to true in hiddenFields.
   */
  const handleHideAll = useCallback(() => {
    try {
      const newHiddenFields = {};
      allFields.forEach(field => {
        if (field?.key) {
          newHiddenFields[field.key] = true;
        }
      });
      setHiddenFields(newHiddenFields);
    } catch (error) {
      console.error('Error hiding all fields:', error);
    }
  }, [allFields, setHiddenFields]);


  /**
   * Show all fields by clearing the hiddenFields object.
   */
  const handleShowAll = useCallback(() => {
    try {
      setHiddenFields({});
    } catch (error) {
      console.error('Error showing all fields:', error);
    }
  }, [setHiddenFields]);


  /**
   * Update the field search query as the user types.
   */
  const handleSearchChange = useCallback((e) => {
    try {
      const value = e.target?.value || '';
      setFieldSearchQuery(value);
    } catch (error) {
      console.error('Error updating field search query:', error);
    }
  }, [setFieldSearchQuery]);


  // Separate fields into main table and instance detail fields
  const mainTableFields = filteredFields.filter(field => field?.isMainTable === true);
  const instanceDetailFields = filteredFields.filter(field => field?.isMainTable === false);

  return (
    <div className="hide-fields-container">
      {/* Button to open/close the hide fields dropdown */}
      <button
        className={`hide-fields-button ${hiddenFieldCount > 0 ? 'active' : ''}`}
        onClick={() => setHideFieldsDropdownOpen(!hideFieldsDropdownOpen)}
        aria-label="Hide or show table fields"
        aria-expanded={hideFieldsDropdownOpen}
        aria-haspopup="true"
      >
        <img 
          src={hideIcon} 
          alt="" 
          className="hide-fields-button-icon"
        />
        {hiddenFieldCount > 0 
          ? `${hiddenFieldCount} hidden field${hiddenFieldCount === 1 ? '' : 's'}` 
          : 'Hide Fields'
        }
      </button>

      {/* Dropdown for managing field visibility */}
      {hideFieldsDropdownOpen && (
        <div className="hide-fields-dropdown" role="menu">
          {/* Search input for filtering fields */}
          <div className="hide-fields-search-section">
            <input
              type="text"
              placeholder="Search fields..."
              value={fieldSearchQuery}
              onChange={handleSearchChange}
              className="hide-fields-search-input"
              aria-label="Search fields"
            />
          </div>
          {/* Field list (main table and instance detail) */}
          <div className="hide-fields-list">
            {/* Main Table Fields */}
            {mainTableFields.length > 0 && (
              <div className="hide-fields-section">
                <div className="hide-fields-section-title">
                  Main Table Fields
                </div>
                {mainTableFields.map(field => (
                  field?.key ? (
                    <label key={field.key} className="hide-fields-checkbox-item">
                      <input
                        type="checkbox"
                        checked={!hiddenFields[field.key]}
                        onChange={() => toggleFieldVisibility(field.key)}
                        className="hide-fields-checkbox"
                        aria-label={`Toggle ${field.label} field visibility`}
                      />
                      {field.label}
                    </label>
                  ) : null
                ))}
              </div>
            )}
            {/* Instance Detail Fields */}
            {instanceDetailFields.length > 0 && (
              <div className="hide-fields-section">
                <div className="hide-fields-section-title">
                  Instance Detail Fields
                </div>
                {instanceDetailFields.map(field => (
                  field?.key ? (
                    <label key={field.key} className="hide-fields-checkbox-item">
                      <input
                        type="checkbox"
                        checked={!hiddenFields[field.key]}
                        onChange={() => toggleFieldVisibility(field.key)}
                        className="hide-fields-checkbox"
                        aria-label={`Toggle ${field.label} field visibility`}
                      />
                      {field.label}
                    </label>
                  ) : null
                ))}
              </div>
            )}
            {/* No results message if search yields nothing */}
            {filteredFields.length === 0 && fieldSearchQuery.trim() && (
              <div className="hide-fields-no-results">
                No fields match "{fieldSearchQuery}"
              </div>
            )}
          </div>
          {/* Action buttons for hide all / show all */}
          <div className="hide-fields-actions">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleHideAll();
              }}
              type="button"
              className="hide-fields-action-btn hide-all"
              aria-label="Hide all fields"
            >
              Hide All
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShowAll();
              }}
              type="button"
              className="hide-fields-action-btn show-all"
              aria-label="Show all fields"
            >
              Show All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// PropTypes for HideFieldsButton
HideFieldsButton.propTypes = {
  hiddenFieldCount: PropTypes.number,
  hideFieldsDropdownOpen: PropTypes.bool,
  setHideFieldsDropdownOpen: PropTypes.func.isRequired,
  filteredFields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isMainTable: PropTypes.bool.isRequired
  })),
  hiddenFields: PropTypes.object,
  toggleFieldVisibility: PropTypes.func.isRequired,
  fieldSearchQuery: PropTypes.string,
  setFieldSearchQuery: PropTypes.func.isRequired,
  setHiddenFields: PropTypes.func.isRequired,
  allFields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isMainTable: PropTypes.bool.isRequired
  }))
};

// Default props for HideFieldsButton
HideFieldsButton.defaultProps = {
  hiddenFieldCount: 0,
  hideFieldsDropdownOpen: false,
  filteredFields: [],
  hiddenFields: {},
  fieldSearchQuery: '',
  allFields: []
};
