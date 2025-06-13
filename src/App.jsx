import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx';
import './App.css'
import SearchBar from './components/SearchBar';
import PartsTable from './components/PartsTable';
import RequiredFields from './components/RequiredFields';
import ConfirmationSummary from './components/ConfirmationSummary';
import { fetchParts } from './api/parts';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import { fetchUserFirstName } from './api/userInfo';
import OrdersPage from './components/OrdersPage';

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
  const [preqFields, setPreqFields] = useState({
    title: '',
    poNumber: '',
    poOwnerAlias: '',
    project: '',
    supplier: '',
    coordinator: '',
    purchaseType: '',
    currency: '',
    capex: undefined, // changed from false
    ioCc: '',
    deliveryContactEmail: '',
    emailAlias: '',
    deliveryContactPhone: '',
    deliveryLocation: '',
    deliverToMsftPoc: undefined, // changed from ''
    deliverToMsftAlias: '',
    fid: undefined, // changed from false
    fidNumber: '',
    reviewedByLabTpm: undefined, // changed from false
    reviewer: '',
    businessJustificationProject: '',
    businessJustificationLocation: '',
    businessJustificationWhat: '',
    businessJustificationWhy: '',
    businessJustificationImpact: '',
    businessJustificationNotes: '',
    interimApproverAlias: '',
    safeApprover: '',
    ccListAlias: '',
    shippingComments: '',
    invoiceApprover: '',
    urgent: undefined, // changed from false
    attachments: [],
  });
  const [newParts, setNewParts] = useState([]);
  const [loginSearch, setLoginSearch] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showSessionPopup, setShowSessionPopup] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(null);
  // Track if login was triggered by a search attempt (even blank)
  const [loginFromSearch, setLoginFromSearch] = useState(false);
  // Track the last page before login (for nav login button)
  const [lastPage, setLastPage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [identities, setIdentities] = useState([]);
  const abortControllerRef = useRef();
  const [justSearched, setJustSearched] = useState(false);

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
          data = await fetchParts({ classification: 'Inventoried', signal: controller.signal, accessToken });
        } else {
          data = await fetchParts({ classification: 'Inventoried', search, filterType, signal: controller.signal, accessToken });
        }
        // Only update state if this is the latest search
        if (window.__currentSearchId !== searchId) return;
        const fetchedParts = data.value || [];
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

  // Handler for the large search bar on the login page or homepage
  const handleLoginSearch = (e) => {
    const searchValue = e.value !== undefined ? e.value : loginSearch;
    if (e.key === 'Enter') {
      if (!accessToken) {
        setPendingSearch(searchValue); // can be blank
        setLoginFromSearch(true);
        setPage('login');
      } else {
        setSearch(searchValue);
        setPage('search');
        setTimeout(() => {
          // Simulate Enter key for search page's search bar
          const event = { key: 'Enter' };
          handleSearch(event);
        }, 0);
      }
    }
  };

  // Handler for nav login button
  const handleNavLogin = () => {
    setLastPage(page); // remember where user was
    setLoginFromSearch(false);
    setPage('login');
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

  const handleLogout = () => {
    setAccessToken(null);
    setPage('home');
    setSearch("");
    setShowResults(false);
    setResults([]);
    setFilterType('all');
    setSelected({});
    setQuantities({});
    setLastSearch("");
    setError(null);
    setLoading(false);
  };

  // When login is successful, check for pending search and loginFromSearch
  const handleLoginSuccess = async (token, usernameValue) => {
    setAccessToken(token);
    setUsername(usernameValue);
    // Fetch user's first and last name after login
    try {
      const data = await fetchUserFirstName({ username: usernameValue, accessToken: token });
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      // Fetch identities immediately after user info
      try {
        const identitiesData = await import('./api/identity').then(mod => mod.fetchIdentities({ accessToken: token }));
        console.log('Fetched identities from API:', identitiesData); // Log to browser console
        setIdentities(identitiesData.value || []);
        // Check if user is admin by matching name (case-insensitive, trimmed)
        const userNameNorm = (usernameValue || '').trim().toLowerCase();
        const fullNameNorm = (`${data.firstName || ''} ${data.lastName || ''}`).trim().toLowerCase();
        let adminId = null;
        let adminMatch = false;
        (identitiesData.value || []).forEach(admin => {
          if (!admin || !admin.name) return;
          const adminNameNorm = admin.name.trim().toLowerCase();
          if (adminNameNorm === userNameNorm || adminNameNorm === fullNameNorm) {
            adminId = admin.id || null;
            adminMatch = true;
          }
        });
        if (adminId) {
          console.log('User is admin. Admin ID:', adminId);
        }
        setIsAdmin(adminMatch);
      } catch (err) {
        setIdentities([]);
        setIsAdmin(false);
      }
    } catch (err) {
      setFirstName("");
      setLastName("");
      setIdentities([]);
    }
    if (loginFromSearch) {
      setSearch(pendingSearch ?? '');
      setPendingSearch(null);
      setLoginFromSearch(false);
      setPage('search');
      setTimeout(() => {
        const event = { key: 'Enter' };
        handleSearch(event);
      }, 0);
    } else {
      setPage(lastPage || 'home');
    }
  };

  // Auto-trigger search fetch if redirected to search page, even if search is blank
  useEffect(() => {
    if (page === 'search' && !loading && accessToken && justSearched) {
      handleSearch({ key: 'Enter' });
      setJustSearched(false);
    }
  }, [page, loading, accessToken, justSearched]);

  return (
    <div>
      {showSessionPopup && (
        <div className="session-popup-overlay" onClick={() => setShowSessionPopup(false)}>
          <div className="session-popup" onClick={e => e.stopPropagation()}>
            <div className="session-popup-title">About my session</div>
            <div className="session-popup-fields">
              <div className="session-popup-field"><span>Login Name:</span> <span>{username || 'N/A'}</span></div>
              <div className="session-popup-field"><span>Database:</span> <span>IMSStageBharath</span></div>
              <div className="session-popup-field"><span>Admin:</span> <span>{isAdmin ? 'Yes' : 'No'}</span></div>
              <div className="session-popup-field"><span>Full Name:</span> <span>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'N/A'}</span></div>
            </div>
            <button className="session-popup-close" onClick={() => setShowSessionPopup(false)}>Close</button>
          </div>
        </div>
      )}
      <nav className="taskbar">
        <div className="taskbar-title clickable" onClick={() => setPage('home')}>
          <img src="/wizard.svg" alt="Wizard Logo" className="taskbar-logo" />
        </div>        <ul className="taskbar-links">
          {/* Only show Search link if user is logged in */}
          {accessToken && (
            <li><a href="#" onClick={() => setPage('search')}>Search</a></li>
          )}
          {/* Only show Orders link if user is logged in */}
          {accessToken && (
            <li><a href="#" onClick={() => setPage('orders')}>Orders</a></li>
          )}
          <li><a href="#" onClick={() => setPage('about')}>About</a></li>
          {!accessToken ? (
            <li><a href="#" onClick={handleNavLogin}>Login</a></li>
          ) : (
            <>
              <li>
                <a href="#" className="taskbar-link" onClick={e => { e.preventDefault(); setShowSessionPopup(true); }}>
                  Session
                </a>
              </li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </>
          )}
        </ul>
      </nav>
      {/* Use HomePage component for the homepage */}
      {page === 'home' && (
        <HomePage setPage={setPage} setSearch={setSearch} handleSearch={handleLoginSearch} accessToken={accessToken} setJustSearched={setJustSearched} />
      )}      {page === 'login' && (
        <LoginPage setPage={setPage} handleLoginSuccess={handleLoginSuccess} />
      )}
      {page === 'search' && (
        <>
          {/* Redirect to home page if not logged in and somehow navigated to search page */}
          {!accessToken ? (
            <>{setPage('home')}</>
          ) : (
            <SearchBar
              search={search}
              setSearch={setSearch}
              filterType={filterType}
              setFilterType={setFilterType}
              handleSearch={handleSearch}
              resultCount={showResults ? results.length : undefined}
            />
          )}
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
            return null;          })()}
          {accessToken && showResults && (
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
                setPage={page => setPage(page)}
                isAdmin={isAdmin}
              />
            </>
          )}
        </>
      )}
      <main className="main-content">        {page === 'about' && <div>About Page</div>}
        {page === 'orders' && (
          <>
            {/* Redirect to home page if not logged in and somehow navigated to orders page */}
            {!accessToken ? (
              <>{setPage('home')}</>
            ) : (
              <OrdersPage username={username} accessToken={accessToken} />
            )}
          </>
        )}
        {page === 'requiredFields' && (
          <RequiredFields
            selected={selected}
            quantities={quantities}
            goBack={() => setPage('search')}
            setPage={setPage}
            setPreqFields={setPreqFields}
            preqFields={preqFields}
            newParts={newParts}
            setNewParts={setNewParts}
          />
        )}
        {page === 'confirmationSummary' && (
          <ConfirmationSummary
            selected={selected}
            quantities={quantities}
            preqFields={preqFields}
            newParts={newParts}
            attachments={preqFields.attachments || []}
            goBack={() => setPage('requiredFields')}
            onSubmit={() => {/* TODO: handle final submit */}}
          />
        )}
      </main>
    </div>
  )
}
  
export default App
