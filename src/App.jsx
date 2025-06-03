import { useState } from 'react'
import './App.css'
import SearchBar from './components/SearchBar';
import PartsTable from './components/PartsTable';
import { fetchParts } from './api/parts';

function App() {
  const [page, setPage] = useState('home')
  const [search, setSearch] = useState("");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState({});
  const [quantities, setQuantities] = useState({});

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (search.trim() === '') {
          // Fetch all inventoried parts if search is empty
          data = await fetchParts({ classification: 'Inventoried' });
        } else {
          // Fetch inventoried parts with server-side filtering
          data = await fetchParts({ classification: 'Inventoried', search, filterType });
        }
        const fetchedParts = data.value || [];
        setParts(fetchedParts);
        // Group parts by inventory item number
        const grouped = {};
        for (const part of fetchedParts) {
          const itemNumber = part.m_inventory_item?.item_number || 'Unknown';
          if (!grouped[itemNumber]) grouped[itemNumber] = [];
          grouped[itemNumber].push(part);
        }
        // Convert grouped object to array for easier rendering
        const groupedResults = Object.entries(grouped).map(([itemNumber, instances]) => ({
          itemNumber,
          instances
        }));
        setResults(groupedResults);
        setShowResults(true);
      } catch (err) {
        setError('Failed to load parts: ' + err.message);
      } finally {
        setLoading(false);
      }
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
          {/* Only show dropdown after Enter is pressed */}
          {showResults && (
            <>
              {loading && <div>Loading parts...</div>}
              {error && <div style={{color: 'red'}}>{error}</div>}
              <PartsTable
                results={results}
                selected={selected}
                setSelected={setSelected}
                quantities={quantities}
                setQuantities={setQuantities}
                search={search}
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
