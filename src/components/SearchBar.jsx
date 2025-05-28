function SearchBar({ search, setSearch, filterType, setFilterType, handleSearch }) {
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
      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
        className="searchbar-select"
      >
        <option value="itemNumber">Inventory Item Number</option>
        <option value="manufacturerPartNumber">Manufacturer Part Number</option>
        <option value="projectNumber">Project Number</option>
        <option value="id">ID</option>
      </select>
    </div>
  );
}

export default SearchBar;
