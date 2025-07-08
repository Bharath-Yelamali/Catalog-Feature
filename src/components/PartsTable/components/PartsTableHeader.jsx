import React from 'react';
import { HideFieldsButton, FilterButton } from '../../SearchBarLogic';
import { GlobalSearchBar } from '../../SearchBarLogic/components/GlobalSearchBar';
import downloadIcon from '../../../assets/download.svg';
import nextIcon from '../../../assets/next.svg';
import chatIcon from '../../../assets/chat.svg'; // Add chat icon import

const PartsTableHeader = ({
  // HideFieldsButton props
  hiddenFieldCount, hideFieldsDropdownOpen, setHideFieldsDropdownOpen, filteredFields, hiddenFields, toggleFieldVisibility, fieldSearchQuery, setFieldSearchQuery, setHiddenFields, allFields,
  // FilterButton props
  activeFilterCount, filterDropdownOpen, setFilterDropdownOpen, filterConditions, setFilterConditions, inputValues, setInputValues, hasUnprocessedChanges, setHasUnprocessedChanges, logicalOperator, setLogicalOperator, draggedCondition, dragHoverTarget, handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleDragEnd, searchableFields,
  // GlobalSearchBar props
  localSearch, setLocalSearch, setGlobalSearchResults, accessToken, onGlobalSearchConditionsChange,
  // Other
  loading, resultsToDisplay, selected, quantities, handleExport, setPage,
  onOpenChat // <-- Add this prop
}) => (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GlobalSearchBar
          value={localSearch}
          setInputValue={setLocalSearch}
          setResults={setGlobalSearchResults}
          accessToken={accessToken}
          onGlobalSearchConditionsChange={onGlobalSearchConditionsChange}
        />
        <span className="item-count-text" style={{ marginLeft: 8 }}>
          {loading ? (
            <span className="default-react-spinner" style={{ display: 'inline-block', width: 20, height: 20, verticalAlign: 'middle' }}>
              <svg width="20" height="20" viewBox="0 0 50 50" style={{ display: 'block' }}>
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
    </div>
    <div className="flex-end">
      <button
        className="download-export-btn"
        style={{
          marginLeft: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: Object.keys(selected).length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          opacity: Object.keys(selected).length === 0 ? 0.5 : 1
        }}
        onClick={Object.keys(selected).length === 0 ? undefined : handleExport}
        disabled={Object.keys(selected).length === 0}
        title="Export selected parts"
        aria-label="Export selected parts"
      >
        <img src={downloadIcon} alt="Download" style={{ width: 28, height: 28 }} />
      </button>
      <button
        className="next-btn"
        style={{
          marginLeft: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: (Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== '')) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          opacity: (Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== '')) ? 0.5 : 1
        }}
        onClick={
          (Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== ''))
            ? undefined
            : () => setPage('requiredFields')
        }
        disabled={Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== '')}
        title="Proceed to required fields"
        aria-label="Proceed to required fields"
      >
        <img src={nextIcon} alt="Next" style={{ width: 28, height: 28 }} />
        <span style={{ marginLeft: 6, fontSize: 15, fontWeight: 500, color: '#222' }}>
          Next Page
        </span>
      </button>
      <button
        className="chat-btn"
        style={{
          marginLeft: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={onOpenChat}
        title="Open Copilot Chat"
        aria-label="Open Copilot Chat"
      >
        <img src={chatIcon} alt="Chat" style={{ width: 28, height: 28 }} />
        <span style={{ marginLeft: 6, fontSize: 15, fontWeight: 500, color: '#222' }}>
          Chat
        </span>
      </button>
    </div>
  </div>
);

export default PartsTableHeader;
