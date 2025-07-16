/**
 * useFieldManagement Hook
 * -----------------------
 * Custom React hook for managing field visibility, search, and table layout in the parts table UI.
 *
 * Features:
 * - Manages state for hidden fields, dropdown open state, and field search query
 * - Provides functions to toggle field visibility and generate grid layouts
 * - Filters fields by search query and counts hidden fields
 * - Handles closing the dropdown when clicking outside
 *
 * @fileoverview Custom hook for field visibility and layout management in the main table UI.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { allFields } from '../constants';

/**
 * Custom hook for managing field visibility and table layout
 * @returns {Object} Field management state and functions
 */

export function useFieldManagement() {
  // State for whether the hide fields dropdown is open
  const [hideFieldsDropdownOpen, setHideFieldsDropdownOpen] = useState(false);
  // State for which fields are hidden (object: { [fieldKey]: true })
  const [hiddenFields, setHiddenFields] = useState({});
  // State for the current search query in the field search input
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  /**
   * Toggle the visibility of a field by its key.
   * @param {string} fieldKey - The key of the field to toggle
   */
  const toggleFieldVisibility = useCallback((fieldKey) => {
    if (!fieldKey) {
      console.warn('toggleFieldVisibility called with invalid fieldKey:', fieldKey);
      return;
    }
    setHiddenFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  }, []);

  /**
   * Filter fields based on the current search query (case-insensitive).
   * Memoized for performance.
   */
  const filteredFields = useMemo(() => {
    try {
      const query = fieldSearchQuery?.trim();
      if (!query) {
        return allFields;
      }
      const searchLower = query.toLowerCase();
      return allFields.filter(field => {
        if (!field?.label || typeof field.label !== 'string') {
          return false;
        }
        return field.label.toLowerCase().includes(searchLower);
      });
    } catch (error) {
      console.error('Error filtering fields:', error);
      return allFields; // Fallback to showing all fields
    }
  }, [fieldSearchQuery]);

  /**
   * Count the number of currently hidden fields.
   * Memoized for performance.
   */
  const hiddenFieldCount = useMemo(() => {
    try {
      return Object.values(hiddenFields).filter(Boolean).length;
    } catch (error) {
      console.error('Error counting hidden fields:', error);
      return 0;
    }
  }, [hiddenFields]);

  /**
   * Generate the CSS grid-template-columns string for the main table.
   * Columns are included/excluded based on hiddenFields.
   * @returns {string} CSS grid-template-columns value
   */
  const getMainTableGridColumns = useCallback(() => {
    try {
      const columns = [
        '40px', // Checkbox column
        !hiddenFields.qty ? '80px' : '',
        !hiddenFields.total ? '80px' : '',
        !hiddenFields.inUse ? '80px' : '',
        !hiddenFields.essentialReserve ? '80px' : '',
        !hiddenFields.usableSurplus ? '80px' : '',
        !hiddenFields.inventoryItemNumber ? '1.2fr' : '',
        !hiddenFields.manufacturerPartNumber ? '1.2fr' : '',
        !hiddenFields.manufacturerName ? '1.2fr' : '',
        !hiddenFields.inventoryDescription ? '2fr' : ''
      ].filter(col => col !== '');
      return columns.join(' ');
    } catch (error) {
      console.error('Error generating main table grid columns:', error);
      return '40px 80px 80px 80px 80px 80px 1.2fr 1.2fr 1.2fr 2fr'; // Fallback
    }
  }, [hiddenFields]);

  /**
   * Generate the CSS grid-template-columns string for the instance table.
   * Columns are included/excluded based on hiddenFields.
   * @returns {string} CSS grid-template-columns value
   */
  const getInstanceTableGridColumns = useCallback(() => {
    try {
      const columns = [
        '1fr', // Request/checkbox column
        !hiddenFields.instanceId ? '2fr' : '',
        !hiddenFields.serialNumber ? '2fr' : '',
        !hiddenFields.quantity ? '2fr' : '',
        !hiddenFields.inventoryMaturity ? '1fr' : '',
        !hiddenFields.associatedProject ? '2fr' : '',
        !hiddenFields.hardwareCustodian ? '2fr' : '',
        !hiddenFields.parentPath ? '2fr' : ''
      ].filter(col => col !== '');
      return columns.join(' ');
    } catch (error) {
      console.error('Error generating instance table grid columns:', error);
      return '1fr 2fr 2fr 2fr 1fr 2fr 2fr 2fr'; // Fallback
    }
  }, [hiddenFields]);

  /**
   * Effect: Close the hide fields dropdown when clicking outside of it.
   */
  useEffect(() => {
    if (!hideFieldsDropdownOpen) {
      return; // Early return if dropdown is not open
    }

    const handleClickOutside = (event) => {
      try {
        if (!event?.target) {
          return;
        }
        // Only close if click is outside any .hide-fields-container
        const container = event.target.closest('.hide-fields-container');
        if (!container) {
          setHideFieldsDropdownOpen(false);
        }
      } catch (error) {
        console.error('Error in handleClickOutside:', error);
        // Don't close dropdown on errors to avoid unintended behavior
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideFieldsDropdownOpen]);

  // Return all state, computed values, and functions needed for field management
  return {
    // State
    hideFieldsDropdownOpen,
    setHideFieldsDropdownOpen,
    hiddenFields,
    setHiddenFields,
    fieldSearchQuery,
    setFieldSearchQuery,
    // Computed values
    filteredFields,
    hiddenFieldCount,
    // Functions
    toggleFieldVisibility,
    getMainTableGridColumns,
    getInstanceTableGridColumns,
    // Field definitions
    allFields
  };
}
