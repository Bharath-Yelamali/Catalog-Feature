import { useState, useRef } from 'react'
import * as XLSX from 'xlsx';
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
  const [lastSearch, setLastSearch] = useState("");
  const abortControllerRef = useRef();

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      // Track a unique search id for each fetch
      const searchId = Date.now() + Math.random();
      window.__currentSearchId = searchId;
      // Cancel previous fetch if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.__showSpinner = true;
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        let data;
        if (search.trim() === '') {
          data = await fetchParts({ classification: 'Inventoried', signal: controller.signal });
        } else {
          data = await fetchParts({ classification: 'Inventoried', search, filterType, signal: controller.signal });
        }
        // Only update state if this is the latest search
        if (window.__currentSearchId !== searchId) return;
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
        setLastSearch(search); // Save the search string used for this fetch
      } catch (err) {
        if (window.__currentSearchId !== searchId) return;
        if (err.name === 'AbortError') {
          // Spinner should stay on for new search, so do not hide it here
          return;
        }
        setError('Failed to load parts: ' + err.message);
      } finally {
        if (window.__currentSearchId === searchId) {
          setLoading(false);
          window.__showSpinner = false;
        }
      }
    }
  };

  // Export handler for checked items
  const handleExport = () => {
    // Gather checked items (selected)
    const checkedGroups = Object.entries(selected);
    if (!checkedGroups.length) return;
    // Flatten instances for export (one row per instance)
    const exportRows = checkedGroups.flatMap(([itemNumber, group]) => {
      // Attach the user-inputted quantity for this itemNumber
      const qty = quantities[itemNumber] || '';
      if (Array.isArray(group.instances)) {
        // If group is a group object (shouldn't be, but fallback)
        return group.instances.map(instance => ({ ...instance, __exportQty: qty }));
      } else {
        // If group is a single instance
        return [{ ...group, __exportQty: qty }];
      }
    });
    // Map to exportable fields in the same order as the UI table
    const data = exportRows.map(row => ({
      'Qty': row.__exportQty ?? '',
      'Total': row.total ?? 'N/A',
      'In Use': row.inUse ?? 'N/A',
      'Spare': row.spare ?? 'N/A',
      'Inventory Item Number': row.m_inventory_item?.item_number ?? 'N/A',
      'Serial Number/Name': row.m_serial_number ?? row.m_name ?? 'N/A',
      'Inventory Maturity': row.m_inventory_maturity ?? 'N/A',
      'Manufacturer Part #': row.m_mfg_part_number ?? 'N/A',
      'Manufacturer Name': row.m_mfg_name ?? 'N/A',
      'Hardware Custodian': row.m_hardware_custodian?.keyed_name ?? row.m_hardware_custodian?.id ?? 'N/A',
      'Parent Path': row.m_parent_path ?? 'N/A',
      'Inventory Description': row.m_inventory_description ?? row.m_description ?? 'N/A',
    }));
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(data, { header: [
      'Qty', 'Total', 'In Use', 'Spare', 'Inventory Item Number', 'Serial Number/Name', 'Inventory Maturity',
      'Manufacturer Part #', 'Manufacturer Name', 'Hardware Custodian', 'Parent Path', 'Inventory Description'] });
    // Set custom column widths for readability
    ws['!cols'] = [
      { wch: 6 },   // Qty
      { wch: 8 },   // Total
      { wch: 10 },  // In Use
      { wch: 8 },   // Spare
      { wch: 22 },  // Inventory Item Number
      { wch: 22 },  // Serial Number/Name
      { wch: 18 },  // Inventory Maturity
      { wch: 22 },  // Manufacturer Part #
      { wch: 22 },  // Manufacturer Name
      { wch: 22 },  // Hardware Custodian
      { wch: 28 },  // Parent Path
      { wch: 32 },  // Inventory Description
    ];
    // Try to freeze the header row (best effort with free xlsx)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Parts');
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `selected_parts_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div>
      <nav className="taskbar">
        <div className="taskbar-title clickable" onClick={() => setPage('home')}>
          <img src="/vite.svg" alt="Vite Logo" className="taskbar-logo" />
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
            resultCount={showResults ? results.length : undefined}
          />
          {/* Render Export button in the correct spot using window.renderExportButton */}
          {(() => {
            window.renderExportButton = () => (
              <button
                className={
                  'export-btn' + (Object.keys(selected).length === 0 ? ' export-btn-disabled' : '')
                }
                onClick={Object.keys(selected).length === 0 ? undefined : handleExport}
                disabled={Object.keys(selected).length === 0}
              >
                Export
              </button>
            );
            return null;
          })()}
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
                search={lastSearch}
                setPage={page => setPage(page)} // pass setPage as before
              />
            </>
          )}
        </>
      )}
      <main className="main-content">
        {page === 'about' && <div>About Page</div>}
        {page === 'contact' && <div>Contact Page</div>}
        {page === 'orders' && <div>Orders Page</div>}
        {page === 'requiredFields' && <div>Required Fields Page</div>}
      </main>
    </div>
  )
}

export default App
