import React, { useState, useEffect, useCallback, useRef } from 'react';
import { updateSpareValue } from '../api/parts';
import { executeSearch, processSearchResults } from '../controllers/searchController';
import { buildSearchParams } from '../utils/searchUtils';

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '', setPage, isAdmin, accessToken, requestPopup, setRequestPopup, onFilterSearch }) {
  const [expandedValue, setExpandedValue] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState('');
  // Remove old selected/quantity logic for flat parts
  // Add expand/collapse state for each itemNumber
  const [expandedRows, setExpandedRows] = useState({});
  // State for select all checkbox
  const [selectAll, setSelectAll] = useState(false);
  // State for filtering instances by General Inventory per group
  const [generalInventoryFilter, setGeneralInventoryFilter] = useState({});
  // Spare threshold feedback state
  const [spareFeedback, setSpareFeedback] = useState({}); // { [instanceId]: 'success' | 'error' | null }
  // Add state to track requested instances
  const [requestedInstances, setRequestedInstances] = useState({}); // { [instanceId]: true/false }
  // State for filtering instances by associated project
  const [projectFilter, setProjectFilter] = useState({}); // { [itemNumber]: projectName }
  // Add state for open project dropdown
  const [openProjectDropdown, setOpenProjectDropdown] = useState({}); // { [itemNumber]: boolean }
  // Add state for open parent path dropdown
  const [openParentPathDropdown, setOpenParentPathDropdown] = useState({}); // { [itemNumber]: boolean }
  const [parentPathFilter, setParentPathFilter] = useState({}); // { [itemNumber]: parentPathSection }

  // 1. Add state to track the order in which instances are checked
  const [instanceSelectionOrder, setInstanceSelectionOrder] = useState([]); // array of instance ids in order of selection
  
  // State for hide fields functionality
  const [hideFieldsDropdownOpen, setHideFieldsDropdownOpen] = useState(false);
  const [hiddenFields, setHiddenFields] = useState({}); // { [fieldName]: boolean }
  const [fieldSearchQuery, setFieldSearchQuery] = useState(''); // Search query for fields

  // State for filter functionality
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterConditions, setFilterConditions] = useState([]); // Array of condition objects
  const [filteredResults, setFilteredResults] = useState(results); // Filtered results for display
  const [inputValues, setInputValues] = useState({}); // Local state for input values to enable debouncing
  const [hasUnprocessedChanges, setHasUnprocessedChanges] = useState(false); // Track if user has made changes that haven't been processed
  const [logicalOperator, setLogicalOperator] = useState('and'); // Logical operator for multiple conditions
  const [draggedCondition, setDraggedCondition] = useState(null); // Track which condition is being dragged
  const [dragHoverTarget, setDragHoverTarget] = useState(null); // Track which condition is being hovered over during drag

  // Helper to truncate from the right (show left side, hide right side)
  const truncate = (str, max = 20) => {
    if (!str || str.length <= max) return str;
    return str.slice(0, max) + '...';
  };

  // Define all available fields for the hide/show functionality
  const allFields = [
    { key: 'qty', label: 'Qty', isMainTable: true },
    { key: 'total', label: 'Total', isMainTable: true },
    { key: 'inUse', label: 'In Use', isMainTable: true },
    { key: 'essentialReserve', label: 'Essential Reserve', isMainTable: true },
    { key: 'usableSurplus', label: 'Usable Surplus', isMainTable: true },
    { key: 'inventoryItemNumber', label: 'Inventory Item Number', isMainTable: true },
    { key: 'manufacturerPartNumber', label: 'Manufacturer Part #', isMainTable: true },
    { key: 'manufacturerName', label: 'Manufacturer Name', isMainTable: true },
    { key: 'inventoryDescription', label: 'Inventory Description', isMainTable: true },
    { key: 'instanceId', label: 'Instance ID', isMainTable: false },
    { key: 'serialNumber', label: 'Serial Number/Name', isMainTable: false },
    { key: 'quantity', label: 'Quantity', isMainTable: false },
    { key: 'inventoryMaturity', label: 'Inventory Maturity', isMainTable: false },
    { key: 'associatedProject', label: 'Associated Project', isMainTable: false },
    { key: 'hardwareCustodian', label: 'Hardware Custodian', isMainTable: false },
    { key: 'parentPath', label: 'Parent Path', isMainTable: false }
  ];

  // Define only the searchable fields for the filter dropdown
  const searchableFields = [
    { key: 'inventoryItemNumber', label: 'Inventory Item Number', isMainTable: true },
    { key: 'manufacturerPartNumber', label: 'Manufacturer Part #', isMainTable: true },
    { key: 'manufacturerName', label: 'Manufacturer Name', isMainTable: true },
    { key: 'inventoryDescription', label: 'Inventory Description', isMainTable: true },
    { key: 'instanceId', label: 'Instance ID', isMainTable: false },
    { key: 'associatedProject', label: 'Associated Project', isMainTable: false },
    { key: 'hardwareCustodian', label: 'Hardware Custodian', isMainTable: false },
    { key: 'parentPath', label: 'Parent Path', isMainTable: false }
  ];

  const toggleFieldVisibility = (fieldKey) => {
    setHiddenFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  // Count active filter conditions
  const activeFilterCount = filterConditions.filter(condition => 
    condition.field && condition.operator && condition.value.trim() !== ''
  ).length;

  // Filter fields based on search query
  const filteredFields = allFields.filter(field => 
    field.label.toLowerCase().includes(fieldSearchQuery.toLowerCase())
  );

  // Count hidden fields
  const hiddenFieldCount = Object.values(hiddenFields).filter(Boolean).length;

  // Helper function to generate grid template columns for main table
  const getMainTableGridColumns = () => {
    return `40px ${!hiddenFields.qty ? '80px' : ''} 40px ${!hiddenFields.total ? '1fr' : ''} ${!hiddenFields.inUse ? '1fr' : ''} ${!hiddenFields.essentialReserve ? '1fr' : ''} ${!hiddenFields.usableSurplus ? '1fr' : ''} ${!hiddenFields.inventoryItemNumber ? '1.2fr' : ''} ${!hiddenFields.manufacturerPartNumber ? '1.2fr' : ''} ${!hiddenFields.manufacturerName ? '1.2fr' : ''} ${!hiddenFields.inventoryDescription ? '2fr' : ''}`.replace(/\s+/g, ' ').trim();
  };

  // Helper function to generate grid template columns for instance table
  const getInstanceTableGridColumns = () => {
    return `1fr ${!hiddenFields.instanceId ? '2fr' : ''} ${!hiddenFields.serialNumber ? '2fr' : ''} ${!hiddenFields.quantity ? '2fr' : ''} ${!hiddenFields.inventoryMaturity ? '1fr' : ''} ${!hiddenFields.associatedProject ? '2fr' : ''} ${!hiddenFields.hardwareCustodian ? '2fr' : ''} ${!hiddenFields.parentPath ? '2fr' : ''}`.replace(/\s+/g, ' ').trim();
  };

  // Handler for clicking a cell
  const handleCellClick = (label, value) => {
    if (value && value.length > 20) {
      setExpandedValue(value);
      setExpandedLabel(label);
    }
  };

  // Handler for closing the expanded box
  const handleClose = () => {
    setExpandedValue(null);
    setExpandedLabel('');
  };

  // Combine selected items and current filtered results, deduplicating by id
  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  // Find the group for each selected id (itemNumber) from original results
  const selectedGroups = selectedIds
    .map(id => results.find(group => group.itemNumber === id))
    .filter(Boolean)
    // Only include selected groups that are also in filtered results
    .filter(group => filteredResults.some(filteredGroup => filteredGroup.itemNumber === group.itemNumber));
  // Non-selected groups from filtered results
  const nonSelectedGroups = filteredResults.filter(group => !selectedIds.includes(group.itemNumber));
  // Display selected groups at the top
  const displayGroups = [...selectedGroups, ...nonSelectedGroups];

  const handleQuantityChange = (id, value, e) => {
    // Only allow positive integers or empty
    if (/^\d*$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
      // Only check the box if Enter is pressed and value is not empty
      if (e && e.key === 'Enter' && value.trim() !== '') {
        setSelected(prev => ({ ...prev, [id]: results.find(group => group.itemNumber === id) }));
        // Prevent form submission or default Enter behavior
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
      }
    }
  };

  const handleCheckboxChange = (id, part) => {
    setSelected(prev => {
      const newSelected = { ...prev };
      if (newSelected[id]) {
        // Uncheck: remove from selected
        delete newSelected[id];
      } else {
        // Check: add to selected
        newSelected[id] = part;
      }
      return newSelected;
    });
  };

  // Helper to highlight all backend-matched keywords in a field
  const highlightFieldWithMatches = (text, matches) => {
    if (!matches || !text) return text;
    // matches is an array of keywords to highlight
    let result = [];
    let lowerText = text.toLowerCase();
    let ranges = [];
    for (const kw of matches) {
      if (!kw) continue;
      let idx = lowerText.indexOf(kw.toLowerCase());
      while (idx !== -1) {
        ranges.push({ start: idx, end: idx + kw.length });
        idx = lowerText.indexOf(kw.toLowerCase(), idx + kw.length);
      }
    }
    if (ranges.length === 0) return text;
    // Sort and merge overlapping ranges
    ranges.sort((a, b) => a.start - b.start);
    let merged = [];
    for (const r of ranges) {
      if (!merged.length || merged[merged.length - 1].end < r.start) {
        merged.push({ ...r });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      }
    }
    // Build highlighted output
    let cursor = 0;
    for (const m of merged) {
      if (cursor < m.start) {
        result.push(text.slice(cursor, m.start));
      }
      result.push(
        <span style={{ background: '#ffe066', color: '#222', fontWeight: 600 }} key={m.start}>
          {text.slice(m.start, m.end)}
        </span>
      );
      cursor = m.end;
    }
    if (cursor < text.length) {
      result.push(text.slice(cursor));
    }
    return result;
  };

  const handleExpandToggle = (itemNumber) => {
    setExpandedRows(prev => ({ ...prev, [itemNumber]: !prev[itemNumber] }));
  };

  // Handler for select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      // Select all visible groups
      const newSelected = { ...selected };
      displayGroups.forEach(group => {
        newSelected[group.itemNumber] = group.instances[0];
      });
      setSelected(newSelected);
    } else {
      // Deselect all visible groups
      const newSelected = { ...selected };
      displayGroups.forEach(group => {
        delete newSelected[group.itemNumber];
      });
      setSelected(newSelected);
    }
  };

  // Helper to cap requested instances for a group at usable surplus
  function getCappedRequestedInstances(group, requestedInstances, generalInventoryFilter) {
    const part = group.instances[0];
    const spareThreshold = part.spare_value == null ? 0 : part.spare_value;
    const total = part.total == null ? 0 : part.total;
    const inUse = part.inUse == null ? 0 : part.inUse;
    const generalInventoryAmount = total - inUse;
    const essentialReserve = Math.ceil(spareThreshold * inUse);
    const usableSurplus = generalInventoryAmount - essentialReserve;
    const checkedInstances = (generalInventoryFilter[group.itemNumber]
      ? group.instances.filter(instance => instance.generalInventory)
      : group.instances
    ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
    let runningTotal = 0;
    return checkedInstances.reduce((acc, inst) => {
      const qty = parseInt(inst.m_quantity, 10) || 0;
      if (runningTotal + qty <= usableSurplus) {
        acc[inst.id] = true;
        runningTotal += qty;
      }
      return acc;
    }, {});
  }

  // Add a class to the body to disable pointer events when modal is open
  useEffect(() => {
    if (requestPopup.open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [requestPopup.open]);

  // Close hide fields dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hideFieldsDropdownOpen && !event.target.closest('.hide-fields-container')) {
        setHideFieldsDropdownOpen(false);
      }
      if (filterDropdownOpen && !event.target.closest('.filter-container')) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideFieldsDropdownOpen, filterDropdownOpen]);

  // Debouncing refs for API calls
  const lastKeystrokeRef = useRef(0);
  const debounceTimeoutRef = useRef(null);

  // Update input values when filter conditions change (for initial loading only)
  useEffect(() => {
    const newInputValues = {};
    filterConditions.forEach((condition, index) => {
      newInputValues[index] = condition.value;
    });
    setInputValues(newInputValues);
  }, [filterConditions.length]); // Only react to array length changes, not value changes

  // Filter function that applies all conditions to results (client-side fallback only)
  const applyFilters = useCallback((conditions, data) => {
    if (!conditions || conditions.length === 0) {
      return data;
    }

    const filtered = data.filter(group => {
      const part = group.instances[0];
      
      const matchesAllConditions = conditions.every(condition => {
        if (!condition.field || !condition.operator || condition.value === '') {
          return true; // Skip incomplete conditions
        }

        let fieldValue = '';
        let matches = false;
        
        // Map field keys to actual data values
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
            
            // Debug: Log every part's inventory description when searching for "rail"
            if (condition.value.toLowerCase() === 'rail') {
              console.log('DEBUG - Part:', {
                id: part.m_id,
                inv_desc: part.m_inventory_description,
                desc: part.m_description,
                fieldValue: fieldValue,
                searchValue: condition.value,
                hasRail: fieldValue.toLowerCase().includes('rail')
              });
            }
            
            matches = matchesCondition(fieldValue, condition.operator, condition.value);
            break;
          case 'instanceId':
            // For instance fields, check all instances in the group
            matches = group.instances.some(instance => {
              const instValue = instance.m_id || '';
              return matchesCondition(instValue, condition.operator, condition.value);
            });
            break;
          case 'associatedProject':
            matches = group.instances.some(instance => {
              const instValue = instance.m_project?.keyed_name || instance.associated_project || '';
              return matchesCondition(instValue, condition.operator, condition.value);
            });
            break;
          case 'hardwareCustodian':
            matches = group.instances.some(instance => {
              const instValue = instance["m_custodian@aras.keyed_name"] || instance.m_custodian || '';
              return matchesCondition(instValue, condition.operator, condition.value);
            });
            break;
          case 'parentPath':
            matches = group.instances.some(instance => {
              const instValue = instance.m_parent_ref_path || '';
              return matchesCondition(instValue, condition.operator, condition.value);
            });
            break;
          default:
            matches = true;
        }

        return matches;
      });

      return matchesAllConditions;
    });
    
    // Debug for "rail" search
    const hasRailCondition = conditions.some(c => c.value.toLowerCase() === 'rail' && c.field === 'inventoryDescription');
    if (hasRailCondition) {
      console.log('DEBUG - After filtering for "rail":', {
        originalCount: data.length,
        filteredCount: filtered.length,
        conditions: conditions
      });
    }

    return filtered;
  }, []);

  // Helper function to check if a value matches a condition
  const matchesCondition = (fieldValue, operator, searchValue) => {
    const field = String(fieldValue).toLowerCase();
    const search = String(searchValue).toLowerCase();

    let result = false;
    switch (operator) {
      case 'contains':
        result = field.includes(search);
        break;
      case 'does not contain':
        result = !field.includes(search);
        break;
      case 'is':
        result = field === search;
        break;
      case 'is not':
        result = field !== search;
        break;
      default:
        result = true;
    }

    // Log for debugging
    if (operator === 'contains') {
      console.log(`matchesCondition: "${field}" ${operator} "${search}" = ${result}`);
    }

    return result;
  };

  // Convert filter conditions to search chips format for API
  const convertFilterConditionsToChips = useCallback((conditions) => {
    const filteredConditions = conditions
      .filter(condition => condition.field && condition.operator && condition.value.trim() !== '')
      .map(condition => {
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

        // Send operator-value object to backend
        return {
          field: fieldMapping[condition.field] || condition.field,
          value: {
            operator: condition.operator,
            value: condition.value.trim()
          }
        };
      });

    // Return structured format with logical operator
    return {
      logicalOperator: logicalOperator,
      conditions: filteredConditions
    };
  }, [logicalOperator]);

  // Trigger API search when filter conditions are complete and have changed
  const triggerFilterSearch = useCallback(async (conditions) => {
    if (!onFilterSearch) {
      // Fallback to client-side filtering if no API handler provided
      const filtered = applyFilters(conditions, results);
      setFilteredResults(filtered);
      return;
    }

    // Convert conditions to search chips format
    const chips = convertFilterConditionsToChips(conditions);
    
    if (chips.length === 0) {
      // No valid filter conditions - reset to original results
      setFilteredResults(results);
      return;
    }

    try {
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
      const filtered = applyFilters(conditions, results);
      setFilteredResults(filtered);
    }
  }, [onFilterSearch, convertFilterConditionsToChips]); // Remove applyFilters and results dependencies

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
      // Check if we have at least one complete condition
      const hasCompleteCondition = filterConditions.some(condition => 
        condition.field && condition.operator && condition.value.trim() !== ''
      );
      
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
    }, 500); // 500ms debounce delay
  }, [filterConditions, hasUnprocessedChanges]); // Remove triggerFilterSearch dependency

  // Update filtered results when base results change
  useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Drag and drop handlers for reordering conditions
  const handleDragStart = (e, conditionIndex) => {
    setDraggedCondition(conditionIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', conditionIndex.toString());
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
    console.log(`Started dragging condition ${conditionIndex}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCondition !== null && draggedCondition !== targetIndex) {
      setDragHoverTarget(targetIndex);
    }
  };

  const handleDragLeave = (e, targetIndex) => {
    // Only clear hover if we're actually leaving this element (not just moving to a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragHoverTarget(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedIndex === targetIndex || isNaN(draggedIndex)) {
      setDragHoverTarget(null);
      return;
    }

    console.log(`Dropping condition ${draggedIndex} at position ${targetIndex}`);

    const newConditions = [...filterConditions];
    const draggedItem = newConditions[draggedIndex];
    
    // Remove the dragged item
    newConditions.splice(draggedIndex, 1);
    
    // Insert at the new position
    const insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newConditions.splice(insertIndex, 0, draggedItem);
    
    // Update input values to match new order
    const newInputValues = {};
    newConditions.forEach((condition, newIndex) => {
      const oldIndex = filterConditions.findIndex(c => c.id === condition.id);
      newInputValues[newIndex] = inputValues[oldIndex] || condition.value;
    });
    
    setFilterConditions(newConditions);
    setInputValues(newInputValues);
    setHasUnprocessedChanges(true);
    
    // Clear drag states
    setDragHoverTarget(null);
    
    console.log('New condition order:', newConditions.map(c => `${c.field}:${c.value}`));
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedCondition(null);
    setDragHoverTarget(null);
  };

  return (
    <>
      {/* Button/Action header positioned against taskbar */}
      <div className="search-result-button-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>            <div style={{ position: 'relative' }} className="hide-fields-container">
              <button
                style={{
                  padding: '8px 16px',
                  background: hiddenFieldCount > 0 ? '#007bff' : 'transparent',
                  color: hiddenFieldCount > 0 ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={e => {
                  if (hiddenFieldCount === 0) {
                    e.currentTarget.style.background = '#e9ecef';
                  }
                }}
                onMouseOut={e => {
                  if (hiddenFieldCount === 0) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onClick={() => {
                  setHideFieldsDropdownOpen(!hideFieldsDropdownOpen);
                }}
                aria-label="Hide or show table fields"
              >
                <img 
                  src="/images/hide.svg" 
                  alt="" 
                  style={{ 
                    width: 16, 
                    height: 16,
                    flexShrink: 0,
                    filter: hiddenFieldCount > 0 ? 'brightness(0) invert(1)' : 'none'
                  }} 
                />
                {hiddenFieldCount > 0 ? `${hiddenFieldCount} hidden field${hiddenFieldCount === 1 ? '' : 's'}` : 'Hide Fields'}
              </button>

              {hideFieldsDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '320px',
                  maxHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Search bar */}
                  <div style={{ padding: '12px 16px 8px 16px', borderBottom: '1px solid #eee' }}>
                    <input
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchQuery}
                      onChange={e => setFieldSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  {/* Scrollable field list */}
                  <div style={{ 
                    padding: '8px 0', 
                    maxHeight: '280px', 
                    overflowY: 'auto',
                    flexGrow: 1
                  }}>
                    {/* Main table fields */}
                    <div style={{ padding: '0 16px 8px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Main Table Fields
                      </div>
                      {filteredFields.filter(field => field.isMainTable).map(field => (
                        <label key={field.key} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '6px 0',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          <input
                            type="checkbox"
                            checked={!hiddenFields[field.key]}
                            onChange={() => toggleFieldVisibility(field.key)}
                            style={{ marginRight: '8px' }}
                          />
                          {field.label}
                        </label>
                      ))}
                    </div>
                    
                    {/* Instance detail fields */}
                    <div style={{ padding: '0 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Instance Detail Fields
                      </div>
                      {filteredFields.filter(field => !field.isMainTable).map(field => (
                        <label key={field.key} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '6px 0',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}>
                          <input
                            type="checkbox"
                            checked={!hiddenFields[field.key]}
                            onChange={() => toggleFieldVisibility(field.key)}
                            style={{ marginRight: '8px' }}
                          />
                          {field.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bottom buttons - always visible */}
                  <div style={{ 
                    padding: '12px 16px', 
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'space-between'
                  }}>
                    <button
                      onClick={() => {
                        const newHiddenFields = {};
                        allFields.forEach(field => {
                          newHiddenFields[field.key] = true;
                        });
                        setHiddenFields(newHiddenFields);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Hide All
                    </button>
                    <button
                      onClick={() => {
                        setHiddenFields({});
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Show All
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ position: 'relative' }} className="filter-container">
              <button
                style={{
                  padding: '8px 16px',
                  background: activeFilterCount > 0 ? '#007bff' : 'transparent',
                  color: activeFilterCount > 0 ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={e => {
                  if (activeFilterCount === 0) {
                    e.currentTarget.style.background = '#e9ecef';
                  }
                }}
                onMouseOut={e => {
                  if (activeFilterCount === 0) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onClick={() => {
                  setFilterDropdownOpen(!filterDropdownOpen);
                }}
                aria-label="Filter table data"
              >
                <img 
                  src="/images/filter.svg" 
                  alt="" 
                  style={{ 
                    width: 16, 
                    height: 16,
                    flexShrink: 0,
                    filter: activeFilterCount > 0 ? 'brightness(0) invert(1)' : 'none'
                  }} 
                />
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : 'Filter'}
              </button>

              {filterDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '500px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  ...(filterConditions.length === 0 && { minHeight: 'auto', padding: '12px' })
                }}>
                  {filterConditions.length === 0 ? (
                    // Show "No filter conditions" message when no conditions exist
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      marginBottom: '12px'
                    }}>
                      No filter conditions are applied
                    </div>
                  ) : (
                    // Show filter builder interface when conditions exist
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '16px' }}>
                      {/* Header text */}
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#333', textAlign: 'left' }}>
                        In this view, show records
                      </div>
                      
                      {/* Condition rows */}
                      {filterConditions.map((condition, index) => (
                        <div 
                          key={condition.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontSize: '14px',
                            marginLeft: '16px',
                            padding: '3px 12px',
                            borderRadius: '4px',
                            backgroundColor: draggedCondition === index 
                              ? '#e3f2fd' 
                              : dragHoverTarget === index 
                                ? '#e8f4fd' 
                                : '#ffffff',
                            opacity: draggedCondition === index ? 0.8 : 1,
                            border: draggedCondition === index 
                              ? '2px dashed #2196f3' 
                              : dragHoverTarget === index 
                                ? '2px dashed #4caf50' 
                                : '1px solid #dee2e6',
                            transition: 'all 0.2s ease',
                            cursor: 'move',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            marginBottom: '0px'
                          }}
                          // Drag and drop attributes
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragLeave={(e) => handleDragLeave(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                        >
                          {index > 0 && (
                            <>
                              {index === 1 ? (
                                // Second condition gets the logical operator dropdown
                                <select
                                  value={logicalOperator}
                                  onChange={(e) => {
                                    setLogicalOperator(e.target.value);
                                    // Mark that we have unprocessed changes for logical operator changes
                                    setHasUnprocessedChanges(true);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()} // Prevent interfering with drag
                                  style={{
                                    padding: '4px 0px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    width: '48px',
                                    height: '28px',
                                    textTransform: 'uppercase',
                                    marginLeft: '-8px'
                                  }}
                                >
                                  <option value="and">AND</option>
                                  <option value="or">OR</option>
                                </select>
                              ) : (
                                // Third+ conditions show the logical operator as non-clickable text
                                <span style={{ 
                                  color: '#666', 
                                  minWidth: '40px',
                                  textTransform: 'uppercase',
                                  fontSize: '12px',
                                  display: 'inline-block'
                                }}>
                                  {logicalOperator}
                                </span>
                              )}
                            </>
                          )}
                          {index === 0 && <span style={{ color: '#666', minWidth: '40px' }}>Where</span>}
                          
                          {/* Field dropdown */}
                          <select
                            value={condition.field}
                            onChange={(e) => {
                              const newConditions = [...filterConditions];
                              newConditions[index].field = e.target.value;
                              setFilterConditions(newConditions);
                              // Mark that we have unprocessed changes for field changes too
                              setHasUnprocessedChanges(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent interfering with drag
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              minWidth: '120px'
                            }}
                          >
                            <option value="">Select field...</option>
                            {searchableFields.map(field => (
                              <option key={field.key} value={field.key}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                          
                          {/* Operator dropdown */}
                          <select
                            value={condition.operator}
                            onChange={(e) => {
                              const newConditions = [...filterConditions];
                              newConditions[index].operator = e.target.value;
                              setFilterConditions(newConditions);
                              // Mark that we have unprocessed changes for operator changes too
                              setHasUnprocessedChanges(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent interfering with drag
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              minWidth: '100px'
                            }}
                          >
                            <option value="contains">contains...</option>
                            <option value="does not contain">does not contain...</option>
                            <option value="is">is...</option>
                            <option value="is not">is not...</option>
                          </select>
                          
                          {/* Value input */}
                          <input
                            type="text"
                            value={inputValues[index] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              // Update local input state immediately for UI responsiveness
                              setInputValues(prev => ({ ...prev, [index]: value }));
                              
                              // Update filter conditions immediately (no debouncing here)
                              setFilterConditions(prevConditions => {
                                const newConditions = [...prevConditions];
                                newConditions[index].value = value;
                                return newConditions;
                              });
                              
                              // Mark that we have unprocessed changes - this will trigger the useEffect debounced search
                              setHasUnprocessedChanges(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent interfering with drag
                            placeholder="Enter a value"
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              minWidth: '120px',
                              flex: 1
                            }}
                          />
                          
                          {/* Remove button */}
                          <button
                            onClick={() => {
                              const newConditions = filterConditions.filter((_, i) => i !== index);
                              setFilterConditions(newConditions);
                              // Clean up input values - reindex remaining values
                              const newInputValues = {};
                              newConditions.forEach((condition, newIndex) => {
                                const oldIndex = filterConditions.findIndex(c => c.id === condition.id);
                                newInputValues[newIndex] = inputValues[oldIndex] || condition.value;
                              });
                              setInputValues(newInputValues);
                              // Mark that we have unprocessed changes for condition removal
                              setHasUnprocessedChanges(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent interfering with drag
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Remove condition"
                          >
                            <img 
                              src="/images/garbage.svg" 
                              alt="Remove" 
                              style={{ 
                                width: 16, 
                                height: 16,
                                flexShrink: 0
                              }} 
                            />
                          </button>
                          
                          {/* Drag handle */}
                          <div
                            style={{
                              cursor: 'grab',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '3px',
                              transition: 'background-color 0.2s',
                              pointerEvents: 'none' // Let drag events pass through to parent
                            }}
                            title="Drag to reorder"
                          >
                            <img 
                              src="/images/dots.svg" 
                              alt="Drag to reorder" 
                              style={{ 
                                width: 16, 
                                height: 16,
                                flexShrink: 0,
                                opacity: 0.7,
                                pointerEvents: 'none'
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Bottom buttons - always visible on the left side */}
                  <div style={{ 
                    borderTop: '1px solid #eee',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => {
                        const newIndex = filterConditions.length;
                        setFilterConditions([...filterConditions, {
                          id: Date.now(),
                          field: 'inventoryItemNumber',
                          operator: 'contains',
                          value: ''
                        }]);
                        // Initialize input value for the new condition
                        setInputValues(prev => ({ ...prev, [newIndex]: '' }));
                        // Mark that we have unprocessed changes for adding new condition
                        setHasUnprocessedChanges(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                        transition: 'background 0.2s',
                        height: '28px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#e9ecef';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <img 
                        src="/images/plus.svg" 
                        alt="" 
                        style={{ 
                          width: 12, 
                          height: 12,
                          flexShrink: 0
                        }} 
                      />
                      Add Condition
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement add condition group logic
                        console.log('Add Condition Group clicked');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                        transition: 'background 0.2s',
                        height: '28px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#e9ecef';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <img 
                        src="/images/plus.svg" 
                        alt="" 
                        style={{ 
                          width: 12, 
                          height: 12,
                          flexShrink: 0
                        }} 
                      />
                      Add Condition Group
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
              Actions & Filters
            </span>
            {/* Add buttons/filters here as needed */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Right side - could add export button, etc. */}
            <span style={{ fontSize: 14, color: '#666' }}>
              {displayGroups.length} items
            </span>
          </div>
        </div>
      
      {/* Column header positioned below button header */}
      <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: getMainTableGridColumns(), minWidth: 0 }}>
          <div className="search-result-field">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={displayGroups.length > 0 && displayGroups.every(group => selected[group.itemNumber])}
              onChange={handleSelectAll}
            />
          </div>
          {!hiddenFields.qty && <div className="search-result-field">Qty</div>}
          <div className="search-result-field"></div>
          {!hiddenFields.total && <div className="search-result-field">Total</div>}
          {!hiddenFields.inUse && <div className="search-result-field">In Use</div>}
          {!hiddenFields.essentialReserve && <div className="search-result-field">Essential Reserve</div>}
          {!hiddenFields.usableSurplus && <div className="search-result-field">Usable Surplus</div>}
          {!hiddenFields.inventoryItemNumber && <div className="search-result-field">Inventory Item Number</div>}
          {!hiddenFields.manufacturerPartNumber && <div className="search-result-field">Manufactur Part #</div>}
          {!hiddenFields.manufacturerName && <div className="search-result-field">Manufacturer Name</div>}
          {!hiddenFields.inventoryDescription && <div className="search-result-field">Inventory Description</div>}
        </div>
      
      {/* Main table content */}
      <div className="search-results-dropdown">
        {filteredResults.length === 0 ? (
          <div className="search-results-empty">
            {results.length === 0 ? 'No parts found.' : 'No parts match the current filters.'}
          </div>
        ) : (
          <>
          {displayGroups.map(group => {
            const part = group.instances[0];
            // If spare_value is null, treat it as 0
            const spareThreshold = part.spare_value == null ? 0 : part.spare_value;
            const total = part.total == null ? 0 : part.total;
            const inUse = part.inUse == null ? 0 : part.inUse;
            // General inventory amount
            const generalInventoryAmount = total - inUse;
            // Essential Reserve is required spare
            const essentialReserve = Math.ceil(spareThreshold * inUse);
            // Usable Surplus is general inventory minus essential reserve
            const usableSurplus = generalInventoryAmount - essentialReserve;
            return (
              <div key={group.itemNumber}>
                <div className="search-result-item" style={{ display: 'grid', gridTemplateColumns: getMainTableGridColumns(), minWidth: 0 }}>
                  <div className="search-result-field">
                    <input
                      type="checkbox"
                      checked={!!selected[group.itemNumber]}
                      onChange={() => handleCheckboxChange(group.itemNumber, part)}
                      aria-label="Select part"
                    />
                  </div>
                  {!hiddenFields.qty && (
                    <div className="search-result-field">
                      <input
                        type="text"
                        className="quantity-input"
                        value={quantities[group.itemNumber] || ''}
                        onChange={e => handleQuantityChange(group.itemNumber, e.target.value)}
                        onBlur={e => {
                          // If quantity is not empty, check the box on blur
                          if ((e.target.value || '').trim() !== '') {
                            setSelected(prev => ({ ...prev, [group.itemNumber]: part }));
                          }
                        }}
                        onKeyDown={e => handleQuantityChange(group.itemNumber, quantities[group.itemNumber] || e.target.value, e)}
                        placeholder="0"
                        min="0"
                        style={{ width: 60, textAlign: 'center' }}
                        aria-label="Quantity"
                      />
                    </div>
                  )}
                  <div className="search-result-field">
                    <button onClick={() => handleExpandToggle(group.itemNumber)} aria-label="Expand details" style={{ padding: 0, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
                      {expandedRows[group.itemNumber] ? '▲' : '▼'}
                    </button>
                  </div>
                  {!hiddenFields.total && <div className="search-result-field">{truncate(part.total?.toString()) ?? 'N/A'}</div>}
                  {!hiddenFields.inUse && <div className="search-result-field">{truncate(part.inUse?.toString()) ?? 'N/A'}</div>}
                  {!hiddenFields.essentialReserve && <div className="search-result-field">{truncate(essentialReserve.toString())}</div>}
                  {!hiddenFields.usableSurplus && (
                    <div className="search-result-field" style={{
                      color: usableSurplus > 0 ? '#228B22' : undefined,
                      fontWeight: usableSurplus > 0 ? 700 : undefined,
                    }}>
                      {truncate(usableSurplus.toString())}
                    </div>
                  )}
                  {!hiddenFields.inventoryItemNumber && <div className="search-result-field" onClick={() => handleCellClick('Inventory Item Number', part.m_inventory_item?.item_number)} style={{ cursor: part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_inventory_item?.item_number ?? 'N/A'), part._matches?.m_inventory_item)}</div>}
                  {!hiddenFields.manufacturerPartNumber && <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Part #', part.m_mfg_part_number)} style={{ cursor: part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_part_number ?? 'N/A'), part._matches?.m_mfg_part_number)}</div>}
                  {!hiddenFields.manufacturerName && <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Name', part.m_mfg_name)} style={{ cursor: part.m_mfg_name && part.m_mfg_name.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_name ?? 'N/A'), part._matches?.m_mfg_name)}</div>}
                  {!hiddenFields.inventoryDescription && <div className="search-result-field" onClick={() => handleCellClick('Inventory Description', part.m_inventory_description || part.m_description)} style={{ cursor: (part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate((part.m_inventory_description ?? part.m_description) ?? 'N/A'), part._matches?.m_inventory_description || part._matches?.m_description)}</div>}
                </div>
                {expandedRows[group.itemNumber] && (
                  <div style={{ background: '#f9f9f9', padding: '0 16px 12px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '8px 0 4px 0', gap: 0 }}>
                      <span style={{ fontSize: 20, marginBottom: 2 }}>Instances:</span>
                    </div>
                    {isAdmin && (
                      <div style={{ margin: '0 0 8px 0', fontWeight: 400, fontSize: 16, color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        Spare Threshold for this item:
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={group.instances[0]?.spare_value == null ? 0 : group.instances[0].spare_value}
                          onChange={e => {
                            const newValue = parseFloat(e.target.value);
                            // Update spare_value for all instances in this group locally
                            group.instances.forEach(instance => {
                              instance.spare_value = isNaN(newValue) ? 0 : newValue;
                            });
                            // Force re-render
                            setSelected(selected => ({ ...selected }));
                          }}
                          onBlur={async e => {
                            const newValue = parseFloat(e.target.value);
                            try {
                              // For each instance, call backend to update spare_value
                              await Promise.all(
                                group.instances.map(async instance => {
                                  try {
                                    await updateSpareValue(instance.id, isNaN(newValue) ? 0 : newValue, accessToken);
                                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'success' }));
                                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 1500);
                                  } catch (err) {
                                    setSpareFeedback(prev => ({ ...prev, [instance.id]: 'error' }));
                                    setTimeout(() => setSpareFeedback(prev => ({ ...prev, [instance.id]: null })), 2500);
                                    throw err; // Rethrow to handle in the outer catch
                                  }
                                })
                              );
                              // Log a single success message for the entire group
                              console.log(`Spare threshold successfully updated to ${isNaN(newValue) ? 0 : newValue} for ${group.instances.length} instances of ${group.itemNumber}.`);
                            } catch (err) {
                              console.error('Failed to update spare threshold:', err);
                            }
                          }}
                          style={{ width: 60, marginLeft: 6, fontWeight: 600, color: '#2d6a4f', border: '1px solid #bcd6f7', borderRadius: 4, padding: '2px 6px', background: '#f8fafc' }}
                          aria-label="Edit spare threshold for this item"
                        />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: getInstanceTableGridColumns(), gap: 8, fontWeight: 'bold', marginBottom: 4, alignItems: 'center', minHeight: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            color: '#222',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            padding: '4px 8px',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            marginBottom: 0,
                            width: 'auto',
                            minWidth: 60,
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#ffe066')}
                          onFocus={e => (e.currentTarget.style.background = '#ffe066')}
                          onMouseOut={e => (e.currentTarget.style.background = 'none')}
                          onBlur={e => (e.currentTarget.style.background = 'none')}
                          onClick={() => {
                            // Find all checked instances for this group
                            const checkedInstances = (generalInventoryFilter[group.itemNumber]
                              ? group.instances.filter(instance => instance.generalInventory)
                              : group.instances
                            ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
                            // Get unique custodians from checked instances
                            const custodians = Array.from(new Set(
                              checkedInstances.map(inst => inst["m_custodian@aras.keyed_name"] || inst.m_custodian).filter(Boolean)
                            ));

                            // Calculate capped quantities for each checked instance (for email/request)
                            // Use selection order so the last-checked instance gets the capped/partial quantity
                            let runningTotal = 0;
                            const usableSurplusQty = usableSurplus;
                            // Order checkedInstances by selection order (last-checked last)
                            const checkedInstanceIds = checkedInstances.map(inst => inst.id);
                            const orderedIds = instanceSelectionOrder.filter(id => checkedInstanceIds.includes(id));
                            const orderedCheckedInstances = orderedIds.map(id => checkedInstances.find(inst => inst.id === id)).filter(Boolean);
                            const cappedInstances = [];
                            for (const inst of orderedCheckedInstances) {
                              const qty = parseInt(inst.m_quantity, 10) || 0;
                              if (runningTotal >= usableSurplusQty) break;
                              let allowedQty = qty;
                              if (runningTotal + qty > usableSurplusQty) {
                                allowedQty = usableSurplusQty - runningTotal;
                              }
                              if (allowedQty > 0) {
                                cappedInstances.push({ ...inst, capped_quantity: allowedQty });
                                runningTotal += allowedQty;
                              }
                            }

                            setRequestPopup({
                              open: true,
                              custodians,
                              group: { ...group, generalInventoryFilter: generalInventoryFilter[group.itemNumber], requestedInstances },
                              cappedInstances // Pass capped instance list for email/request generation
                            });
                          }}
                          aria-label="Request selected instances from hardware custodian"
                        >
                          Request
                        </button>
                        <span style={{ display: 'block', fontWeight: 400, fontSize: 13, color: '#2d6a4f', marginTop: 4 }}>
                          {/* Calculate total quantity of checked instances for this group, capped at usableSurplus */}
                          {(() => {
                            const checkedInstances = (generalInventoryFilter[group.itemNumber]
                              ? group.instances.filter(instance => instance.generalInventory)
                              : group.instances
                            ).filter(instance => instance.generalInventory && requestedInstances[instance.id]);
                            const totalQty = checkedInstances.reduce((sum, inst) => sum + (parseInt(inst.m_quantity, 10) || 0), 0);
                            const cappedQty = Math.min(totalQty, usableSurplus);
                            return `Checked Qty: ${cappedQty}`;
                          })()}
                        </span>
                      </div>
                      {!hiddenFields.instanceId && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Instance ID</div>}
                      {!hiddenFields.serialNumber && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Serial Number/Name</div>}
                      {!hiddenFields.quantity && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Quantity</div>}
                      {!hiddenFields.inventoryMaturity && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Inventory Maturity</div>}
                      {!hiddenFields.associatedProject && (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40, position: 'relative', width: '100%' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              color: '#222',
                              cursor: 'pointer',
                              userSelect: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%'
                            }}
                            aria-label="Filter by associated project"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                            }}
                            onBlur={e => {
                              // Optionally close dropdown on blur
                            }}
                          >
                            Associated Project
                            <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
                          </span>
                          {openProjectDropdown[group.itemNumber] && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                zIndex: 10,
                                minWidth: 120,
                                marginTop: 2,
                              }}
                              tabIndex={0}
                              onBlur={() => setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                            >
                              <div
                                style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: !projectFilter[group.itemNumber] ? '#f0f0f0' : 'transparent' }}
                                onClick={() => {
                                  setProjectFilter(prev => ({ ...prev, [group.itemNumber]: '' }));
                                  setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                }}
                              >
                                All Projects
                              </div>
                              {Array.from(new Set((group.instances || []).map(inst => inst.m_project?.keyed_name || inst.associated_project).filter(Boolean)))
                                .map(project => (
                                  <div
                                    key={project}
                                    style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: projectFilter[group.itemNumber] === project ? '#f0f0f0' : 'transparent' }}
                                    onClick={() => {
                                      setProjectFilter(prev => ({ ...prev, [group.itemNumber]: project }));
                                      setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                    }}
                                  >
                                    {project}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      {!hiddenFields.hardwareCustodian && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40 }}>Hardware Custodian</div>}
                      {!hiddenFields.parentPath && (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 40, position: 'relative', width: '100%' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              color: '#222',
                              cursor: 'pointer',
                              userSelect: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%'
                            }}
                            aria-label="Filter by parent path section"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                            }}
                            onBlur={e => {
                              // Optionally close dropdown on blur
                            }}
                          >
                            Parent Path
                            <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
                          </span>
                          {openParentPathDropdown[group.itemNumber] && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                zIndex: 10,
                                minWidth: 120,
                                marginTop: 2,
                              }}
                              tabIndex={0}
                              onBlur={() => setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                            >
                              <div
                                style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: !parentPathFilter[group.itemNumber] ? '#f0f0f0' : 'transparent' }}
                                onClick={() => {
                                  setParentPathFilter(prev => ({ ...prev, [group.itemNumber]: '' }));
                                  setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                }}
                              >
                                All Parent Paths
                              </div>
                              {Array.from(new Set((
                                // Only use instances matching the selected project (if any)
                                projectFilter[group.itemNumber]
                                  ? (group.instances || []).filter(inst => (inst.m_project?.keyed_name || inst.associated_project) === projectFilter[group.itemNumber])
                                  : (group.instances || [])
                              ).map(inst => {
                                const match = (inst.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
                                return match ? match[1] : null;
                              }).filter(Boolean)))
                                .map(section => (
                                  <div
                                    key={section}
                                    style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: parentPathFilter[group.itemNumber] === section ? '#f0f0f0' : 'transparent' }}
                                    onClick={() => {
                                      setParentPathFilter(prev => ({ ...prev, [group.itemNumber]: section }));
                                      setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }));
                                    }}
                                  >
                                    {section}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: getInstanceTableGridColumns(), gap: 8, marginBottom: 8 }}>
                      <div></div>
                      {!hiddenFields.instanceId && <div></div>}
                      {!hiddenFields.serialNumber && <div></div>}
                      {!hiddenFields.quantity && <div></div>}
                      {!hiddenFields.inventoryMaturity && <div></div>}
                      {!hiddenFields.associatedProject && <div></div>}
                      {!hiddenFields.hardwareCustodian && <div></div>}
                      {!hiddenFields.parentPath && <div></div>}
                    </div>
                    {(projectFilter[group.itemNumber]
                      ? (generalInventoryFilter[group.itemNumber]
                          ? group.instances.filter(instance => instance.generalInventory && ((instance.m_project?.keyed_name || instance.associated_project) === projectFilter[group.itemNumber]))
                          : group.instances.filter(instance => (instance.m_project?.keyed_name || instance.associated_project) === projectFilter[group.itemNumber])
                        )
                      : (generalInventoryFilter[group.itemNumber]
                          ? group.instances.filter(instance => instance.generalInventory)
                          : group.instances
                        )
                    ).filter(instance => {
                      if (!parentPathFilter[group.itemNumber]) return true;
                      const match = (instance.m_parent_ref_path || '').match(/^\/?([^\/]+)/);
                      return match && match[1] === parentPathFilter[group.itemNumber];
                    }).map((instance, idx, filteredInstances) => {
                      // Calculate running total of checked quantities up to this instance
                      let runningTotal = 0;
                      let checkedCount = 0;
                      filteredInstances.forEach(inst => {
                        if (requestedInstances[inst.id]) {
                          runningTotal += parseInt(inst.m_quantity, 10) || 0;
                          checkedCount++;
                        }
                      });
                      const thisQty = parseInt(instance.m_quantity, 10) || 0;
                      const checked = !!requestedInstances[instance.id];
                      // Calculate what the total would be if this instance were checked
                      const totalIfChecked = runningTotal + (checked ? 0 : thisQty);
                      // Find if any instance is the 'overflow' (the one that pushes over the cap)
                      let overflowFound = false;
                      let tempTotal = 0;
                      let overflowId = null;
                      for (let i = 0; i < filteredInstances.length; i++) {
                        const inst = filteredInstances[i];
                        if (requestedInstances[inst.id] || inst.id === instance.id) {
                          tempTotal += parseInt(inst.m_quantity, 10) || 0;
                          if (!overflowFound && tempTotal > usableSurplus) {
                            overflowFound = true;
                            overflowId = inst.id;
                          }
                        }
                      }
                      // Allow checking if:
                      // - already checked
                      // - total checked qty < usableSurplus
                      // - OR this is the first instance to push over the cap (overflowId === instance.id)
                      const disableCheckbox = !checked && runningTotal >= usableSurplus && overflowId !== instance.id;
                      return (
                        <div key={instance.id + instance.m_id + instance.item_number + instance.m_maturity + (instance["m_custodian@aras.keyed_name"] || instance.m_custodian) + instance.m_parent_ref_path} style={{ display: 'grid', gridTemplateColumns: getInstanceTableGridColumns(), gap: 8, borderBottom: '1px solid #eee', padding: '2px 0' }}>
                          <div style={{textAlign: 'center'}}>
                            {instance.generalInventory ? (
                              <input
                                type="checkbox"
                                aria-label="Request this instance"
                                checked={checked}
                                disabled={disableCheckbox}
                                onChange={e => {
                                  if (e.target.checked) {
                                    // Only allow checking if not exceeding the overflow rule
                                    if (!disableCheckbox) {
                                      setRequestedInstances(prev => ({ ...prev, [instance.id]: true }));
                                      setInstanceSelectionOrder(order => [...order.filter(x => x !== instance.id), instance.id]); // move to end if re-checked
                                    }
                                  } else {
                                    setRequestedInstances(prev => ({ ...prev, [instance.id]: false }));
                                    setInstanceSelectionOrder(order => order.filter(x => x !== instance.id));
                                  }
                                }}
                              />
                            ) : null}
                          </div>
                          {!hiddenFields.instanceId && (
                            <div>
                              {instance.id && instance.m_id ? (
                                <a
                                  href={`https://chievmimsiiss01/IMSStage/?StartItem=m_Instance:${instance.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1976d2', textDecoration: 'underline', wordBreak: 'break-all' }}
                                >
                                  {highlightFieldWithMatches(instance.m_id, part._matches?.m_id)}
                                </a>
                              ) : (
                                highlightFieldWithMatches('N/A', part._matches?.m_id)
                              )}
                            </div>
                          )}
                          {!hiddenFields.serialNumber && <div>{highlightFieldWithMatches(instance.m_serial_number || instance.m_name || 'N/A', part._matches?.m_serial_number)}</div>}
                          {!hiddenFields.quantity && <div>{highlightFieldWithMatches((instance.m_quantity ?? 'N/A').toString(), part._matches?.m_quantity)}</div>}
                          {!hiddenFields.inventoryMaturity && <div>{highlightFieldWithMatches(instance.m_maturity || 'N/A', part._matches?.m_maturity)}</div>}
                          {!hiddenFields.associatedProject && <div>{highlightFieldWithMatches((instance.m_project?.keyed_name || instance.associated_project || 'N/A').toString(), part._matches?.m_project)}</div>}
                          {!hiddenFields.hardwareCustodian && <div>{highlightFieldWithMatches(instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A', part._matches?.m_custodian)}</div>}
                          {!hiddenFields.parentPath && <div>{highlightFieldWithMatches(instance.m_parent_ref_path || 'N/A', part._matches?.m_parent_ref_path)}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {expandedValue && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} onClick={handleClose}>
              <div style={{
                background: '#fff',
                padding: '24px 32px',
                borderRadius: 8,
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                minWidth: 320,
                maxWidth: '80vw',
                wordBreak: 'break-all',
                position: 'relative',
                cursor: 'auto'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{expandedLabel}</div>
                <textarea
                  value={expandedValue}
                  readOnly
                  style={{ width: '100%', minHeight: 60, fontSize: 15, padding: 8, borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                  onFocus={e => e.target.select()}
                />
                <button style={{ marginTop: 12, float: 'right' }} onClick={handleClose}>Close</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

export default PartsTable;
