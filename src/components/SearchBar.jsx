function SearchBar({ search, setSearch, filterType, setFilterType, handleSearch, resultCount }) {
  return (
    <div className="searchbar-container">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={handleSearch}
        placeholder={`Search by ${filterType.replace(/([A-Z])/g, ' $1')}`}
        className="searchbar-input"
      />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="searchbar-select"
        >
          <option value="all">All Fields</option>
          <option value="itemNumber">Inventory Item Number</option>
          <option value="manufacturerPartNumber">Manufacturer Part Number</option>
          <option value="parentPath">Parent Path</option>
          <option value="inventoryDescription">Inventory Description</option>
          <option value="manufacturerName">Manufacturer Name</option>
          <option value="hardwareCustodian">Hardware Custodian</option>
          <option value="id">ID</option>
        </select>
        {window.__showSpinner ? (
          <span className="searchbar-spinner" style={{ marginLeft: 8, display: 'inline-block', width: 22, height: 22 }}>
            <svg width="22" height="22" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#61dafb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </span>
        ) : (
          <span style={{ marginLeft: 8, minWidth: 90, color: '#444', fontSize: 15, textAlign: 'left', display: 'inline-block' }}>
            {typeof resultCount === 'number' ? `${resultCount} result${resultCount === 1 ? '' : 's'}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
