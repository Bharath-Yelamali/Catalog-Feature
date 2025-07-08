import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx';
import PartsTable from './components/PartsTable/components/PartsTable';
import RequiredFields from './components/RequiredFields';
import ConfirmationSummary from './components/ConfirmationSummary/components/ConfirmationSummary';
import { fetchParts } from './api/parts';
import { executeSearch, processSearchResults } from './controllers/searchController';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import { fetchUserFirstName } from './api/userInfo';
import OrdersPage from './components/OrdersPage';
import ReactDOM from 'react-dom';
// Update SVG imports to use assets folder
import wizardIcon from './assets/wizard.svg';
import hideIcon from './assets/hide.svg';
import filterIcon from './assets/filter.svg';
import garbageIcon from './assets/garbage.svg';
import plusIcon from './assets/plus.svg';
import { searchableFields } from './components/SearchBarLogic/constants';
import { GlobalSearchBar } from './components/SearchBarLogic/components/GlobalSearchBar';
import Chatbox from './components/chatbox/chatbox';

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
  // Track if default search has been triggered to avoid infinite loop
  const [defaultSearchTriggered, setDefaultSearchTriggered] = useState(false);
  const [requestPopup, setRequestPopup] = useState({ open: false, custodians: [], group: null });
  // Add filter state for advanced/global search UI sync
  const [filterConditions, setFilterConditions] = useState([]);
  const [logicalOperator, setLogicalOperator] = useState('and');
  const [chatOpen, setChatOpen] = useState(false);

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
        // Extract search parameters
        const searchMode = e.searchMode || 'searchAll';
        const searchData = e.searchData || search;
        
        // Execute search using the search controller
        const data = await executeSearch(searchMode, searchData, {
          filterType,
          classification: 'Inventoried',
          accessToken,
          signal: controller.signal
        });
        
        // Only update state if this is the latest search
        if (window.__currentSearchId !== searchId) return;
        
        // Process results uniformly
        const groupedResults = processSearchResults(data);
        
        setResults(groupedResults);
        setShowResults(true);
        
        // Update lastSearch based on search mode
        if (searchMode === 'searchAll') {
          setLastSearch(searchData || '');
        } else {
          // For specify search, create a readable summary
          const searchSummary = searchData.map(chip => 
            `${chip.field}:${chip.value}`
          ).join(', ');
          setLastSearch(searchSummary);
        } // Save the search string used for this fetch
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
          const event = { 
            key: 'Enter',
            searchMode: 'searchAll',
            searchData: searchValue
          };
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
        const event = { 
          key: 'Enter',
          searchMode: 'searchAll',
          searchData: pendingSearch ?? ''
        };
        handleSearch(event);
      }, 0);
    } else {
      setPage(lastPage || 'home');
    }
  };

  // Auto-trigger search fetch if redirected to search page, even if search is blank
  // useEffect(() => {
  //   if (page === 'search' && !loading && accessToken) {
  //     if ((!search || search.trim() === '') && !defaultSearchTriggered) {
  //       setDefaultSearchTriggered(true);
  //       handleSearch({ 
  //         key: 'Enter',
  //         searchMode: 'searchAll',
  //         searchData: ''
  //       });
  //     }
  //   } else if (page !== 'search' && defaultSearchTriggered) {
  //     setDefaultSearchTriggered(false); // Reset when leaving search page
  //   }
  // }, [page, loading, accessToken, search, defaultSearchTriggered]);

  // Reset defaultSearchTriggered if user types in the search bar
  useEffect(() => {
    if (search && defaultSearchTriggered) {
      setDefaultSearchTriggered(false);
    }
  }, [search]);

  // Handler for filter-based searches from PartsTable
  const handleFilterSearch = async (chips, signal) => {
    // Track a unique search id for each fetch
    const searchId = Date.now() + Math.random();
    window.__currentSearchId = searchId;
    
    // Cancel previous fetch if still running and no external signal provided
    if (!signal && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    window.__showSpinner = true;
    setLoading(true);
    setError(null);
    
    // Use the provided signal or create a new controller
    let controller;
    if (signal) {
      controller = { signal };
    } else {
      controller = new AbortController();
      abortControllerRef.current = controller;
    }
    
    try {
      let data;
      // If chips is empty or has no conditions, and search is also empty, show empty state
      if ((!chips || chips.length === 0 || (chips.conditions && chips.conditions.length === 0)) && (!search || search.trim() === '')) {
        setResults([]);
        setShowResults(false);
        setLastSearch('');
        setLoading(false);
        return;
      }
      // If chips is empty or has no conditions, we want to go back to the original search
      if (!chips || chips.length === 0 || (chips.conditions && chips.conditions.length === 0)) {
        // Execute the original search (searchAll with the current search term)
        data = await executeSearch('searchAll', search, {
          filterType,
          classification: 'Inventoried',
          accessToken,
          signal: controller.signal
        });
      } else {
        // Execute search using the search controller with field-specific parameters
        data = await executeSearch('specifySearch', chips, {
          filterType,
          classification: 'Inventoried',
          accessToken,
          signal: controller.signal
        });
      }

      // Only update state if this is the latest search and not aborted
      if (window.__currentSearchId !== searchId || controller.signal?.aborted) return;
      
      // Process results uniformly
      const groupedResults = processSearchResults(data);
      
      setResults(groupedResults);
      setShowResults(true);
      
      // Update lastSearch based on whether we're filtering or clearing
      if (!chips || chips.length === 0 || (chips.conditions && chips.conditions.length === 0)) {
        // Cleared filters - show original search
        setLastSearch(search || '');
      } else {
        // Applied filters - show filter summary
        const searchSummary = chips.map(chip => 
          `${chip.field}:${chip.value}`
        ).join(', ');
        setLastSearch(`Filtered by: ${searchSummary}`);
      }
      
    } catch (err) {
      if (window.__currentSearchId !== searchId) return;
      if (err.name === 'AbortError') {
        // Spinner should stay on for new search, so do not hide it here
        return;
      }
      setError('Failed to apply filters: ' + err.message);
      // Don't re-throw the error - let PartsTable handle fallback gracefully
    } finally {
      if (window.__currentSearchId === searchId) {
        setLoading(false);
        window.__showSpinner = false;
      }
    }
  };

  // Handler for global search bar
  const handleGlobalSearchConditionsChange = ({ conditions, logicalOperator }) => {
    setFilterConditions(conditions || []);
    setLogicalOperator(logicalOperator || 'or');
    handleFilterSearch({ conditions, logicalOperator });
  };

  return (
    <div>
      {/* Render Chatbox at the top level so it does not overlap nav/header */}
      <Chatbox open={chatOpen} onClose={() => setChatOpen(false)} />
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
      {/* Request popup modal rendered at the top level using a Portal */}
      {requestPopup.open && ReactDOM.createPortal(
        <div
          className="session-popup-overlay"
          tabIndex={-1}
          onClick={e => e.stopPropagation()} // Prevent closing on background click
          onMouseDown={e => e.preventDefault()} // Prevent focus loss
          onFocus={e => {
            // Trap focus inside popup
            const popup = document.getElementById('request-popup-modal');
            if (popup) popup.focus();
          }}
        >
          <div
            id="request-popup-modal"
            className="session-popup"
            tabIndex={0}
            style={{ outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              // Trap focus inside modal
              if (e.key === 'Tab') {
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                setRequestPopup({ open: false, custodians: [], group: null });
              }
            }}
            autoFocus
          >
            <div className="session-popup-title" style={{ marginBottom: 12 }}>Request Parts From:</div>
            {requestPopup.custodians.length === 0 ? (
              <div style={{ color: '#888', marginBottom: 12 }}>No custodians found for selected instances.</div>
            ) : (
              requestPopup.custodians.map((custodian, idx) => {
                // Use cappedInstances for email, filtered by custodian
                const cappedInstances = (requestPopup.cappedInstances || []).filter(inst => (inst["m_custodian@aras.keyed_name"] || inst.m_custodian) === custodian && inst.capped_quantity > 0);
                if (cappedInstances.length === 0) return null;
                // Shared part info (from first instance)
                const shared = cappedInstances[0];
                const sharedInfo = [
                  `Inventory Item Number:    ${shared.item_number || 'N/A'}`,
                  `Manufacturer Part #:      ${shared.m_mfg_part_number || 'N/A'}`,
                  `Manufacturer Name:        ${shared.m_mfg_name || 'N/A'}`,
                  `Inventory Description:    ${shared.m_inventory_description || shared.m_description || 'N/A'}`
                ].join('\n');
                // Instance-specific lines (each instance on its own line, using capped_quantity)
                const instanceLines = cappedInstances.map(inst => {
                  const imsLink = inst.id ? `https://chievmimsiiss01/IMSStage/?StartItem=m_Instance:${inst.id}` : '';
                  return `Quantity: ${inst.capped_quantity}    Instance ID: ${inst.m_id || inst.id || 'N/A'}${imsLink ? ` (Link: ${imsLink})` : ''}    Parent Path: ${inst.m_parent_ref_path || 'N/A'}`;
                }).join('\n');
                const subject = encodeURIComponent('Request for Inventory Parts');
                const body = encodeURIComponent(
                  `Hello${custodian ? ' ' + custodian : ''},\n\n` +
                  `I would like to request the following part(s) from inventory. Could you please let me know the status and if they are available for me to pick up?\n\n` +
                  sharedInfo +
                  '\n\n' +
                  instanceLines +
                  '\n\nThank you!\n' +
                  (typeof window !== 'undefined' && window.location && window.location.origin ? `Requested via: ${window.location.origin}` : '')
                );
                return (
                  <button
                    key={custodian || idx}
                    style={{
                      background: 'none',
                      color: '#222',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      padding: '6px 18px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      margin: '6px 0',
                      minWidth: 120,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#ffe066')}
                    onFocus={e => (e.currentTarget.style.background = '#ffe066')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                    onBlur={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }}
                  >
                    {custodian || '(Unknown Custodian)'}
                  </button>
                );
              })
            )}
            <button className="session-popup-close" style={{ marginTop: 18, fontSize: 15 }} onClick={() => setRequestPopup({ open: false, custodians: [], group: null })}>Close</button>
          </div>
        </div>,
        document.body
      )}
      <nav className="taskbar">
        <div className="taskbar-title clickable" onClick={() => setPage('home')}>
          <img src={wizardIcon} alt="Wizard Logo" className="taskbar-logo" />
        </div>
        <ul className="taskbar-links">
          {/* Only show Search link if user is logged in */}
          {accessToken && (
            <li><a href="#" onClick={() => setPage('search')}>Search</a></li>
          )}
          {/* Only show Orders link if user is logged in */}
          {accessToken && (
            <li><a href="#" onClick={() => setPage('orders')}>Orders</a></li>
          )}
          {/* About page removed */}
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
        <div style={{ minHeight: '50vh', background: '#f7fafd' }}>
          {/* Redirect to home page if not logged in and somehow navigated to search page */}
          {!accessToken ? (
            <>{setPage('home')}</>
          ) : null}
          {(() => {
            window.renderExportButton = () => (
              <button
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #bcd6f7',
                  background: Object.keys(selected).length === 0 ? '#f8fafc' : '#2563eb',
                  color: Object.keys(selected).length === 0 ? '#334155' : '#fff',
                  cursor: Object.keys(selected).length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: 15,
                  width: 80,
                  minWidth: 80,
                  maxWidth: 80,
                  height: '42px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={Object.keys(selected).length === 0 ? undefined : handleExport}
                disabled={Object.keys(selected).length === 0}
              >
                Export
              </button>
            );
            return null;
          })()}
          {/* Always render PartsTable if logged in and on search page, even if no results yet */}
          {accessToken && (
            <>
              <div className="main-table-area" style={{marginTop: 55}}>
                <PartsTable
                  results={results}
                  selected={selected}
                  setSelected={setSelected}
                  quantities={quantities}
                  setQuantities={setQuantities}
                  search={lastSearch}
                  setPage={page => setPage(page)}
                  isAdmin={isAdmin}
                  accessToken={accessToken}
                  requestPopup={requestPopup}
                  setRequestPopup={setRequestPopup}
                  onFilterSearch={handleFilterSearch}
                  loading={loading}
                  filterConditions={filterConditions}
                  setFilterConditions={setFilterConditions}
                  logicalOperator={logicalOperator}
                  setLogicalOperator={setLogicalOperator}
                  chatOpen={chatOpen}
                  setChatOpen={setChatOpen}
                />
              </div>
            </>
          )}
        </div>
      )}
      <main className="main-content">        {/* About page removed */}
        {page === 'orders' && (
          <>
            {/* Redirect to home page if not logged in and somehow navigated to orders page */}
            {!accessToken ? (
              <>{setPage('home')}</>
            ) : (
              <OrdersPage username={username} accessToken={accessToken} />
            )}
          </>
        )}        {page === 'requiredFields' && (
          <RequiredFields
            selected={selected}
            quantities={quantities}
            goBack={() => setPage('search')}
            setPage={setPage}
            setPreqFields={setPreqFields}
            preqFields={preqFields}
            newParts={newParts}
            setNewParts={setNewParts}
            isAdmin={isAdmin}
            accessToken={accessToken}
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
            accessToken={accessToken}
            onAttachmentsChange={newAttachments => setPreqFields(prev => ({ ...prev, attachments: newAttachments }))}
          />
        )}
      </main>
    </div>
  )
}
  
export default App
