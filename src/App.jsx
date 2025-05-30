import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar';
import PartsTable from './components/PartsTable';
import { fetchParts } from './api/parts';

function App() {
  const [page, setPage] = useState('home')
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("itemNumber");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function loadParts() {
      try {
        setLoading(true);
        const data = await fetchParts();
        setParts(data.value || []); // OData returns { value: [...] }
        setError(null);
      } catch (err) {
        setError('Failed to load parts: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadParts();
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const filtered = search.trim() === ''
        ? parts
        : parts.filter(part => {
            const value = (filterType === 'itemNumber' ? part.item_number : part[filterType])?.toString().toLowerCase();
            return value && value.startsWith(search.toLowerCase());
          });
      setResults(filtered);
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
          {/* Only show dropdown after Enter is pressed */}
          {showResults && (
            <>
              {loading && <div>Loading parts...</div>}
              {error && <div style={{color: 'red'}}>{error}</div>}
              <PartsTable
                results={results}
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
