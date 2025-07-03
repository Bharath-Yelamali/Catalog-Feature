import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDragAndDrop } from '../../../hooks/useDragAndDrop';
import { DEBOUNCE_DELAY_MS, searchableFields } from '../constants';

/**
 * Custom hook for managing filter functionality
 * @param {Array} results - Array of search results to filter
 * @param {Function} onFilterSearch - Callback function for API filter searches
 * @returns {Object} Filter management state and functions
 */
export function useFilterManagement(results = [], onFilterSearch) {
  // Validate inputs
  if (!Array.isArray(results)) {
    console.warn('useFilterManagement: results is not an array, defaulting to empty array');
    results = [];
  }
  
  if (onFilterSearch && typeof onFilterSearch !== 'function') {
    console.warn('useFilterManagement: onFilterSearch is not a function');
    onFilterSearch = null;
  }
  // State for filter functionality
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterConditions, setFilterConditions] = useState([]); // Array of condition objects
  const [conditionGroups, setConditionGroups] = useState([]); // Array of condition group objects
  const [filteredResults, setFilteredResults] = useState(results); // Filtered results for display
  const [inputValues, setInputValues] = useState({}); // Local state for input values to enable debouncing
  const [hasUnprocessedChanges, setHasUnprocessedChanges] = useState(false); // Track if user has made changes that haven't been processed
  const [logicalOperator, setLogicalOperator] = useState('and'); // Logical operator for multiple conditions
  const [draggedCondition, setDraggedCondition] = useState(null); // Track which condition is being dragged
  const [dragHoverTarget, setDragHoverTarget] = useState(null); // Track which condition is being hovered over during drag

  // Debouncing refs for API calls
  const debounceTimeoutRef = useRef(null);

  // Count active filter conditions - memoized for performance
  const activeFilterCount = useMemo(() => {
    try {
      if (!Array.isArray(filterConditions)) {
        return 0;
      }
      
      return filterConditions.filter(condition => {
        if (!condition || typeof condition !== 'object') {
          return false;
        }
        
        return condition.field && 
               condition.operator && 
               condition.value?.trim() !== '';
      }).length;
    } catch (error) {
      console.error('Error counting active filters:', error);
      return 0;
    }
  }, [filterConditions]);

  /**
   * Helper function to safely check if a value matches a filter condition
   * @param {*} fieldValue - The field value to test
   * @param {string} operator - The comparison operator
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
   * Filter function that applies all conditions to results (client-side fallback only)
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
   * Convert filter conditions to search chips format for API
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
   * Trigger API search when filter conditions are complete and have changed
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

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterDropdownOpen) {
      return; // Early return if dropdown is not open
    }

    const handleClickOutside = (event) => {
      try {
        if (!event?.target) {
          return;
        }
        
        const container = event.target.closest('.filter-container');
        if (!container) {
          setFilterDropdownOpen(false);
        }
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

  // Update input values when filter conditions change (for initial loading only)
  useEffect(() => {
    try {
      if (!Array.isArray(filterConditions)) {
        return;
      }
      
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

  // Apply filters when conditions change (only for complete conditions)
  useEffect(() => {
    // Only trigger search if we have unprocessed changes
    if (!hasUnprocessedChanges) {
      return;
    }

    // Clear the debounce timeout if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new debounce timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Validate filter conditions array
        if (!Array.isArray(filterConditions)) {
          console.warn('Filter conditions is not an array');
          setHasUnprocessedChanges(false);
          return;
        }
        
        // Check if we have at least one complete condition
        const hasCompleteCondition = filterConditions.some(condition => {
          if (!condition || typeof condition !== 'object') {
            return false;
          }
          return condition.field && condition.operator && condition.value?.trim() !== '';
        });
        
        if (hasCompleteCondition) {
          console.log('Triggering debounced filter search');
          await triggerFilterSearch(filterConditions);
        } else {
          // When no conditions OR all conditions are incomplete OR conditions array is empty
          // We need to trigger the original search to get back unfiltered results
          console.log('Clearing filters - triggering original search to get unfiltered results');
          if (onFilterSearch) {
            try {
              // Pass empty array to trigger original search behavior in App.jsx
              await onFilterSearch([]);
            } catch (error) {
              if (error.name !== 'AbortError') {
                console.error('Failed to clear filters:', error);
                // Fallback to local reset if API call fails
                setFilteredResults(results);
              }
            }
          } else {
            // No API handler, just reset locally
            setFilteredResults(results);
          }
        }
        
        // Mark changes as processed regardless of success/failure
        setHasUnprocessedChanges(false);
      } catch (error) {
        console.error('Error in filter conditions effect:', error);
        setHasUnprocessedChanges(false);
      }
    }, DEBOUNCE_DELAY_MS);
  }, [filterConditions, hasUnprocessedChanges, triggerFilterSearch, onFilterSearch, results, setFilteredResults]);

  // Update filtered results when base results change
  useEffect(() => {
    try {
      if (Array.isArray(results)) {
        setFilteredResults(results);
      } else {
        console.warn('Results is not an array, setting empty array');
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('Error updating filtered results:', error);
      setFilteredResults([]);
    }
  }, [results]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Use drag and drop hook
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

  return {
    // State
    filterDropdownOpen,
    setFilterDropdownOpen,
    filterConditions,
    setFilterConditions,
    conditionGroups,
    setConditionGroups,
    filteredResults,
    setFilteredResults,
    inputValues,
    setInputValues,
    hasUnprocessedChanges,
    setHasUnprocessedChanges,
    logicalOperator,
    setLogicalOperator,
    draggedCondition,
    setDraggedCondition,
    dragHoverTarget,
    setDragHoverTarget,
    
    // Computed values
    activeFilterCount,
    
    // Filter logic functions
    applyFilters,
    matchesCondition,
    convertFilterConditionsToChips,
    triggerFilterSearch,
    
    // Drag handlers
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    
    // Field definitions
    searchableFields
  };
}
