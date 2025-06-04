import { useState, useEffect } from 'react';

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '' }) {
  const [expandedValue, setExpandedValue] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState('');
  // Remove old selected/quantity logic for flat parts
  // Add expand/collapse state for each itemNumber
  const [expandedRows, setExpandedRows] = useState({});
  // State for select all checkbox
  const [selectAll, setSelectAll] = useState(false);
  // State for filtering instances by General Inventory per group
  const [generalInventoryFilter, setGeneralInventoryFilter] = useState({});

  // Helper to truncate from the right (show left side, hide right side)
  const truncate = (str, max = 20) => {
    if (!str || str.length <= max) return str;
    return str.slice(0, max) + '...';
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

  // Combine selected items and current results, deduplicating by id
  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  // Find the group for each selected id (itemNumber)
  const selectedGroups = selectedIds
    .map(id => results.find(group => group.itemNumber === id))
    .filter(Boolean);
  // Non-selected groups
  const nonSelectedGroups = results.filter(group => !selectedIds.includes(group.itemNumber));
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

  // Helper to highlight all search matches (multi-keyword)
  const highlightMatch = (text, search) => {
    if (!search || !text) return text;
    // Support multi-keyword search (split on '+')
    const keywords = search.split('+').map(s => s.trim()).filter(Boolean);
    if (keywords.length === 0) return text;
    let result = [];
    let remaining = text;
    let lastIndex = 0;
    // Find all matches for all keywords, collect their ranges
    let matches = [];
    for (const keyword of keywords) {
      if (!keyword) continue;
      let idx = remaining.toLowerCase().indexOf(keyword.toLowerCase());
      while (idx !== -1) {
        matches.push({ start: lastIndex + idx, end: lastIndex + idx + keyword.length });
        idx = remaining.toLowerCase().indexOf(keyword.toLowerCase(), idx + keyword.length);
      }
    }
    if (matches.length === 0) return text;
    // Sort and merge overlapping matches
    matches.sort((a, b) => a.start - b.start);
    let merged = [];
    for (const m of matches) {
      if (!merged.length || merged[merged.length - 1].end < m.start) {
        merged.push({ ...m });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
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

  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
            <div className="search-result-field">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={displayGroups.length > 0 && displayGroups.every(group => selected[group.itemNumber])}
                onChange={handleSelectAll}
              />
            </div>
            <div className="search-result-field">Qty</div>
            <div className="search-result-field"></div>
            <div className="search-result-field">Total</div>
            <div className="search-result-field">In Use</div>
            <div className="search-result-field">Spare</div>
            <div className="search-result-field">Inventory Item Number</div>
            <div className="search-result-field">Manufactur Part #</div>
            <div className="search-result-field">Manufacturer Name</div>
            <div className="search-result-field">Inventory Description</div>
          </div>
          {displayGroups.map(group => {
            const part = group.instances[0];
            const hasMultiple = group.instances.length > 1;
            return (
              <div key={group.itemNumber}>
                <div className="search-result-item" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
                  <div className="search-result-field">
                    <input
                      type="checkbox"
                      checked={!!selected[group.itemNumber]}
                      onChange={() => handleCheckboxChange(group.itemNumber, part)}
                      aria-label="Select part"
                    />
                  </div>
                  <div className="search-result-field">
                    <input
                      type="text"
                      className="quantity-input"
                      value={quantities[group.itemNumber] || ''}
                      onChange={e => handleQuantityChange(group.itemNumber, e.target.value)}
                      onKeyDown={e => handleQuantityChange(group.itemNumber, quantities[group.itemNumber] || e.target.value, e)}
                      placeholder="0"
                      min="0"
                      style={{ width: 60, textAlign: 'center' }}
                      aria-label="Quantity"
                    />
                  </div>
                  <div className="search-result-field">
                    <button onClick={() => handleExpandToggle(group.itemNumber)} aria-label="Expand details" style={{ padding: 0, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
                      {expandedRows[group.itemNumber] ? '▲' : '▼'}
                    </button>
                  </div>
                  <div className="search-result-field">{truncate(part.total?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(part.inUse?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(part.spare?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Item Number', part.m_inventory_item?.item_number)} style={{ cursor: part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'pointer' : 'default' }}>{highlightMatch(truncate(part.m_inventory_item?.item_number), search) || 'N/A'}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Part #', part.m_mfg_part_number)} style={{ cursor: part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'pointer' : 'default' }}>{highlightMatch(truncate(part.m_mfg_part_number), search) || 'N/A'}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Name', part.m_mfg_name)} style={{ cursor: part.m_mfg_name && part.m_mfg_name.length > 20 ? 'pointer' : 'default' }}>{highlightMatch(truncate(part.m_mfg_name), search) || 'N/A'}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Description', part.m_inventory_description || part.m_description)} style={{ cursor: (part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'pointer' : 'default' }}>{highlightMatch(truncate(part.m_inventory_description || part.m_description), search) || 'N/A'}</div>
                </div>
                {expandedRows[group.itemNumber] && (
                  <div style={{ background: '#f9f9f9', padding: '0 16px 12px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '8px 0 4px 0', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>Instances:</span>
                      <button
                        style={{
                          background: generalInventoryFilter[group.itemNumber] ? '#ffe066' : '#eee',
                          color: '#222',
                          border: '1px solid #ccc',
                          borderRadius: 4,
                          padding: '2px 10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 8
                        }}
                        onClick={() => setGeneralInventoryFilter(prev => ({
                          ...prev,
                          [group.itemNumber]: !prev[group.itemNumber]
                        }))}
                        aria-pressed={!!generalInventoryFilter[group.itemNumber]}
                        aria-label="Toggle General Inventory filter"
                      >
                        General Inventory?
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 2fr', gap: 8, fontWeight: 'bold', marginBottom: 4 }}>
                      <div>Instance ID</div>
                      <div>Quantity</div>
                      <div>Inventory Maturity</div>
                      <div>Hardware Custodian</div>
                      <div>Parent Path</div>
                    </div>
                    {(generalInventoryFilter[group.itemNumber]
                      ? group.instances.filter(instance => instance.generalInventory)
                      : group.instances
                    ).map(instance => (
                      <div key={instance.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 2fr', gap: 8, borderBottom: '1px solid #eee', padding: '2px 0' }}>
                        <div>{highlightMatch(instance.m_id || 'N/A', search)}</div>
                        <div>{highlightMatch((instance.m_quantity ?? 'N/A').toString(), search)}</div>
                        <div>{highlightMatch(instance.m_maturity || 'N/A', search)}</div>
                        <div>{highlightMatch(instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A', search)}</div>
                        <div>{highlightMatch(instance.m_parent_ref_path || 'N/A', search)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {expandedValue && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
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
  );
}

export default PartsTable;
