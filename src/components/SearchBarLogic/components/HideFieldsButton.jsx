import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

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

  const handleHideAll = useCallback(() => {
    try {
      console.log('Hide All clicked');
      console.log('allFields:', allFields);
      const newHiddenFields = {};
      allFields.forEach(field => {
        if (field?.key) {
          newHiddenFields[field.key] = true;
        }
      });
      console.log('Setting hiddenFields to:', newHiddenFields);
      setHiddenFields(newHiddenFields);
      console.log('Hidden fields set');
    } catch (error) {
      console.error('Error hiding all fields:', error);
    }
  }, [allFields, setHiddenFields]);

  const handleShowAll = useCallback(() => {
    try {
      console.log('Show All clicked');
      setHiddenFields({});
      console.log('Hidden fields cleared');
    } catch (error) {
      console.error('Error showing all fields:', error);
    }
  }, [setHiddenFields]);

  const handleSearchChange = useCallback((e) => {
    try {
      const value = e.target?.value || '';
      setFieldSearchQuery(value);
    } catch (error) {
      console.error('Error updating field search query:', error);
    }
  }, [setFieldSearchQuery]);

  const mainTableFields = filteredFields.filter(field => field?.isMainTable === true);
  
  const instanceDetailFields = filteredFields.filter(field => field?.isMainTable === false);

  return (
    <div className="hide-fields-container">
      <button
        className={`hide-fields-button ${hiddenFieldCount > 0 ? 'active' : ''}`}
        onClick={() => setHideFieldsDropdownOpen(!hideFieldsDropdownOpen)}
        aria-label="Hide or show table fields"
        aria-expanded={hideFieldsDropdownOpen}
        aria-haspopup="true"
      >
        <img 
          src="/images/hide.svg" 
          alt="" 
          className="hide-fields-button-icon"
        />
        {hiddenFieldCount > 0 
          ? `${hiddenFieldCount} hidden field${hiddenFieldCount === 1 ? '' : 's'}` 
          : 'Hide Fields'
        }
      </button>

      {hideFieldsDropdownOpen && (
        <div className="hide-fields-dropdown" role="menu">
          {/* Search input */}
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
          
          {/* Field list */}
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

            {/* No results message */}
            {filteredFields.length === 0 && fieldSearchQuery.trim() && (
              <div className="hide-fields-no-results">
                No fields match "{fieldSearchQuery}"
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="hide-fields-actions">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hide All button clicked');
                console.log('setHiddenFields function:', setHiddenFields);
                console.log('allFields:', allFields);
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
                console.log('Show All button clicked');
                console.log('setHiddenFields function:', setHiddenFields);
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
