import React, { useState, useEffect, useCallback, useRef } from 'react';
import { updateSpareValue, fetchPartsByFields } from '../../../api/parts';
import { searchableFields } from '../../SearchBarLogic/constants';
import { useFieldManagement, useFilterManagement, useSearchUtilities } from '../../SearchBarLogic';
import personIcon from '../../../assets/person.svg';
import * as XLSX from 'xlsx';
import PartsTableHeader from './PartsTableHeader';
import PartsTableMainRow from './PartsTableMainRow';
import Chatbox from '../../chatbox/chatbox';
import '../../../styles/ChatBox.css';
import InstanceSection from './InstanceSection';

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
  // State for filtering instances by inventory maturity
  const [maturityFilter, setMaturityFilter] = useState({}); // { [itemNumber]: maturityValue }
  const [openMaturityDropdown, setOpenMaturityDropdown] = useState({}); // { [itemNumber]: boolean }
  // State for filtering instances by hardware custodian
  const [custodianFilter, setCustodianFilter] = useState({}); // { [itemNumber]: custodianValue }
  const [openCustodianDropdown, setOpenCustodianDropdown] = useState({}); // { [itemNumber]: boolean }
  // Add state for open parent path dropdown
  const [openParentPathDropdown, setOpenParentPathDropdown] = useState({}); // { [itemNumber]: boolean }
  const [parentPathFilter, setParentPathFilter] = useState({}); // { [itemNumber]: parentPathSection }

  // 1. Add state to track the order in which instances are checked
  const [instanceSelectionOrder, setInstanceSelectionOrder] = useState([]); // array of instance ids in order of selection
  const [chatOpen, setChatOpen] = useState(false);

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

  // Export handler for checked items
  const handleExport = () => {
    const checkedGroups = Object.entries(selected);
    if (!checkedGroups.length) return;
    const exportRows = checkedGroups.flatMap(([itemNumber, group]) => {
      const qty = quantities[itemNumber] || '';
      if (Array.isArray(group.instances)) {
        return group.instances.map(instance => ({ ...instance, __exportQty: qty }));
      } else {
        return [{ ...group, __exportQty: qty }];
      }
    });
    const data = exportRows.map(row => ({
      'Qty': row.__exportQty ?? '',
      'Total': row.total ?? 'N/A',
      'In Use': row.inUse ?? 'N/A',
      'Spare': row.spare ?? 'N/A',
      'Inventory Item Number': row.m_inventory_item?.item_number ?? 'N/A',
      'Serial Number/Name': row.m_serial_number ?? row.m_name ?? 'N/A',
      'Inventory Maturity': row.m_inventory_maturity ?? 'N/A',
      'Manufacturer Part #': row.m_mfg_part_number ?? 'N/A',
      'Manufacturer Name': row.m_mfg_name ?? 'N/A',
      'Hardware Custodian': row.m_hardware_custodian?.keyed_name ?? row.m_hardware_custodian?.id ?? 'N/A',
      'Parent Path': row.m_parent_path ?? 'N/A',
      'Inventory Description': row.m_inventory_description ?? row.m_description ?? 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(data, { header: [
      'Qty', 'Total', 'In Use', 'Spare', 'Inventory Item Number', 'Serial Number/Name', 'Inventory Maturity',
      'Manufacturer Part #', 'Manufacturer Name', 'Hardware Custodian', 'Parent Path', 'Inventory Description'] });
    ws['!cols'] = [
      { wch: 6 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 32 },
    ];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Parts');
    XLSX.writeFile(wb, `selected_parts_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <>
      <Chatbox open={chatOpen} onClose={() => setChatOpen(false)} />
      {/* Button/Action header positioned against taskbar */}
      <PartsTableHeader
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
        setDraggedCondition={setDraggedCondition}
        dragHoverTarget={dragHoverTarget}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleDragEnd={handleDragEnd}
        searchableFields={searchableFields}
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
        setGlobalSearchResults={setGlobalSearchResults}
        accessToken={accessToken}
        loading={loading}
        resultsToDisplay={resultsToDisplay}
        selected={selected}
        quantities={quantities}
        handleExport={handleExport}
        setPage={setPage}
        onGlobalSearchConditionsChange={({ conditions, logicalOperator }) => {
          setFilterConditions(conditions || []);
          setLogicalOperator(logicalOperator || 'or');
          setHasUnprocessedChanges(true); // trigger filter search in useFilterManagement
          // Sync inputValues with new global search conditions
          const newInputValues = {};
          (conditions || []).forEach((cond, idx) => {
            newInputValues[idx] = cond.value;
          });
          setInputValues(newInputValues);
        }}
        onOpenChat={() => setChatOpen(true)}
      />
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
          <div className="search-results-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, color: '#64748b', fontSize: 18 }}>
            <img src={personIcon} alt="Person" style={{ width: 180, height: 180, marginBottom: 22, opacity: 0.7 }} />
            {results.length === 0 && localSearch.trim() === ''
              ? 'Input a search to get started.'
              : 'No parts match the current filters.'}
          </div>
        ) : (
          <>
          {resultsToDisplay.map(group => {
            const part = group.instances[0];
            const spareThreshold = part.spare_value == null ? 0 : part.spare_value;
            const total = part.total == null ? 0 : part.total;
            const inUse = part.inUse == null ? 0 : part.inUse;
            const generalInventoryAmount = total - inUse;
            const essentialReserve = Math.ceil(spareThreshold * inUse);
            const usableSurplus = generalInventoryAmount - essentialReserve;
            return (
              <div key={group.itemNumber}>
                <PartsTableMainRow
                  group={group}
                  part={{
                    ...part,
                    essentialReserve,
                    usableSurplus,
                  }}
                  hiddenFields={hiddenFields}
                  selected={selected}
                  setSelected={setSelected}
                  quantities={quantities}
                  setQuantities={setQuantities}
                  handleCheckboxChange={handleCheckboxChange}
                  handleQuantityChange={handleQuantityChange}
                  handleExpandToggle={handleExpandToggle}
                  expanded={!!expandedRows[group.itemNumber]}
                  getMainTableGridColumns={getMainTableGridColumns}
                  truncateText={truncateText}
                  highlightFieldWithMatches={highlightFieldWithMatches}
                  setExpandedValue={setExpandedValue}
                  setExpandedLabel={setExpandedLabel}
                />
                {expandedRows[group.itemNumber] && (
                  <InstanceSection
                    group={group}
                    part={part}
                    isAdmin={isAdmin}
                    hiddenFields={hiddenFields}
                    generalInventoryFilter={generalInventoryFilter}
                    setGeneralInventoryFilter={setGeneralInventoryFilter}
                    spareFeedback={spareFeedback}
                    setSpareFeedback={setSpareFeedback}
                    requestedInstances={requestedInstances}
                    setRequestedInstances={setRequestedInstances}
                    instanceSelectionOrder={instanceSelectionOrder}
                    setInstanceSelectionOrder={setInstanceSelectionOrder}
                    projectFilter={projectFilter}
                    setProjectFilter={setProjectFilter}
                    openProjectDropdown={openProjectDropdown}
                    setOpenProjectDropdown={setOpenProjectDropdown}
                    maturityFilter={maturityFilter}
                    setMaturityFilter={setMaturityFilter}
                    openMaturityDropdown={openMaturityDropdown}
                    setOpenMaturityDropdown={setOpenMaturityDropdown}
                    custodianFilter={custodianFilter}
                    setCustodianFilter={setCustodianFilter}
                    openCustodianDropdown={openCustodianDropdown}
                    setOpenCustodianDropdown={setOpenCustodianDropdown}
                    parentPathFilter={parentPathFilter}
                    setParentPathFilter={setParentPathFilter}
                    openParentPathDropdown={openParentPathDropdown}
                    setOpenParentPathDropdown={setOpenParentPathDropdown}
                    accessToken={accessToken}
                    setRequestPopup={setRequestPopup}
                    getInstanceTableGridColumns={getInstanceTableGridColumns}
                    highlightFieldWithMatches={highlightFieldWithMatches}
                    usableSurplus={usableSurplus}
                    updateSpareValue={updateSpareValue}
                  />
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
