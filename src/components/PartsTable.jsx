import { useState, useEffect } from 'react';

function PartsTable({ results, selected, setSelected, quantities, setQuantities }) {
  const [expandedValue, setExpandedValue] = useState(null);
  const [expandedLabel, setExpandedLabel] = useState('');

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

  return (
    <div className="search-results-dropdown">
      {displayParts.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-header" style={{ display: 'grid', gridTemplateColumns: '40px 80px 1.2fr 1fr 1fr 1fr 1fr 1.2fr 1.5fr 2fr', minWidth: 0 }}>
            <div className="search-result-field"></div>
            <div className="search-result-field">Qty</div>
            <div className="search-result-field">Inventory Item Number</div>
            <div className="search-result-field">Total</div>
            <div className="search-result-field">Surplus</div>
            <div className="search-result-field">Spare</div>
            <div className="search-result-field">Classification</div>
            <div className="search-result-field">Manufactur Part #</div>
            <div className="search-result-field">Parent Path</div>
            <div className="search-result-field">Inventory Description</div>
          </div>
          {displayParts.map(part => (
            <div key={part.id} className="search-result-item" style={{ display: 'grid', gridTemplateColumns: '40px 80px 1.2fr 1fr 1fr 1fr 1fr 1.2fr 1.5fr 2fr', minWidth: 0 }}>
              <div className="search-result-field">
                <input
                  type="checkbox"
                  checked={!!selected[part.id]}
                  onChange={() => handleCheckboxChange(part.id, part)}
                  aria-label="Select part"
                />
              </div>
              <div className="search-result-field">
                <input
                  type="text"
                  className="quantity-input"
                  value={quantities[part.id] || ''}
                  onChange={e => handleQuantityChange(part.id, e.target.value)}
                  onKeyDown={e => handleQuantityChange(part.id, quantities[part.id] || e.target.value, e)}
                  placeholder="0"
                  min="0"
                  style={{ width: 60, textAlign: 'center' }}
                  aria-label="Quantity"
                />
              </div>
              <div className="search-result-field" style={{ cursor: part.item_number && part.item_number.length > 20 ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} onClick={() => handleCellClick('Inventory Item Number', part.item_number)}>{truncate(part.item_number) || 'N/A'}</div>
              <div className="search-result-field">{part.total ?? 'N/A'}</div>
              <div className="search-result-field">{part.surplus ?? 'N/A'}</div>
              <div className="search-result-field">{part.spare ?? 'N/A'}</div>
              <div className="search-result-field" style={{ cursor: part.classification && part.classification.length > 20 ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} onClick={() => handleCellClick('Classification', part.classification)}>{truncate(part.classification) || 'N/A'}</div>
              <div className="search-result-field" style={{ cursor: part.m_mfg_part_number && part.m_mfg_part_number.length > 20 ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} onClick={() => handleCellClick('Manufactur Part #', part.m_mfg_part_number)}>{truncate(part.m_mfg_part_number) || 'N/A'}</div>
              <div className="search-result-field" style={{ cursor: part.m_parent_ref_path && part.m_parent_ref_path.length > 20 ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} onClick={() => handleCellClick('Parent Path', part.m_parent_ref_path)}>{truncate(part.m_parent_ref_path) || 'N/A'}</div>
              <div className="search-result-field" style={{ cursor: part.m_inventory_description && part.m_inventory_description.length > 20 ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} onClick={() => handleCellClick('Inventory Description', part.m_inventory_description)}>{truncate(part.m_inventory_description) || 'N/A'}</div>
            </div>
          ))}
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
