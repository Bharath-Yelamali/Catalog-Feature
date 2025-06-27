import { useState, useEffect } from 'react';
import { updateSpareValue } from '../api/parts';

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '', setPage, isAdmin, accessToken }) {
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

  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
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
            <div className="search-result-field">Essential Reserve</div>
            <div className="search-result-field">Usable Surplus</div>
            <div className="search-result-field">Inventory Item Number</div>
            <div className="search-result-field">Manufactur Part #</div>
            <div className="search-result-field">Manufacturer Name</div>
            <div className="search-result-field">Inventory Description</div>
          </div>
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
                <div className="search-result-item" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
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
                  <div className="search-result-field">
                    <button onClick={() => handleExpandToggle(group.itemNumber)} aria-label="Expand details" style={{ padding: 0, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>
                      {expandedRows[group.itemNumber] ? '▲' : '▼'}
                    </button>
                  </div>
                  <div className="search-result-field">{truncate(part.total?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(part.inUse?.toString()) ?? 'N/A'}</div>
                  <div className="search-result-field">{truncate(essentialReserve.toString())}</div>
                  <div className="search-result-field" style={{
                    color: usableSurplus > 0 ? '#228B22' : undefined,
                    fontWeight: usableSurplus > 0 ? 700 : undefined,
                  }}>
                    {truncate(usableSurplus.toString())}
                  </div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Item Number', part.m_inventory_item?.item_number)} style={{ cursor: part.m_inventory_item?.item_number && part.m_inventory_item.item_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_inventory_item?.item_number ?? 'N/A'), part._matches?.m_inventory_item)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Part #', part.m_mfg_part_number)} style={{ cursor: part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_part_number ?? 'N/A'), part._matches?.m_mfg_part_number)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Manufacturer Name', part.m_mfg_name)} style={{ cursor: part.m_mfg_name && part.m_mfg_name.length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate(part.m_mfg_name ?? 'N/A'), part._matches?.m_mfg_name)}</div>
                  <div className="search-result-field" onClick={() => handleCellClick('Inventory Description', part.m_inventory_description || part.m_description)} style={{ cursor: (part.m_inventory_description || part.m_description) && (part.m_inventory_description || part.m_description).length > 20 ? 'pointer' : 'default' }}>{highlightFieldWithMatches(truncate((part.m_inventory_description ?? part.m_description) ?? 'N/A'), part._matches?.m_inventory_description || part._matches?.m_description)}</div>
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
                      {isAdmin && (
                        <span style={{marginLeft: 24, fontWeight: 400, fontSize: 16, color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: 8}}>
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
                            }}                            onBlur={async e => {
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
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 2fr 2fr', gap: 8, fontWeight: 'bold', marginBottom: 4 }}>
                      <div>Instance ID</div>
                      <div>Serial Number/Name</div>
                      <div>Quantity</div>
                      <div>Inventory Maturity</div>
                      <div>Hardware Custodian</div>
                      <div>Parent Path</div>
                    </div>
                    {(generalInventoryFilter[group.itemNumber]
                      ? group.instances.filter(instance => instance.generalInventory)
                      : group.instances
                    ).map(instance => (
                      <div key={instance.id + instance.m_id + instance.item_number + instance.m_maturity + (instance["m_custodian@aras.keyed_name"] || instance.m_custodian) + instance.m_parent_ref_path} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 2fr 2fr', gap: 8, borderBottom: '1px solid #eee', padding: '2px 0' }}>
                        <div>{highlightFieldWithMatches(instance.m_id || 'N/A', part._matches?.m_id)}</div>
                        <div>{highlightFieldWithMatches(instance.item_number || 'N/A', part._matches?.item_number)}</div>
                        <div>{highlightFieldWithMatches((instance.m_quantity ?? 'N/A').toString(), part._matches?.m_quantity)}</div>
                        <div>{highlightFieldWithMatches(instance.m_maturity || 'N/A', part._matches?.m_maturity)}</div>
                        <div>{highlightFieldWithMatches(instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A', part._matches?.m_custodian)}</div>
                        <div>{highlightFieldWithMatches(instance.m_parent_ref_path || 'N/A', part._matches?.m_parent_ref_path)}</div>
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
      {/* Next button fixed to the very bottom right, always visible */}
      <div className="confirmation-summary-buttons" style={{ position: 'fixed', bottom: 0, right: 15, zIndex: 100, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button
          className="confirmation-summary-button-submit"
          style={{ fontSize: 22, padding: '6px 48px', minWidth: 90, borderRadius: 10 }}
          disabled={!(selectedIds.length > 0 && selectedIds.every(id => quantities[id] && quantities[id].trim() !== ''))}
          onClick={() => setPage('requiredFields')}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PartsTable;
