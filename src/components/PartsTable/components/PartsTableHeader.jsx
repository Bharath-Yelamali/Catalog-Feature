import React, { useState } from 'react';
import { HideFieldsButton, FilterButton } from '../../SearchBarLogic';
import { GlobalSearchBar } from '../../SearchBarLogic/components/GlobalSearchBar';
import downloadIcon from '../../../assets/download.svg';
import nextIcon from '../../../assets/next.svg';
import chatIcon from '../../../assets/chat.svg'; // Add chat icon import
import infoIcon from '../../../assets/info.svg';

const PartsTableHeader = ({
  // HideFieldsButton props
  hiddenFieldCount, hideFieldsDropdownOpen, setHideFieldsDropdownOpen, filteredFields, hiddenFields, toggleFieldVisibility, fieldSearchQuery, setFieldSearchQuery, setHiddenFields, allFields,
  // FilterButton props
  activeFilterCount, filterDropdownOpen, setFilterDropdownOpen, filterConditions, setFilterConditions, inputValues, setInputValues, hasUnprocessedChanges, setHasUnprocessedChanges, logicalOperator, setLogicalOperator, draggedCondition, dragHoverTarget, handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleDragEnd, searchableFields,
  // GlobalSearchBar props
  localSearch, setLocalSearch, setGlobalSearchResults, accessToken, onGlobalSearchConditionsChange,
  // Other
  loading, resultsToDisplay, selected, quantities, handleExport, setPage,
  chatOpen, setChatOpen,
  onClearSearch // <-- Add onClearSearch prop
}) => {
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);

  return (
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
          <button
            className="clear-search-btn"
            style={{
              marginLeft: 0,
              background: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#333',
              fontSize: 13,
              minWidth: 0,
              minHeight: 30,
              transition: 'background 0.2s, color 0.2s'
              
              
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#9a9a9aff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffffff';
              e.currentTarget.style.color = '#000000ff';
            }}
            onClick={onClearSearch}
            title="Clear all search and filters"
            aria-label="Clear all search and filters"
          >
            Clear
          </button>
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
          <button
            className="surplus-request-btn"
            style={{
              marginLeft: 12,
              background: '#ffffffff',
              border: 'none', // Remove border
              borderRadius: 0, // Not rounded
              padding: '10px 32px', // Comfortable rectangular shape
              cursor: 'pointer',
              fontWeight: 500,
              color: '#000000ff',
              fontSize: 15,
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#9a9a9aff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffffff';
              e.currentTarget.style.color = '#000000ff';
            }}
            onClick={() => window.open('https://dev.azure.com/CHIELabs/CHIE%20Labs/_workitems/create/Lab%20Task', '_blank')}
            title="Request surplus parts"
            aria-label="Request surplus parts"
          >
            Request surplus parts?
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={infoIcon}
              alt="Info"
              style={{ width: 22, height: 22, marginLeft: 8, verticalAlign: 'middle', cursor: 'pointer' }}
              onMouseEnter={() => setInfoDropdownOpen(true)}
              onMouseLeave={() => setTimeout(() => setInfoDropdownOpen(false), 200)}
            />
            {infoDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 30,
                  left: 0,
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  padding: '6px 10px',
                  minWidth: 220,
                  zIndex: 100,
                  color: '#222',
                  fontSize: 12,
                  fontWeight: 400,
                  borderRadius: 0,
                  border: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={() => setInfoDropdownOpen(true)}
                onMouseLeave={() => setInfoDropdownOpen(false)}
              >
                Click the link to request usable surplus values and check if they're available and ready for pickup.
              </div>
            )}
          </div>
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
          onClick={() => setChatOpen(prev => !prev)}
          title={chatOpen ? 'Close Copilot Chat' : 'Open Copilot Chat'}
          aria-label={chatOpen ? 'Close Copilot Chat' : 'Open Copilot Chat'}
        >
          <img src={chatIcon} alt="Chat" style={{ width: 28, height: 28 }} />
          <span style={{ marginLeft: 6, fontSize: 15, fontWeight: 500, color: '#222' }}>
            Chat
          </span>
        </button>
      </div>
    </div>
  );
};

export default PartsTableHeader;
