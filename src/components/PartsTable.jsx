import React, { useState, useEffect, useCallback, useRef } from 'react';
import { updateSpareValue, fetchPartsByFields } from '../api/parts';
import { searchableFields } from './SearchBarLogic/constants';
import { useFieldManagement, useFilterManagement, HideFieldsButton, FilterButton, useSearchUtilities } from './SearchBarLogic';
import { GlobalSearchBar } from './SearchBarLogic/components/GlobalSearchBar';

// Utility to get visible fields (not hidden)
function getVisibleFields(allFields, hiddenFields) {
  // allFields: array of field objects or strings
  // hiddenFields: object with field keys as keys and true/false as values
  // If allFields is array of objects, use .key
  if (allFields.length > 0 && typeof allFields[0] === 'object') {
    return allFields.filter(field => !hiddenFields[field.key]).map(field => field.key);
  }
  // If allFields is array of strings
  return allFields.filter(field => !hiddenFields[field]);
}

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '', setSearch, setPage, isAdmin, accessToken, requestPopup, setRequestPopup, onFilterSearch, loading, spinner }) {
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

  // Use field management hook
  const {
    hideFieldsDropdownOpen,
    setHideFieldsDropdownOpen,
    hiddenFields,
    setHiddenFields,
    fieldSearchQuery,
    setFieldSearchQuery,
    filteredFields,
    hiddenFieldCount,
    toggleFieldVisibility,
    getMainTableGridColumns,
    getInstanceTableGridColumns,
    allFields
  } = useFieldManagement();

  // Use filter management hook
  const {
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
    activeFilterCount,
    applyFilters,
    matchesCondition,
    convertFilterConditionsToChips,
    triggerFilterSearch,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    searchableFields
  } = useFilterManagement(results, onFilterSearch);

  // Use search utilities hook
  const { highlightFieldWithMatches, truncateText } = useSearchUtilities();

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

  // Add local state for global search if not provided
  const [localSearch, setLocalSearch] = useState(typeof search === 'string' ? search : '');
  // Add state for global search results (overrides filteredResults when searching)
  const [globalSearchResults, setGlobalSearchResults] = useState(null);

  // Helper: which results to display
  const resultsToDisplay = globalSearchResults !== null ? globalSearchResults : displayGroups;
  const isEmpty = (globalSearchResults !== null ? globalSearchResults.length : filteredResults.length) === 0;

  // Get currently visible fields (not hidden)
  const visibleFields = getVisibleFields(allFields, hiddenFields);

  return (
    <>
      {/* Button/Action header positioned against taskbar */}
      <div className="search-result-button-header">
        <div className="flex-start">
            <HideFieldsButton
              hiddenFieldCount={hiddenFieldCount}
              hideFieldsDropdownOpen={hideFieldsDropdownOpen}
              setHideFieldsDropdownOpen={setHideFieldsDropdownOpen}
              filteredFields={filteredFields}
              hiddenFields={hiddenFields}
              toggleFieldVisibility={toggleFieldVisibility}
              fieldSearchQuery={fieldSearchQuery}
              setFieldSearchQuery={setFieldSearchQuery}
              setHiddenFields={setHiddenFields}
              allFields={allFields}
            />
            <FilterButton
              activeFilterCount={activeFilterCount}
              filterDropdownOpen={filterDropdownOpen}
              setFilterDropdownOpen={setFilterDropdownOpen}
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
            {/* Global Search Bar */}
            <GlobalSearchBar
              value={localSearch}
              setResults={results => {
                setGlobalSearchResults(results === null || (Array.isArray(results) && results.length === 0 && localSearch.trim() === '') ? null : results);
                // Keep localSearch in sync with input
                // (GlobalSearchBar should call a prop to update localSearch on every keystroke)
              }}
              accessToken={accessToken}
              setInputValue={setLocalSearch}
            />
            <span className="item-count-text" style={{ marginLeft: 16 }}>
              {loading ? (
                <span className="default-react-spinner" style={{ display: 'inline-block', width: 20, height: 20, verticalAlign: 'middle' }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 50 50"
                    style={{ display: 'block' }}
                  >
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="31.415, 31.415"
                      transform="rotate(0 25 25)"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 25 25"
                        to="360 25 25"
                        dur="0.8s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                </span>
              ) : (
                `${resultsToDisplay.length} items`
              )}
            </span>
        </div>
        {/* Right side - could add export button, etc. */}
      </div>
      
      {/* Column header positioned below button header */}
      <div className="search-result-item search-result-header main-table-row" style={{ gridTemplateColumns: getMainTableGridColumns() }}>
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
        {isEmpty ? (
          <div className="search-results-empty">
            {results.length === 0 ? 'No parts found.' : 'No parts match the current filters.'}
          </div>
        ) : (
          <>
          {resultsToDisplay.map(group => {
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
                <div className="search-result-item main-table-row" style={{ gridTemplateColumns: getMainTableGridColumns() }}>
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
                        className="quantity-input quantity-input-table"
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
                        aria-label="Quantity"
                      />
                    </div>
                  )}
                  <div className="search-result-field">
                    <button onClick={() => handleExpandToggle(group.itemNumber)} aria-label="Expand details" className="expand-button">
                      {expandedRows[group.itemNumber] ? '▲' : '▼'}
                    </button>
                  </div>
                  {!hiddenFields.total && <div className="search-result-field">{truncateText(part.total?.toString()) ?? 'N/A'}</div>}
                  {!hiddenFields.inUse && <div className="search-result-field">{truncateText(part.inUse?.toString()) ?? 'N/A'}</div>}
                  {!hiddenFields.essentialReserve && <div className="search-result-field">{truncateText(essentialReserve.toString())}</div>}
                  {!hiddenFields.usableSurplus && (
                    <div className={`search-result-field ${usableSurplus > 0 ? 'usable-surplus-positive' : ''}`}>
                      {truncateText(usableSurplus.toString())}
                    </div>
                  )}
                  {!hiddenFields.inventoryItemNumber && <div className={`search-result-field ${part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={() => handleCellClick('Inventory Item Number', part.m_inventory_item?.item_number)}>{highlightFieldWithMatches(truncateText(part.m_inventory_item?.item_number ?? 'N/A'), part._matches?.m_inventory_item)}</div>}
                  {!hiddenFields.manufacturerPartNumber && <div className={`search-result-field ${part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={() => handleCellClick('Manufacturer Part #', part.m_mfg_part_number)}>{highlightFieldWithMatches(truncateText(part.m_mfg_part_number ?? 'N/A'), part._matches?.m_mfg_part_number)}</div>}
                  {!hiddenFields.manufacturerName && <div className={`search-result-field ${part.m_mfg_name && part.m_mfg_name.length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={() => handleCellClick('Manufacturer Name', part.m_mfg_name)}>{highlightFieldWithMatches(truncateText(part.m_mfg_name ?? 'N/A'), part._matches?.m_mfg_name)}</div>}
                  {!hiddenFields.inventoryDescription && <div className={`search-result-field ${(part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'table-cell--clickable' : 'table-cell--default-cursor'}`} onClick={() => handleCellClick('Inventory Description', part.m_inventory_description || part.m_description)}>{highlightFieldWithMatches(truncateText((part.m_inventory_description ?? part.m_description) ?? 'N/A'), part._matches?.m_inventory_description || part._matches?.m_description)}</div>}
                </div>
                {expandedRows[group.itemNumber] && (
                  <div className="instance-section">
                    <div className="instance-header">
                      <span className="instance-header-title">Instances:</span>
                    </div>
                    {isAdmin && (
                      <div className="spare-threshold-section">
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
                          className="spare-threshold-input"
                          aria-label="Edit spare threshold for this item"
                        />
                      </div>
                    )}
                    <div className="instance-grid-header" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
                      <div className="request-button-container">
                        <button
                          type="button"
                          className="request-button"
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
                        <span className="checked-quantity-display">
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
                      {!hiddenFields.instanceId && <div className="table-cell">Instance ID</div>}
                      {!hiddenFields.serialNumber && <div className="table-cell">Serial Number/Name</div>}
                      {!hiddenFields.quantity && <div className="table-cell">Quantity</div>}
                      {!hiddenFields.inventoryMaturity && <div className="table-cell">Inventory Maturity</div>}
                      {!hiddenFields.associatedProject && (
                        <div className="column-header-dropdown">
                          <span
                            className="column-header-dropdown-trigger"
                            aria-label="Filter by associated project"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                            }}
                            onBlur={e => {
                              // Optionally close dropdown on blur
                            }}                            >
                            Associated Project
                            <span className="column-header-dropdown-arrow">▼</span>
                          </span>
                          {openProjectDropdown[group.itemNumber] && (
                            <div
                              className="filter-dropdown-container"
                              tabIndex={0}
                              onBlur={() => setOpenProjectDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                            >
                              <div
                                className={`filter-dropdown-item ${!projectFilter[group.itemNumber] ? 'filter-dropdown-item--selected' : ''}`}
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
                                    className={`filter-dropdown-item ${projectFilter[group.itemNumber] === project ? 'filter-dropdown-item--selected' : ''}`}
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
                      {!hiddenFields.hardwareCustodian && <div className="table-cell">Hardware Custodian</div>}
                      {!hiddenFields.parentPath && (
                        <div className="column-header-dropdown">
                          <span
                            className="column-header-dropdown-trigger"
                            aria-label="Filter by parent path section"
                            tabIndex={0}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: !prev[group.itemNumber] }));
                            }}
                            onBlur={e => {
                              // Optionally close dropdown on blur
                            }}                            >
                            Parent Path
                            <span className="column-header-dropdown-arrow">▼</span>
                          </span>
                          {openParentPathDropdown[group.itemNumber] && (
                            <div
                              className="filter-dropdown-container"
                              tabIndex={0}
                              onBlur={() => setOpenParentPathDropdown(prev => ({ ...prev, [group.itemNumber]: false }))}
                            >
                              <div
                                className={`filter-dropdown-item ${!parentPathFilter[group.itemNumber] ? 'filter-dropdown-item--selected' : ''}`}
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
                                    className={`filter-dropdown-item ${parentPathFilter[group.itemNumber] === section ? 'filter-dropdown-item--selected' : ''}`}
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
                    <div className="instance-grid-spacer" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
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
                        <div key={instance.id + instance.m_id + instance.item_number + instance.m_maturity + (instance["m_custodian@aras.keyed_name"] || instance.m_custodian) + instance.m_parent_ref_path} className="instance-table-row" style={{ gridTemplateColumns: getInstanceTableGridColumns() }}>
                          <div className="instance-checkbox">
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
                                  className="instance-link"
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
            <div className="expanded-modal-overlay" onClick={handleClose}>
              <div className="expanded-modal-content" onClick={e => e.stopPropagation()}>
                <div className="expanded-modal-header">{expandedLabel}</div>
                <textarea
                  value={expandedValue}
                  readOnly
                  className="expanded-modal-textarea"
                  onFocus={e => e.target.select()}
                />
                <button className="expanded-modal-close-btn" onClick={handleClose}>Close</button>
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
