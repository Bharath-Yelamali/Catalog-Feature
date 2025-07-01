import React, { useState, useRef } from 'react';

function SearchBar({ search, setSearch, handleSearch, resultCount }) {
  const [searchMethod, setSearchMethod] = useState('searchAll');
  const [hoveredFieldIdx, setHoveredFieldIdx] = useState(-1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const summaryBoxRef = useRef();
  const tooltipRef = useRef();
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

  const fieldOptions = [
    { label: 'Inventory Item Number', value: 'm_inventory_item' },
    { label: 'Manufacturer Part Number', value: 'm_mfg_part_number' },
    { label: 'Manufacturer Name', value: 'm_mfg_name' },
    { label: 'Parent Path', value: 'm_parent_ref_path' },
    { label: 'Inventory Description', value: 'm_inventory_description' },
    { label: 'Custodian (Keyed Name)', value: 'm_custodian@aras.keyed_name' },
    { label: 'Instance ID', value: 'm_id' },
    { label: 'Associated Project', value: 'item_number' },
  ];
  // For specify search
  const [inputValue, setInputValue] = useState('');
  const [chips, setChips] = useState([]); // [{ field, value }]
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const inputRef = useRef();

  // Always show all fields (no filtering/highlighting)
  const filteredFields = fieldOptions;

  const handleInputChange = e => {
    setInputValue(e.target.value);
    setShowFieldDropdown(true);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() !== '') setShowFieldDropdown(true);
  };

  const handleFieldSelect = field => {
    if (inputValue.trim() === '') return;
    setChips(prev => [...prev, { field, value: inputValue }]);
    setInputValue('');
    setShowFieldDropdown(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleChipRemove = idx => {
    setChips(prev => prev.filter((_, i) => i !== idx));
  };

  const handleInputKeyDown = e => {
    if (e.key === 'Backspace' && inputValue === '' && chips.length > 0) {
      setChips(prev => prev.slice(0, -1));
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      setShowFieldDropdown(true);
    }
    if (e.key === 'Enter') {
      handleSpecifySearch();
    }
  };

  // Handle search for specify search mode
  const handleSpecifySearch = () => {
    if (searchMethod === 'specifySearch') {
      if (chips.length === 0 && inputValue.trim() === '') {
        return; // Don't search if no chips and no current input
      }
      
      // If there's current input value, add it as a chip first
      let finalChips = chips;
      if (inputValue.trim() !== '' && showFieldDropdown && filteredFields.length > 0) {
        // Auto-select first field if user presses enter with text but no field selected
        finalChips = [...chips, { field: filteredFields[0].value, value: inputValue }];
        setChips(finalChips);
        setInputValue('');
        setShowFieldDropdown(false);
      }
      
      // Pass search mode and data to parent
      handleSearch({ 
        searchMode: 'specifySearch', 
        searchData: finalChips,
        key: 'Enter' 
      });
    }
  };

  // Attach chip delete handler for tooltip (for Specify Search mode)
  React.useEffect(() => {
    window.__reactDeleteChip = idx => {
      setChips(prev => prev.filter((_, i) => i !== idx));
    };
    return () => {
      if (window.__reactDeleteChip) delete window.__reactDeleteChip;
    };
  }, [chips]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFieldDropdown && inputRef.current && !inputRef.current.closest('.searchbar-controls').contains(event.target)) {
        setShowFieldDropdown(false);
      }
    };

    if (showFieldDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFieldDropdown]);

  // Position tooltip below summary box
  const handleSummaryBoxMouseEnter = e => {
    if (chips.length > 0) {
      const rect = summaryBoxRef.current.getBoundingClientRect();
      setTooltipPos({ left: rect.left, top: rect.bottom + 4 });
      setShowTooltip(true);
    }
  };
  const handleSummaryBoxMouseLeave = e => {
    // Delay hiding to allow moving to tooltip
    setTimeout(() => {
      if (!tooltipRef.current?.matches(':hover')) setShowTooltip(false);
    }, 80);
  };
  const handleTooltipMouseLeave = () => setShowTooltip(false);

  return (
    <div className="searchbar-container searchbar-row" style={{ zIndex: searchMethod === 'specifySearch' ? 1 : 'auto' }}>
      <div className="searchbar-main">
        <div className="searchbar-controls" style={{ gap: 0, display: 'flex', alignItems: 'center', columnGap: 0, rowGap: 0 }}>
          <select
            style={{
              marginRight: 0,
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #bcd6f7',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              width: 160,
              minWidth: 160,
              maxWidth: 160,
              boxSizing: 'border-box',
            }}
            aria-label="Select search method"
            tabIndex={0}
            value={searchMethod}
            onChange={e => setSearchMethod(e.target.value)}
          >
            <option value="searchAll">Search All</option>
            <option value="specifySearch">Specify Search</option>
          </select>
          {searchMethod === 'searchAll' ? (
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => handleSearch({ searchMode: 'searchAll', searchData: search, key: e.key })}
              placeholder="Search parts..."
              className="searchbar-input"
              style={{ margin: 0, padding: '6px 14px', borderRadius: 6, border: '1px solid #bcd6f7', fontSize: 16, width: 1100, background: '#fff', boxSizing: 'border-box' }}
            />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flexWrap: 'nowrap', position: 'relative', gap: 8, width: '100%' }}>
                {/* Input text box */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleInputKeyDown}
                    placeholder={chips.length === 0 ? "Type value, then select field..." : "Add another..."}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #bcd6f7', fontSize: 16, width: 450, marginRight: 0, zIndex: 1, background: '#fff', boxSizing: 'border-box' }}
                    autoComplete="off"
                  />
                  {showFieldDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #bcd6f7', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.16)', zIndex: 9999, width: 500, boxSizing: 'border-box', maxHeight: 'none', overflowY: 'visible', marginTop: 2, padding: '0 14px' }}>
                      {filteredFields.map((opt, idx) => (
                        <div
                          key={opt.value}
                          style={{
                            padding: '8px 0',
                            cursor: 'pointer',
                            fontSize: 15,
                            color: '#222',
                            fontWeight: 400,
                            background: hoveredFieldIdx === idx ? '#e0e7ef' : 'transparent',
                            lineHeight: 1.2,
                            transition: 'background 0.15s',
                          }}
                          onMouseDown={() => handleFieldSelect(opt.value)}
                          onMouseEnter={() => setHoveredFieldIdx(idx)}
                          onMouseLeave={() => setHoveredFieldIdx(-1)}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Chips summary section (field dropdown) */}
                <div
                  ref={summaryBoxRef}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#e0e7ef',
                    borderRadius: 12,
                    padding: chips.length > 0 ? '6px 18px' : '6px 18px',
                    fontSize: 16,
                    marginLeft: 0,
                    marginRight: 0,
                    cursor: chips.length > 0 ? 'pointer' : 'default',
                    minWidth: 300,
                    maxWidth: 300,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: chips.length > 0 ? '1px solid #bcd6f7' : '1px solid #e0e7ef',
                    position: 'relative',
                    flex: '0 0 auto',
                  }}
                  title={undefined}
                  onMouseEnter={handleSummaryBoxMouseEnter}
                  onMouseLeave={handleSummaryBoxMouseLeave}
                >
                  {chips.length === 0 ? (
                    <span style={{ color: '#888' }}>No fields</span>
                  ) : (
                    <>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        {chips.length} field{chips.length > 1 ? 's' : ''}
                      </span>
                      {chips.some(chip => chip.value.startsWith('NOT:') || chip.value.startsWith('!')) && (
                        <span style={{ color: '#dc2626', fontWeight: 500, marginLeft: 8, fontSize: 14 }}>
                          (with exclusions)
                        </span>
                      )}
                    </>
                  )}
                </div>
                {/* Search button */}
                <button
                  type="button"
                  onClick={handleSpecifySearch}
                  style={{
                    marginLeft: 0,
                    padding: '6px 18px',
                    borderRadius: 6,
                    border: '1px solid #2563eb',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    flex: '0 0 auto',
                  }}
                  aria-label="Search"
                >
                  Search
                </button>
                {/* Help button */}
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  style={{
                    marginLeft: 8,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #6b7280',
                    background: '#fff',
                    color: '#6b7280',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    flex: '0 0 auto',
                    transition: 'all 0.2s',
                  }}
                  aria-label="Help with Specify Search"
                  title="Get help with advanced search features"
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.borderColor = '#4b5563';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#6b7280';
                  }}
                >
                  ?
                </button>
                {/* Tooltip rendered as React element, absolutely positioned */}
                {showTooltip && (
                  <div
                    ref={tooltipRef}
                    style={{
                      position: 'fixed',
                      left: tooltipPos.left,
                      top: tooltipPos.top,
                      zIndex: 3000,
                      background: '#fff',
                      border: '1px solid #bcd6f7',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
                      padding: '12px 20px',
                      fontSize: '16px',
                      color: '#222',
                      whiteSpace: 'pre-line',
                      minWidth: 300,
                      maxWidth: 580,
                      width: 340,
                      boxSizing: 'border-box',
                    }}
                    onMouseLeave={handleTooltipMouseLeave}
                  >
                    {chips.map((chip, idx) => {
                      const isNotValue = chip.value.startsWith('NOT:') || chip.value.startsWith('!');
                      let displayValue;
                      if (chip.value.startsWith('NOT:')) {
                        displayValue = chip.value.substring(4);
                      } else if (chip.value.startsWith('!')) {
                        displayValue = chip.value.substring(1);
                      } else {
                        displayValue = chip.value;
                      }
                      const fieldLabel = fieldOptions.find(f => f.value === chip.field)?.label || chip.field;
                      
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 500, marginRight: 8 }}>
                            {isNotValue ? (
                              <>
                                {fieldLabel} <span style={{ color: '#dc2626', fontWeight: 600 }}>(NOT)</span>:
                              </>
                            ) : (
                              `${fieldLabel}:`
                            )}
                          </span>
                          <span style={{ 
                            marginRight: 12,
                            color: isNotValue ? '#dc2626' : 'inherit',
                            textDecoration: isNotValue ? 'line-through' : 'none'
                          }}>
                            {displayValue}
                          </span>
                          <button
                            style={{ marginLeft: 8, color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
                            onClick={() => setChips(prev => prev.filter((_, i) => i !== idx))}
                            aria-label={`Remove ${fieldLabel}`}
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
          {window.__showSpinner ? (
            <span className="searchbar-spinner searchbar-spinner-fixedwidth">
              <svg width="22" height="22" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#61dafb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </span>
          ) : (
            <span className="searchbar-result-count searchbar-spinner-fixedwidth" style={{ marginLeft: 2 }}>
              {typeof resultCount === 'number' ? `${resultCount} result${resultCount === 1 ? '' : 's'}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="searchbar-export-btn-container">
        {typeof window.renderExportButton === 'function' && window.renderExportButton()}
      </div>
      
      {/* Help Modal */}
      {showHelpModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.35)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              padding: 36,
              maxWidth: 680,
              textAlign: 'left',
              fontSize: 16,
              color: '#222',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{marginBottom: 20, color: '#3182ce', textAlign: 'center', fontSize: 20}}>How to Use Specify Search</h3>
            
            <div style={{marginBottom: 18}}>
              <p style={{marginBottom: 12, lineHeight: 1.5}}>
                <strong>Specify Search</strong> allows you to create precise search queries by combining multiple field-value pairs with advanced logic.
              </p>
            </div>

            <div style={{marginBottom: 18}}>
              <h4 style={{color: '#2563eb', marginBottom: 8, fontSize: 18}}>Basic Usage:</h4>
              <ol style={{marginLeft: 20, lineHeight: 1.6}}>
                <li>Type a search value in the input field</li>
                <li>Select which field to search from the dropdown</li>
                <li>Repeat to add more search criteria</li>
                <li>Click "Search" to execute your query</li>
              </ol>
            </div>

            <div style={{marginBottom: 18}}>
              <h4 style={{color: '#2563eb', marginBottom: 8, fontSize: 18}}>Advanced Features:</h4>
              <ul style={{marginLeft: 20, lineHeight: 1.6}}>
                <li><strong>Multiple Values (OR Logic):</strong> Add multiple values for the same field to find parts matching any of those values</li>
                <li><strong>NOT Logic:</strong> Start any value with "!" or "NOT:" to exclude parts with that value</li>
                <li><strong>Combined Logic:</strong> Mix regular values, multiple values, and NOT logic for complex searches</li>
              </ul>
            </div>

            <div style={{marginBottom: 18}}>
              <h4 style={{color: '#2563eb', marginBottom: 8, fontSize: 18}}>Examples:</h4>
              <div style={{background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 8}}>
                <strong>Find parts from Microsoft OR Intel:</strong><br/>
                Manufacturer Name: "Microsoft"<br/>
                Manufacturer Name: "Intel"
              </div>
              <div style={{background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 8}}>
                <strong>Find resistors but exclude 10K ohm:</strong><br/>
                Inventory Description: "resistor"<br/>
                Inventory Description: "!10K"
              </div>
              <div style={{background: '#f8fafc', padding: 12, borderRadius: 6}}>
                <strong>Find specific part numbers from certain projects:</strong><br/>
                Manufacturer Part Number: "ABC123"<br/>
                Associated Project: "ProjectA"<br/>
                Associated Project: "ProjectB"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
