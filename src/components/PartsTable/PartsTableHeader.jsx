/**
 * PartsTableHeader Component
 * -------------------------
 * Renders the header section for the parts table, including controls for field visibility, filtering, search, export, navigation, and chat.
 *
 * Features:
 * - Field visibility management (HideFieldsButton)
 * - Advanced filtering (FilterButton)
 * - Global search bar
 * - Export, navigation, and chat controls
 * - Info tooltip and surplus request link
 *
 * @fileoverview Header row for the main parts table UI, with all action controls.
 * @author Bharath Yelamali
 */
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HideFieldsButton, FilterButton } from '../SearchBarLogic';
import { GlobalSearchBar } from '../SearchBarLogic/components/GlobalSearchBar';
import downloadIcon from '../../assets/download.svg';
import nextIcon from '../../assets/next.svg';
import chatIcon from '../../assets/chat.svg';
import infoIcon from '../../assets/info.svg';
import alertIcon from '../../assets/alert.svg';


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
  onClearSearch,
  onShowLowParts
}) => {
  // State for info tooltip dropdown
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const infoIconRef = useRef(null);

  // Debug: Log when component mounts and onShowLowParts prop
  React.useEffect(() => {
    console.log('[PartsTableHeader] Mounted. onShowLowParts:', typeof onShowLowParts);
  }, [onShowLowParts]);

  // Show tooltip and calculate position
  const handleInfoMouseEnter = () => {
    if (infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 6, // 6px below the icon
        left: rect.left,
      });
    }
    setInfoDropdownOpen(true);
  };

  // Hide tooltip
  const handleInfoMouseLeave = () => {
    setTimeout(() => setInfoDropdownOpen(false), 200);
  };

  return (
    <div className="search-result-button-header">
      <div className="flex-start">
        {/* Field visibility management */}
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
        {/* Advanced filtering */}
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
        <div className="header-flex-group">
          {/* Global search bar */}
          <GlobalSearchBar
            value={localSearch}
            setInputValue={setLocalSearch}
            setResults={setGlobalSearchResults}
            accessToken={accessToken}
            onGlobalSearchConditionsChange={onGlobalSearchConditionsChange}
          />
          {/* Clear search and filters button */}
          <button
            className="clear-search-btn header-btn"
            onClick={onClearSearch}
            title="Clear all search and filters"
            aria-label="Clear all search and filters"
          >
            Clear
          </button>
          {/* Item count and loading spinner */}
          <span className="item-count-text">
            {loading ? (
              <span className="default-react-spinner">
                <svg width="20" height="20" viewBox="0 0 50 50">
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
          {/* Low Parts button */}
          <button
            className="low-parts-btn header-btn compact-btn"
            onClick={() => {
              if (typeof onShowLowParts === 'function') {
                onShowLowParts();
              } else {
                alert('Low parts view not implemented.');
              }
            }}
            title="Show all parts that are low/out of stock"
            aria-label="Show all parts that are low/out of stock"
            style={{ padding: '2px 8px', fontSize: '0.95em', minWidth: 'unset', height: '32px', lineHeight: '28px' }}
          >
            <img src={alertIcon} alt="Low Parts" style={{ width: 18, height: 18, marginRight: 4, verticalAlign: 'middle' }} />
            <span style={{ verticalAlign: 'middle' }}>Low Parts</span>
          </button>
          {/* Surplus request button */}
          <button
            className="surplus-request-btn header-btn compact-btn"
            onClick={() => window.open('https://dev.azure.com/CHIELabs/CHIE%20Labs/_workitems/create/Lab%20Task', '_blank')}
            title="Create ADO Request Ticket For Surplus"
            aria-label="Create ADO Request Ticket For Surplus"
            style={{ padding: '2px 8px', fontSize: '0.95em', minWidth: 'unset', height: '32px', lineHeight: '28px' }}
          >
            ADO Request for Surplus
          </button>
          {/* Info tooltip for surplus request */}
          <div className="info-dropdown-container">
            <img
              ref={infoIconRef}
              src={infoIcon}
              alt="Info"
              className="info-icon"
              onMouseEnter={handleInfoMouseEnter}
              onMouseLeave={handleInfoMouseLeave}
            />
            {infoDropdownOpen && createPortal(
              <div
                className="info-dropdown"
                style={{
                  position: 'fixed',
                  top: tooltipPosition.top,
                  left: tooltipPosition.left,
                  zIndex: 3000,
                }}
                onMouseEnter={() => setInfoDropdownOpen(true)}
                onMouseLeave={() => setInfoDropdownOpen(false)}
              >
                Click the link to request usable surplus values and check if they're available and ready for pickup.
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
      <div className="flex-end">
        {/* Export selected parts button */}
        <button
          className="download-export-btn header-btn"
          onClick={Object.keys(selected).length === 0 ? undefined : handleExport}
          disabled={Object.keys(selected).length === 0}
          title="Export selected parts"
          aria-label="Export selected parts"
        >
          <img src={downloadIcon} alt="Download" className="header-btn-icon" />
        </button>
        {/* Next page button (proceed to required fields) */}
        <button
          className="next-btn header-btn"
          onClick={
            (Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== ''))
              ? undefined
              : () => setPage('requiredFields')
          }
          disabled={Object.keys(selected).length === 0 || !Object.keys(selected).every(id => quantities[id] && quantities[id].trim() !== '')}
          title="Proceed to required fields"
          aria-label="Proceed to required fields"
        >
          <img src={nextIcon} alt="Next" className="header-btn-icon" />
          <span className="header-btn-label">
            Next Page
          </span>
        </button>
        {/* Chat button to open/close Copilot chat */}
        <button
          className="chat-btn header-btn"
          onClick={() => setChatOpen(prev => !prev)}
          title={chatOpen ? 'Close Copilot Chat' : 'Open Copilot Chat'}
          aria-label={chatOpen ? 'Close Copilot Chat' : 'Open Copilot Chat'}
        >
          <img src={chatIcon} alt="Chat" className="header-btn-icon" />
          <span className="header-btn-label">
            Chat
          </span>
        </button>
      </div>
    </div>
  );
};

export default PartsTableHeader;
