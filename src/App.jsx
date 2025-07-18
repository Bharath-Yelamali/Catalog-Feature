import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx';
import PartsTable from './components/PartsTable/PartsTable';
import RequiredFields from './components/RequiredFields/RequiredFields';
import ConfirmationSummary from './components/ConfirmationSummary/components/ConfirmationSummary';
import { executeSearch, processSearchResults } from './controllers/searchController';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import { fetchUserFirstName } from './api/userInfo';
import OrdersPage from './components/OrdersPage/OrdersPage';
// Update SVG imports to use assets folder
import NavigationBar from './components/NavigationBar/NavigationBar';
import SessionPopup from './components/NavigationBar/SessionPopup';
import Chatbox from './components/chatbox/chatbox';

import ChatboxOpenButton from './components/PartsTable/ChatboxOpenButton';
// Updated imports for FilterComponents folder
// import FilterDropdown from './components/FilterDropdown';
// import { FilterCondition } from './components/FilterComponents';
// import { LogicalOperatorSelector } from './components/LogicalOperatorSelector';
// import { UnifiedFilterList } from './components/UnifiedFilterList';
// Now use:
// import FilterDropdown from './components/FilterComponents/FilterDropdown';
// import { FilterCondition } from './components/FilterComponents/FilterComponents';
// import { LogicalOperatorSelector } from './components/FilterComponents/LogicalOperatorSelector';
// import { UnifiedFilterList } from './components/FilterComponents/UnifiedFilterList';

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
  // Removed requestPopup feature
  // Add filter state for advanced/global search UI sync
  const [filterConditions, setFilterConditions] = useState([]);
  const [logicalOperator, setLogicalOperator] = useState('and');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatboxResults, setChatboxResults] = useState([]); // <-- Add this line

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
    // --- REDIRECT LOGIC FOR USE IT NOW BUTTON ---
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect === 'search') {
      localStorage.removeItem('redirectAfterLogin');
      setPage('search');
      setTimeout(() => {
        const event = { 
          key: 'Enter',
          searchMode: 'searchAll',
          searchData: ''
        };
        handleSearch(event);
      }, 0);
      return;
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
  const handleGlobalSearchConditions = ({ conditions, logicalOperator }) => {
    setFilterConditions(conditions || []);
    setLogicalOperator(logicalOperator || 'or');
    handleFilterSearch({ conditions, logicalOperator });
  };

  // Wrapper to close chatbox on page change
  const handleSetPage = (newPage) => {
    setPage(newPage);
    if (newPage !== 'search') {
      setChatOpen(false);
    }
    // If navigating to search, do not auto-close; user can open/close manually
  };

  // Automatically close chatbox if not on search page
  useEffect(() => {
    if (page !== 'search' && chatOpen) {
      setChatOpen(false);
    }
  }, [page]);

  // Wrapper to open chatbox only on search page
  const handleSetChatOpen = (open) => {
    if (page === 'search') {
      setChatOpen(open);
    }
  };

  return (
    <div>
      {/* Render Chatbox at the top level so it does not overlap nav/header */}
      <Chatbox
        open={chatOpen}
        onClose={() => handleSetChatOpen(false)}
        searchResults={chatboxResults}
        onGlobalSearchConditions={handleGlobalSearchConditions}
      />
      {showSessionPopup && (
        <SessionPopup
          username={username}
          isAdmin={isAdmin}
          firstName={firstName}
          lastName={lastName}
          onClose={() => setShowSessionPopup(false)}
        />
      )}
      {/* Request popup feature removed */}
      <NavigationBar
        page={page}
        setPage={setPage}
        accessToken={accessToken}
        isAdmin={isAdmin}
        handleNavLogin={handleNavLogin}
        handleLogout={handleLogout}
        setShowSessionPopup={setShowSessionPopup}
      />
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
          {/* Floating export button removed; use table header export button only */}
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
                  setPage={handleSetPage}
                  isAdmin={isAdmin}
                  accessToken={accessToken}
                  // requestPopup and setRequestPopup removed
                  onFilterSearch={handleFilterSearch}
                  loading={loading}
                  filterConditions={filterConditions}
                  setFilterConditions={setFilterConditions}
                  logicalOperator={logicalOperator}
                  setLogicalOperator={setLogicalOperator}
                  chatOpen={chatOpen}
                  setChatOpen={setChatOpen}
                  onResultsChange={setChatboxResults} // <-- Add this line
                />
              </div>
            </>
          )}
          {accessToken && page === 'search' && (
            <ChatboxOpenButton chatOpen={chatOpen} onOpen={() => handleSetChatOpen(true)} />
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
