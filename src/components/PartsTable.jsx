function PartsTable({ results, checkedItems, setCheckedItems, quantities, setQuantities }) {
  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-grid search-result-header" style={{ gridTemplateColumns: 'minmax(60px,80px) minmax(80px,100px) 1fr 1fr 1fr 1fr 1.5fr 1.5fr' }}>
            <div className="search-result-field">Select</div>
            <div className="search-result-field">Quantity</div>
            <div className="search-result-field">Total Parts</div>
            <div className="search-result-field">Active</div>
            <div className="search-result-field">Spare</div>
            <div className="search-result-field">Surplus</div>
            <div className="search-result-field">Inventory Item</div>
            <div className="search-result-field">MPN</div>
          </div>
          {results.map(part => {
            const available = part.totalParts - part.active;
            const requiredSpare = Math.ceil((part.sparePercent / 100) * part.totalParts);
            let spare = available > 0 ? available : 0;
            let surplus = 0;
            if (spare > requiredSpare) {
              surplus = spare - requiredSpare;
              spare = requiredSpare;
            }
            const needsOrder = spare < requiredSpare;
            return (
              <div key={part.id} className="search-result-item search-result-grid" style={{ gridTemplateColumns: 'minmax(60px,80px) minmax(80px,100px) 1fr 1fr 1fr 1fr 1.5fr 1.5fr' }}>
                <div className="search-result-field">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[part.id]}
                    onChange={e => setCheckedItems(c => ({ ...c, [part.id]: e.target.checked }))}
                  />
                </div>
                <div className="search-result-field">
                  <input
                    type="number"
                    min="0"
                    value={quantities[part.id] || ''}
                    onChange={e => setQuantities(q => ({ ...q, [part.id]: e.target.value }))}
                    className="quantity-input"
                    placeholder="Qty"
                    style={{ width: '60px' }}
                  />
                </div>
                <div className="search-result-field">{part.totalParts}</div>
                <div className="search-result-field">{part.active}</div>
                <div className="search-result-field">
                  <span className={needsOrder ? "spare-warning" : undefined}>{spare}</span>
                </div>
                <div className="search-result-field">{surplus}</div>
                <div className="search-result-field">{part.itemNumber}</div>
                <div className="search-result-field">{part.manufacturerPartNumber}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default PartsTable;
