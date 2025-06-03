import { useState, useEffect } from 'react';

function PartsTable({ results, selected, setSelected, quantities, setQuantities, search = '' }) {
  const [expandedValue, setExpandedValue] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState('');
  // Remove old selected/quantity logic for flat parts
  // Add expand/collapse state for each itemNumber
  const [expandedRows, setExpandedRows] = useState({});

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
  const selectedParts = selectedIds
    .map(id => results.find(p => p.id === id) || selected[id])
    .filter(Boolean);
  const nonSelectedParts = results.filter(part => !selected[part.id]);
  const displayParts = [...selectedParts, ...nonSelectedParts];

  const handleQuantityChange = (id, value, e) => {
    // Only allow positive integers or empty
    if (/^\d*$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
      // Only check the box if Enter is pressed and value is not empty
      if (e && e.key === 'Enter' && value.trim() !== '') {
        setSelected(prev => ({ ...prev, [id]: results.find(p => p.id === id) }));
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

  // Helper to highlight search match
  const highlightMatch = (text, search) => {
    if (!search || !text) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: '#ffe066', color: '#222', fontWeight: 600 }}>
          {text.slice(idx, idx + search.length)}
        </span>
        {text.slice(idx + search.length)}
      </>
    );
  };

  const handleExpandToggle = (itemNumber) => {
    setExpandedRows(prev => ({ ...prev, [itemNumber]: !prev[itemNumber] }));
  };

  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: '40px 80px 40px 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 2fr', minWidth: 0 }}>
            <div className="search-result-field"></div>
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
          {results.map(group => {
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
                  <div className="search-result-field">{part.total ?? 'N/A'}</div>
                  <div className="search-result-field">{part.inUse ?? 'N/A'}</div>
                  <div className="search-result-field">{part.spare ?? 'N/A'}</div>
                  <div className="search-result-field">{highlightMatch(part.m_inventory_item?.item_number, search) || 'N/A'}</div>
                  <div className="search-result-field">{highlightMatch(part.m_mfg_part_number, search) || 'N/A'}</div>
                  <div className="search-result-field">{highlightMatch(part.m_mfg_name, search) || 'N/A'}</div>
                  <div className="search-result-field">{highlightMatch(part.m_inventory_description || part.m_description, search) || 'N/A'}</div>
                </div>
                {expandedRows[group.itemNumber] && (
                  <div style={{ background: '#f9f9f9', padding: '0 16px 12px 16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold', margin: '8px 0 4px 0' }}>Instances:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 8, fontWeight: 'bold', marginBottom: 4 }}>
                      <div>Instance ID</div>
                      <div>Quantity</div>
                      <div>Hardware Custodian</div>
                      <div>Parent Path</div>
                    </div>
                    {group.instances.map(instance => (
                      <div key={instance.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 8, borderBottom: '1px solid #eee', padding: '2px 0' }}>
                        <div>{instance.m_id || 'N/A'}</div>
                        <div>{instance.m_quantity ?? 'N/A'}</div>
                        <div>{instance["m_custodian@aras.keyed_name"] || instance.m_custodian || 'N/A'}</div>
                        <div>{instance.m_parent_ref_path || 'N/A'}</div>
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
