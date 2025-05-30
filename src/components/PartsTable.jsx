function PartsTable({ results }) {
  return (
    <div className="search-results-dropdown">
      {results.length === 0 ? (
        <div className="search-results-empty">No parts found.</div>
      ) : (
        <>
          <div className="search-result-item search-result-grid search-result-header" style={{ gridTemplateColumns: '1fr' }}>
            <div className="search-result-field">Inventory Item Number</div>
          </div>
          {results.map(part => (
            <div key={part.id} className="search-result-item search-result-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="search-result-field">{part.item_number}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default PartsTable;
