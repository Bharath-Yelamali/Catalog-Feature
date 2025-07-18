
/**
 * @file useFilterManagement.js
 * @description
 *   Custom React hook for managing advanced filter logic, state, and drag-and-drop functionality
 *   for a search/filter UI. Handles both client-side and API-driven filtering, debounced updates,
 *   logical operators, and integrates with a drag-and-drop hook for reordering filter conditions.
 *
 *   Exposes all relevant state, handlers, and utility functions for use in filter UIs.
 *
 * @author Bharath Yelamali
 * @date 2025-07-16
 *
 * @exports useFilterManagement
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDragAndDrop } from '../../../hooks/useDragAndDrop';
import { DEBOUNCE_DELAY_MS, searchableFields } from '../constants';

/**
 * Custom hook for managing filter functionality, state, and drag-and-drop for a search/filter UI.
 * Handles both client-side and API-driven filtering, debounced updates, and logical operators.
 *
 * @param {Array} results - Array of search results to filter (raw data)
 * @param {Function} onFilterSearch - Optional callback for API filter searches (chips format)
 * @returns {Object} Filter management state, handlers, and utility functions
 */
export function useFilterManagement(results = [], onFilterSearch) {
  // --- Input validation ---
  if (!Array.isArray(results)) {
    // Defensive: ensure results is always an array
    console.warn('useFilterManagement: results is not an array, defaulting to empty array');
    results = [];
  }
  if (onFilterSearch && typeof onFilterSearch !== 'function') {
    // Defensive: ensure onFilterSearch is a function if provided
    console.warn('useFilterManagement: onFilterSearch is not a function');
    onFilterSearch = null;
  }
  // --- State for filter UI and logic ---
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false); // Is the filter dropdown open?
  const [filterConditions, setFilterConditions] = useState([]); // Array of filter condition objects
  const [conditionGroups, setConditionGroups] = useState([]); // Array of filter condition group objects (for advanced grouping)
  const [filteredResults, setFilteredResults] = useState(results); // Results after filtering (displayed)
  const [inputValues, setInputValues] = useState({}); // Input values for each filter row (for debouncing)
  const [hasUnprocessedChanges, setHasUnprocessedChanges] = useState(false); // Tracks if user has made changes that need to be processed
  const [logicalOperator, setLogicalOperator] = useState('and'); // Logical operator for combining conditions ('and'/'or')
  const [draggedCondition, setDraggedCondition] = useState(null); // Currently dragged filter condition (for DnD)
  const [dragHoverTarget, setDragHoverTarget] = useState(null); // Condition currently hovered during drag

  // Ref for debouncing filter API calls
  const debounceTimeoutRef = useRef(null);

  /**
   * Memoized count of active (complete) filter conditions.
   * Used for UI badges, etc.
   */
  const activeFilterCount = useMemo(() => {
    try {
      if (!Array.isArray(filterConditions)) return 0;
      // Only count conditions with all required fields
      return filterConditions.filter(condition => {
        if (!condition || typeof condition !== 'object') return false;
        return condition.field && condition.operator && condition.value?.trim() !== '';
      }).length;
    } catch (error) {
      console.error('Error counting active filters:', error);
      return 0;
    }
  }, [filterConditions]);

  /**
   * Helper function to check if a value matches a filter condition.
   * Handles all supported operators and null/undefined values safely.
   *
   * @param {*} fieldValue - The field value to test
   * @param {string} operator - The comparison operator (e.g. 'contains', 'is')
   * @param {string} searchValue - The value to search for
   * @returns {boolean} Whether the condition matches
   */
  const matchesCondition = useCallback((fieldValue, operator, searchValue) => {
    try {
      if (!operator || searchValue === null || searchValue === undefined) {
        return true;
      }

      const field = String(fieldValue || '').toLowerCase();
      const search = String(searchValue || '').toLowerCase();

      switch (operator) {
        case 'contains':
          return field.includes(search);
        case 'does not contain':
          return !field.includes(search);
        case 'is':
          return field === search;
        case 'is not':
          return field !== search;
        default:
          console.warn(`Unknown operator: ${operator}`);
          return true;
      }
    } catch (error) {
      console.error('Error in matchesCondition:', error);
      return true; // Fail safely by including the item
    }
  }, []);

  /**
   * Client-side filter function: applies all filter conditions to the results array.
   * Used as a fallback if no API handler is provided.
   *
   * @param {Array} conditions - Array of filter conditions
   * @param {Array} data - Array of data to filter
   * @returns {Array} Filtered data array
   */
  const applyFilters = useCallback((conditions, data) => {
    try {
      // Input validation
      if (!Array.isArray(conditions) || !Array.isArray(data)) {
        console.warn('applyFilters: Invalid input types');
        return data || [];
      }
      
      if (conditions.length === 0) {
        return data;
      }

      const filtered = data.filter(group => {
        try {
          // Validate group structure
          if (!group || typeof group !== 'object') {
            return false;
          }
          
          if (!Array.isArray(group.instances) || group.instances.length === 0) {
            return false;
          }

          const part = group.instances[0];
          if (!part || typeof part !== 'object') {
            return false;
          }
          
          const matchesAllConditions = conditions.every(condition => {
            try {
              // Validate condition structure
              if (!condition || typeof condition !== 'object') {
                return true; // Skip invalid conditions
              }
              
              if (!condition.field || !condition.operator || !condition.value) {
                return true; // Skip incomplete conditions
              }

              let fieldValue = '';
              let matches = false;
              
              // Map field keys to actual data values with safe property access
              switch (condition.field) {
                case 'inventoryItemNumber':
                  fieldValue = part.m_inventory_item?.item_number || '';
                  matches = matchesCondition(fieldValue, condition.operator, condition.value);
                  break;
                case 'manufacturerPartNumber':
                  fieldValue = part.m_mfg_part_number || '';
                  matches = matchesCondition(fieldValue, condition.operator, condition.value);
                  break;
                case 'manufacturerName':
                  fieldValue = part.m_mfg_name || '';
                  matches = matchesCondition(fieldValue, condition.operator, condition.value);
                  break;
                case 'inventoryDescription':
                  fieldValue = part.m_inventory_description || part.m_description || '';
                  matches = matchesCondition(fieldValue, condition.operator, condition.value);
                  break;
                case 'instanceId':
                  // For instance fields, check all instances in the group safely
                  matches = group.instances.some(instance => {
                    if (!instance || typeof instance !== 'object') {
                      return false;
                    }
                    const instValue = instance.m_id || '';
                    return matchesCondition(instValue, condition.operator, condition.value);
                  });
                  break;
                case 'associatedProject':
                  matches = group.instances.some(instance => {
                    if (!instance || typeof instance !== 'object') {
                      return false;
                    }
                    const instValue = instance.m_project?.keyed_name || instance.associated_project || '';
                    return matchesCondition(instValue, condition.operator, condition.value);
                  });
                  break;
                case 'hardwareCustodian':
                  matches = group.instances.some(instance => {
                    if (!instance || typeof instance !== 'object') {
                      return false;
                    }
                    const instValue = instance["m_custodian@aras.keyed_name"] || instance.m_custodian || '';
                    return matchesCondition(instValue, condition.operator, condition.value);
                  });
                  break;
                case 'parentPath':
                  matches = group.instances.some(instance => {
                    if (!instance || typeof instance !== 'object') {
                      return false;
                    }
                    const instValue = instance.m_parent_ref_path || '';
                    return matchesCondition(instValue, condition.operator, condition.value);
                  });
                  break;
                default:
                  console.warn(`Unknown field for filtering: ${condition.field}`);
                  matches = true;
              }

              return matches;
            } catch (error) {
              console.error('Error processing filter condition:', error, condition);
              return true; // Fail safely by including the item
            }
          });

          return matchesAllConditions;
        } catch (error) {
          console.error('Error filtering group:', error, group);
          return false; // Exclude malformed groups
        }
      });

      return filtered;
    } catch (error) {
      console.error('Error in applyFilters:', error);
      return data || []; // Fail safely by returning original data
    }
  }, [matchesCondition]);

  /**
   * Converts filter conditions to the "chips" format expected by the API.
   * Maps UI field keys to API field names and includes the logical operator.
   *
   * @param {Array} conditions - Array of filter conditions
   * @returns {Object} Formatted conditions for API consumption
   */
  const convertFilterConditionsToChips = useCallback((conditions) => {
    try {
      if (!Array.isArray(conditions)) {
        console.warn('convertFilterConditionsToChips: conditions is not an array');
        return { logicalOperator: 'and', conditions: [] };
      }

      // Map field keys to API field names
      const fieldMapping = {
        'inventoryItemNumber': 'm_inventory_item',
        'manufacturerPartNumber': 'm_mfg_part_number',
        'manufacturerName': 'm_mfg_name',
        'inventoryDescription': 'm_inventory_description',
        'instanceId': 'm_id',
        'associatedProject': 'item_number',
        'hardwareCustodian': 'm_custodian@aras.keyed_name',
        'parentPath': 'm_parent_ref_path'
      };

      const filteredConditions = conditions
        .filter(condition => {
          if (!condition) return false;
          return condition.field && condition.operator && condition.value?.trim() !== '';
        })
        .map(condition => {
          try {
            const mappedField = fieldMapping[condition.field] || condition.field;
            
            return {
              field: mappedField,
              value: {
                operator: condition.operator,
                value: condition.value.trim()
              }
            };
          } catch (error) {
            console.error('Error mapping condition:', error, condition);
            return null;
          }
        })
        .filter(Boolean); // Remove any null results

      // Create the filter chips with the current logical operator
      const result = {
        logicalOperator: logicalOperator || 'and',
        conditions: filteredConditions
      };
      
      console.log('Created filter chips with logicalOperator:', result.logicalOperator);
      return result;
    } catch (error) {
      console.error('Error in convertFilterConditionsToChips:', error);
      return { logicalOperator: 'and', conditions: [] };
    }
  }, [logicalOperator]);

  /**
   * Triggers a filter search (API or client-side) when filter conditions are complete and have changed.
   * Handles fallback to client-side filtering if no API handler is provided.
   *
   * @param {Array} conditions - Array of filter conditions
   */
  const triggerFilterSearch = useCallback(async (conditions) => {
    try {
      if (!onFilterSearch) {
        // Fallback to client-side filtering if no API handler provided
        const filtered = applyFilters(conditions, results);
        setFilteredResults(filtered);
        return;
      }

      // Convert conditions to search chips format
      const chips = convertFilterConditionsToChips(conditions);
      
      if (!chips.conditions || chips.conditions.length === 0) {
        // No valid filter conditions - reset to original results
        setFilteredResults(results);
        return;
      }

      // Trigger API search with filter conditions
      console.log('Triggering filter search with conditions:', chips);
      await onFilterSearch(chips);
    } catch (error) {
      // Ignore AbortError as it's expected when searches are cancelled
      if (error.name === 'AbortError') {
        console.log('Filter search was cancelled (this is normal)');
        return;
      }
      
      console.error('Filter search failed:', error);
      
      // On error, fallback to client-side filtering
      try {
        const filtered = applyFilters(conditions, results);
        setFilteredResults(filtered);
      } catch (fallbackError) {
        console.error('Fallback filtering also failed:', fallbackError);
        setFilteredResults(results); // Last resort: show original results
      }
    }
  }, [onFilterSearch, convertFilterConditionsToChips, applyFilters, results, setFilteredResults]);

  /**
   * Applies global search conditions by replacing all existing global search fields with the new OR'ed conditions.
   * Ensures only one set of global search conditions is present, sets logicalOperator to 'or',
   * and triggers the search by setting hasUnprocessedChanges.
   *
   * @param {Array} newGlobalConditions - Array of new global search filter conditions
   */
  const applyGlobalSearchConditions = useCallback((newGlobalConditions) => {
    if (!Array.isArray(newGlobalConditions)) {
      console.warn('applyGlobalSearchConditions: newGlobalConditions is not an array');
      return;
    }
    // Remove any existing global search conditions (fields in searchableFields)
    const globalFields = searchableFields.map(f => f.key);
    const nonGlobalConditions = filterConditions.filter(
      cond => cond && !globalFields.includes(cond.field)
    );
    // Add new global search conditions (OR'ed)
    setFilterConditions([...nonGlobalConditions, ...newGlobalConditions]);
    setLogicalOperator('or');
    setHasUnprocessedChanges(true);
  }, [filterConditions, searchableFields]);

  // --- Effect: Close filter dropdown when clicking outside ---
  useEffect(() => {
    if (!filterDropdownOpen) return;
    /**
     * Handler to close dropdown if click is outside filter container.
     */
    const handleClickOutside = (event) => {
      try {
        if (!event?.target) return;
        const container = event.target.closest('.filter-container');
        if (!container) setFilterDropdownOpen(false);
      } catch (error) {
        console.error('Error in filter dropdown handleClickOutside:', error);
        // Don't close dropdown on errors to avoid unintended behavior
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterDropdownOpen]);

  // --- Effect: Update input values when filter conditions change (for initial loading only) ---
  useEffect(() => {
    try {
      if (!Array.isArray(filterConditions)) return;
      // Build new input values object for each filter row
      const newInputValues = {};
      filterConditions.forEach((condition, index) => {
        if (condition && typeof condition === 'object') {
          newInputValues[index] = condition.value || '';
        }
      });
      setInputValues(newInputValues);
    } catch (error) {
      console.error('Error updating input values:', error);
    }
  }, [filterConditions.length]); // Only react to array length changes, not value changes

  // --- Effect: Debounced filter search when filter conditions change ---
  useEffect(() => {
    if (!hasUnprocessedChanges) return;
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Debounce filter search to avoid excessive API calls
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (!Array.isArray(filterConditions)) {
          console.warn('Filter conditions is not an array');
          setHasUnprocessedChanges(false);
          return;
        }
        // Only use complete conditions for searching
        const completeConditions = filterConditions.filter(condition =>
          condition && typeof condition === 'object' &&
          condition.field && condition.operator && condition.value?.trim() !== ''
        );
        if (completeConditions.length > 0) {
          // Trigger search with complete conditions
          console.log('Triggering debounced filter search');
          await triggerFilterSearch(completeConditions);
        } else {
          // No valid conditions: reset to original results
          console.log('Clearing filters - triggering original search to get unfiltered results');
          if (onFilterSearch) {
            try {
              await onFilterSearch([]);
            } catch (error) {
              if (error.name !== 'AbortError') {
                console.error('Failed to clear filters:', error);
                setFilteredResults(results);
              }
            }
          } else {
            setFilteredResults(results);
          }
        }
        setHasUnprocessedChanges(false);
      } catch (error) {
        console.error('Error in filter conditions effect:', error);
        setHasUnprocessedChanges(false);
      }
    }, DEBOUNCE_DELAY_MS);
  }, [filterConditions, hasUnprocessedChanges, triggerFilterSearch, onFilterSearch, results, setFilteredResults]);

  // --- Effect: Update filtered results when base results change ---
  useEffect(() => {
    try {
      if (Array.isArray(results)) {
        setFilteredResults(results);
      } else {
        // Defensive: always set to array
        console.warn('Results is not an array, setting empty array');
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('Error updating filtered results:', error);
      setFilteredResults([]);
    }
  }, [results]);

  // --- Effect: Cleanup debounce timeout on unmount ---
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // --- Integrate drag-and-drop handlers for filter conditions ---
  // These handlers are provided by a custom useDragAndDrop hook and allow reordering of filter rows.
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(
    filterConditions,
    setFilterConditions,
    conditionGroups,
    setConditionGroups,
    inputValues,
    setInputValues,
    setHasUnprocessedChanges,
    draggedCondition,
    setDraggedCondition,
    dragHoverTarget,
    setDragHoverTarget
  );

  // --- Expose all state, handlers, and helpers for use in filter UIs ---
  return {
    // --- State ---
    filterDropdownOpen,      // Is the filter dropdown open?
    setFilterDropdownOpen,   // Setter for dropdown open state
    filterConditions,        // Array of filter condition objects
    setFilterConditions,     // Setter for filter conditions
    conditionGroups,         // Array of filter condition group objects
    setConditionGroups,      // Setter for condition groups
    filteredResults,         // Results after filtering (displayed)
    setFilteredResults,      // Setter for filtered results
    inputValues,             // Input values for each filter row
    setInputValues,          // Setter for input values
    hasUnprocessedChanges,   // Tracks if user has made changes that need to be processed
    setHasUnprocessedChanges,// Setter for unprocessed changes
    logicalOperator,         // Logical operator for combining conditions ('and'/'or')
    setLogicalOperator,      // Setter for logical operator
    draggedCondition,        // Currently dragged filter condition (for DnD)
    setDraggedCondition,     // Setter for dragged condition
    dragHoverTarget,         // Condition currently hovered during drag
    setDragHoverTarget,      // Setter for drag hover target

    // --- Computed values ---
    activeFilterCount,       // Number of active (complete) filter conditions

    // --- Filter logic functions ---
    applyFilters,                    // Client-side filter function
    matchesCondition,                // Helper for matching a value to a filter condition
    convertFilterConditionsToChips,  // Convert UI conditions to API chips format
    triggerFilterSearch,             // Triggers filter search (API or client-side)
    applyGlobalSearchConditions,     // Applies global search conditions (OR'ed)

    // --- Drag-and-drop handlers ---
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,

    // --- Field definitions ---
    searchableFields                 // List of fields available for global search
  };
}
