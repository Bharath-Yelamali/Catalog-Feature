import { useState } from 'react'
import './App.css'
import SearchBar from './components/SearchBar';
import PartsTable from './components/PartsTable';

function App() {
  const [page, setPage] = useState('home')
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("itemNumber");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  // Add state for dropdown offset
  const [dropdownOffset, setDropdownOffset] = useState(0);

  const parts = [
    { id: 1, itemNumber: 'A123', manufacturerPartNumber: 'M456', projectNumber: 'P789', totalParts: 1200, active: 1150, sparePercent: 10 },
    { id: 2, itemNumber: 'B234', manufacturerPartNumber: 'M567', projectNumber: 'P890', totalParts: 500, active: 300, sparePercent: 10 },
    { id: 3, itemNumber: 'C345', manufacturerPartNumber: 'M678', projectNumber: 'P901', totalParts: 2000, active: 1800, sparePercent: 10 },
    { id: 4, itemNumber: 'D456', manufacturerPartNumber: 'M789', projectNumber: 'P012', totalParts: 100, active: 90, sparePercent: 10 },
    { id: 5, itemNumber: 'E567', manufacturerPartNumber: 'M890', projectNumber: 'P123', totalParts: 0, active: 0, sparePercent: 10 },
    { id: 6, itemNumber: 'F678', manufacturerPartNumber: 'M901', projectNumber: 'P234', totalParts: 3, active: 1, sparePercent: 10 },
    { id: 7, itemNumber: 'G789', manufacturerPartNumber: 'M012', projectNumber: 'P345', totalParts: 15000, active: 14900, sparePercent: 10 },
    { id: 8, itemNumber: 'H890', manufacturerPartNumber: 'M123', projectNumber: 'P456', totalParts: 700, active: 650, sparePercent: 10 },
    { id: 9, itemNumber: 'I901', manufacturerPartNumber: 'M234', projectNumber: 'P567', totalParts: 2, active: 1, sparePercent: 10 },
    { id: 10, itemNumber: 'J012', manufacturerPartNumber: 'M345', projectNumber: 'P678', totalParts: 900, active: 850, sparePercent: 10 },
    { id: 11, itemNumber: 'K123', manufacturerPartNumber: 'M4567', projectNumber: 'P7890', totalParts: 1, active: 1, sparePercent: 10 },
    { id: 12, itemNumber: 'L234', manufacturerPartNumber: 'M5678', projectNumber: 'P8901', totalParts: 600, active: 590, sparePercent: 10 },
    { id: 13, itemNumber: 'M555', manufacturerPartNumber: 'M999', projectNumber: 'P1001', totalParts: 2500, active: 2000, sparePercent: 10 },
    { id: 14, itemNumber: 'N666', manufacturerPartNumber: 'M888', projectNumber: 'P1002', totalParts: 50, active: 40, sparePercent: 10 },
    { id: 15, itemNumber: 'O777', manufacturerPartNumber: 'M777', projectNumber: 'P1003', totalParts: 10000, active: 9500, sparePercent: 10 },
    { id: 16, itemNumber: 'P888', manufacturerPartNumber: 'M666', projectNumber: 'P1004', totalParts: 400, active: 350, sparePercent: 10 },
    { id: 17, itemNumber: 'Q999', manufacturerPartNumber: 'M555', projectNumber: 'P1005', totalParts: 5, active: 2, sparePercent: 10 },
    { id: 18, itemNumber: 'R101', manufacturerPartNumber: 'M444', projectNumber: 'P1006', totalParts: 120, active: 100, sparePercent: 10 },
    { id: 19, itemNumber: 'S202', manufacturerPartNumber: 'M333', projectNumber: 'P1007', totalParts: 800, active: 700, sparePercent: 10 },
    { id: 20, itemNumber: 'T303', manufacturerPartNumber: 'M222', projectNumber: 'P1008', totalParts: 60, active: 55, sparePercent: 10 },
    { id: 21, itemNumber: 'U404', manufacturerPartNumber: 'M111', projectNumber: 'P1009', totalParts: 300, active: 250, sparePercent: 10 },
    { id: 22, itemNumber: 'V505', manufacturerPartNumber: 'M000', projectNumber: 'P1010', totalParts: 100, active: 80, sparePercent: 10 }
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const filtered = parts.filter(part => {
        const value = part[filterType]?.toString().toLowerCase();
        return value && value.startsWith(search.toLowerCase());
      });
      // Always include checked items, even if they don't match the search
      const checkedIds = Object.keys(checkedItems).filter(id => checkedItems[id]);
      const checkedParts = parts.filter(part => checkedIds.includes(part.id.toString()));
      // Merge and deduplicate
      const merged = [...filtered, ...checkedParts].filter((part, idx, arr) =>
        arr.findIndex(p => p.id === part.id) === idx
      );
      setResults(merged);
      setShowResults(true);
    }
  };

  return (
    <div>
      <nav className="taskbar">
        <div className="taskbar-title" style={{cursor: 'pointer'}} onClick={() => setPage('home')}>
          <img src="/vite.svg" alt="Vite Logo" style={{ height: '32px', verticalAlign: 'middle' }} />
        </div>
        <ul className="taskbar-links">
          <li><a href="#" onClick={() => setPage('orders')}>Orders</a></li>
          <li><a href="#" onClick={() => setPage('about')}>About</a></li>
          <li><a href="#" onClick={() => setPage('contact')}>Contact</a></li>
        </ul>
      </nav>
      {/* Show searchbar and dropdown only on home page */}
      {page === 'home' && (
        <>
          <SearchBar
            search={search}
            setSearch={setSearch}
            filterType={filterType}
            setFilterType={setFilterType}
            handleSearch={handleSearch}
          />
          {/* Search results dropdown */}
          {showResults && (
            <>
              <button
                className="dropdown-move-btn hide-search-btn"
                onClick={() => {
                  setShowResults(false);
                  setDropdownOffset(0);
                }}
                aria-label="Hide search"
              >
                Hide Search
              </button>
              <PartsTable
                results={results}
                checkedItems={checkedItems}
                setCheckedItems={setCheckedItems}
                quantities={quantities}
                setQuantities={setQuantities}
              />
            </>
          )}
        </>
      )}
      <main style={{ marginTop: 80 }}>
        {page === 'about' && <div>About Page</div>}
        {page === 'contact' && <div>Contact Page</div>}
        {page === 'orders' && <div>Orders Page</div>}
      </main>
    </div>
  )
}

export default App
