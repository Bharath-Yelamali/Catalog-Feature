import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrders } from '../api/orders';

// Whitelist of fields to display in the table in specified order
const INCLUDED_FIELDS = [
  'keyed_name',  // First column (Order Name)
  'created_on',  // Second column
  'modified_on', // Third column
  'id',          // Fourth column
  'state',       // Fifth column (rightmost position)
];

// Mapping of field names to user-friendly header names
const HEADER_LABELS = {
  'created_on': 'Date Created',
  'modified_on': 'Last Modified',
  'keyed_name': 'Order Name',
  'state': 'Status',
  'id': 'Order ID'
};

// Helper to filter only the included fields and maintain the specified order
const filterFields = (obj) => {
  // Return fields in the order specified in INCLUDED_FIELDS array
  return INCLUDED_FIELDS.filter((field) =>
    Object.keys(obj).map((key) => key.toLowerCase()).includes(field.toLowerCase())
  );
};

// Helper to get user-friendly header name for a field
const getHeaderLabel = (field) => {
  return HEADER_LABELS[field.toLowerCase()] || field;
};

// Use React.memo to prevent unnecessary rerenders
const OrdersPage = ({ username, accessToken }) => {
  const [imsRaw, setImsRaw] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0); // NEW: total count from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [workflowProcess, setWorkflowProcess] = useState(null);
  const [workflowActivities, setWorkflowActivities] = useState([]);
  const [searchField, setSearchField] = useState('orderName'); // 'orderName' or 'createdBy'
  
  // Use ref to track if we've loaded orders to prevent multiple API calls
  // This persists across re-renders unlike a state variable
  const hasLoadedOrdersRef = useRef(false);
  
  // Prevent initial debounce effect on component mount
  const isFirstRenderRef = useRef(true);
  
  // Fetch orders function
  const fetchAllOrders = useCallback(async (search = '', field = searchField) => {
    // Don't refetch if we already have orders and there's no search term
    if (hasLoadedOrdersRef.current && search === '' && orders.length > 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Pass searchField to fetchOrders
      const data = await fetchOrders(username, accessToken, search, field);
      setImsRaw(data.imsRaw);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
      // Log the raw IMS response to the browser console
      console.log('IMS API response (raw):', data.imsRaw);
      // Mark that we've loaded orders using the ref
      hasLoadedOrdersRef.current = true;
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
      setImsRaw(null);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, orders.length, username, searchField]);
  // Single effect for initial data loading
  useEffect(() => {
    // Only fetch data if we're authenticated and haven't loaded orders yet
    if (accessToken && !hasLoadedOrdersRef.current) {
      console.log('Fetching initial orders data');
      fetchAllOrders('');
    }
    
    // Cleanup function - reset the ref if the component unmounts
    return () => {
      // This ensures fresh data when the component remounts
      // Comment this line if you want to keep the cache between tab switches
      // hasLoadedOrdersRef.current = false;
    };
  }, [accessToken, fetchAllOrders]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllOrders(searchTerm, searchField);
  };
  
  // Handle row click to view order details
  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setWorkflowProcess(null);
    setWorkflowActivities([]);
    try {
      const itemNumber = order.item_number || order.keyed_name;
      if (!itemNumber) return;
      const resp = await fetch(`/api/workflow-processes?orderItemNumber=${encodeURIComponent(itemNumber)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await resp.json();
      setWorkflowProcess(data.workflowProcess || null);
      // Always log the workflow process response
      console.log('[Order Click] Workflow Process API response:', data);
      console.log('[Order Click] Workflow Process:', data.workflowProcess || null);
      if (data.workflowProcess && data.workflowProcess.id) {
        const activityResp = await fetch(`/api/workflow-process-activities?workflowProcessId=${encodeURIComponent(data.workflowProcess.id)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const activityData = await activityResp.json();
        // Log the full API response
        console.log('[Order Click] Workflow Activities API response:', activityData);
        // Try to extract activities as array or object
        let activities = [];
        if (Array.isArray(activityData.activities)) {
          activities = activityData.activities;
        } else if (Array.isArray(activityData.workflowProcessActivity)) {
          activities = activityData.workflowProcessActivity;
        } else if (activityData.workflowProcessActivity) {
          activities = [activityData.workflowProcessActivity];
        }
        setWorkflowActivities(activities);
        console.log('[Order Click] Workflow Activities (parsed):', activities);
      } else {
        // Log if no workflow process id
        console.log('[Order Click] No workflow process id found, skipping activities fetch.');
        console.log('[Order Click] Workflow Activities:', []);
      }
    } catch (err) {
      console.error('Error fetching workflow process or activity:', err);
    }
  };
  
  // Close order details modal
  const handleCloseDetails = () => {
    setShowOrderDetails(false);
  };
  // Helper function for case-insensitive field matching
  const getFieldValue = (order, fieldName) => {
    const key = Object.keys(order).find((k) => k.toLowerCase() === fieldName.toLowerCase());
    return key ? order[key] : undefined;
  };
  
  // Helper to render status badge with appropriate styling
  const renderStatusBadge = (status) => {
    if (!status) return <span className="order-status">Unknown</span>;
    const lowerStatus = status.toLowerCase();
    let statusClass = 'order-status';
    // Map state to class
    if (lowerStatus.includes('draft')) statusClass += ' order-status-draft';
    else if (lowerStatus.includes('new')) statusClass += ' order-status-new';
    else if (lowerStatus.includes('submitted')) statusClass += ' order-status-submitted';
    else if (lowerStatus.includes('pending approval')) statusClass += ' order-status-pending-approval';
    else if (lowerStatus.includes('assign shipment')) statusClass += ' order-status-assign-shipment';
    else if (lowerStatus.includes('pending invoice')) statusClass += ' order-status-pending-invoice';
    else if (lowerStatus.includes('invoice')) statusClass += ' order-status-invoice';
    else if (lowerStatus.includes('pending payment')) statusClass += ' order-status-pending-payment';
    else if (lowerStatus.includes('paid')) statusClass += ' order-status-paid';
    else if (lowerStatus.includes('complete')) statusClass += ' order-status-complete';
    else if (lowerStatus.includes('on hold')) statusClass += ' order-status-on-hold';
    else if (lowerStatus.includes('cancel')) statusClass += ' order-status-cancel';
    else if (lowerStatus.includes('approved')) statusClass += ' order-status-approved';
    else if (lowerStatus.includes('rejected') || lowerStatus.includes('denied')) statusClass += ' order-status-rejected';
    return <span className={statusClass}>{status}</span>;
  };
  
  // Only render the component if user is logged in (accessToken exists)
  if (!accessToken) return null;
  
  // Filtered orders based on search field
  const getFilteredOrders = () => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    if (searchField === 'orderName') {
      return orders.filter(order => {
        const name = getFieldValue(order, 'keyed_name');
        return name && String(name).toLowerCase().includes(term);
      });
    } else if (searchField === 'createdBy') {
      // Only search on created_by_id@aras.keyed_name (case-insensitive, partial match)
      return orders.filter(order => {
        const createdBy = order['created_by_id@aras.keyed_name'] || '';
        return String(createdBy).toLowerCase().includes(term);
      });
    }
    return orders;
  };
  
  return (
    <div className="orders-page-container">
      <div className="orders-dropdown">
        {/* Removed header and subheader, shift everything up */}
        {/* Enhanced Search bar */}
        <div className="orders-search-container" style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit} className="orders-search-form" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f1f5f9', borderRadius: 8, padding: '10px 32px', boxShadow: '0 2px 8px #e2e8f0', border: '1px solid #cbd5e1', margin: '0 0 0px 0', width: '100%', maxWidth: '1200px' }}>
            <label style={{ fontWeight: 500, color: '#334155', marginRight: 8, fontSize: 15 }} htmlFor="orders-search-field-select">
              Search by:
            </label>
            <select
              id="orders-search-field-select"
              value={searchField}
              onChange={e => setSearchField(e.target.value)}
              className="orders-search-field-select"
              style={{ padding: '6px 14px', fontSize: 15, borderRadius: 6, border: '1.5px solid #94a3b8', background: '#fff', color: '#222', fontWeight: 500, outline: 'none', boxShadow: '0 1px 2px #e2e8f0' }}
              aria-label="Choose search field"
            >
              <option value="orderName">Order Name</option>
              <option value="createdBy">Created By</option>
            </select>
            <input
              type="text"
              placeholder={searchField === 'orderName' ? 'Search by Order Name' : 'Search by Creator'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="orders-search-input"
              aria-label={searchField === 'orderName' ? 'Search orders by name' : 'Search orders by creator'}
              style={{ padding: '6px 14px', fontSize: 15, borderRadius: 6, border: '1.5px solid #94a3b8', background: '#fff', color: '#222', minWidth: 500, width: '100%', maxWidth: 900, outline: 'none', boxShadow: '0 1px 2px #e2e8f0', flex: 1 }}
            />
            {/* Spinner or result count on the right */}
            <span className="searchbar-spinner-fixedwidth" style={{ marginLeft: 12 }}>
              {loading ? (
                <span className="searchbar-spinner" title="Loading...">
                  <svg width="22" height="22" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#61dafb" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </span>
              ) : (
                <span className="searchbar-result-count searchbar-spinner-fixedwidth">
                  {typeof totalCount === 'number' ? `${totalCount} result${totalCount === 1 ? '' : 's'}` : ''}
                </span>
              )}
            </span>
          </form>
        </div>
        {/* Remove the old loading message below the search bar */}
        {error && (
          <div className="orders-error">
            <div className="orders-error-icon">⚠️</div>
            <div className="orders-error-message">{error}</div>
          </div>
        )}
        
        {!loading && hasSearched && orders.length === 0 && (
          <div className="orders-no-results">
            <div className="orders-no-results-icon">🔍</div>
            <h3>No orders found</h3>
            <p>{searchTerm ? "Try adjusting your search criteria or using fewer keywords." : "You don't have any recent procurement orders."}</p>
          </div>
        )}        {getFilteredOrders().length > 0 && (
          <div className="orders-content">
            <table className="orders-table">
              <thead>
                <tr>
                  {filterFields(orders[0]).map((field) => (
                    <th key={field}>{getHeaderLabel(field)}</th>
                  ))}
                </tr>
              </thead><tbody>
                {getFilteredOrders().map((order, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => handleOrderClick(order)}
                    className="orders-table-row"
                    title="Click to view order details"
                  >
                    {filterFields(orders[0]).map((field) => {
                      let value = getFieldValue(order, field);

                      // Format date fields for better readability
                      if (
                        (field.toLowerCase() === 'created_on' || field.toLowerCase() === 'modified_on') &&
                        value
                      ) {
                        const date = new Date(value);
                        value = isNaN(date)
                          ? value
                          : date.toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                      }
                      // Render status with special badge styling
                      if (field.toLowerCase() === 'state') {
                        return <td key={field}>{renderStatusBadge(value)}</td>;
                      }
                      // Make order name a blue hyperlink to IMS
                      if (field.toLowerCase() === 'keyed_name') {
                        const orderId = getFieldValue(order, 'id');
                        return (
                          <td key={field}>
                            {orderId ? (
                              <a
                                href={`https://chievmimsiiss01/IMSStage/?StartItem=m_Procurement_Request:${orderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#3182ce', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
                                onClick={e => e.stopPropagation()}
                              >
                                {value}
                              </a>
                            ) : (
                              value
                            )}
                          </td>
                        );
                      }
                      return <td key={field}>{String(value || '')}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>        )}
        
        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="order-details-modal">
            <div className="order-details-content">
              <div className="order-details-header">
                <h3>Order Details</h3>
                <button 
                  className="order-details-close" 
                  onClick={handleCloseDetails}
                  aria-label="Close details"
                >
                  &times;
                </button>
              </div>
              <div className="order-details-body">
                <div className="order-details-summary">
                  <h4>
                    Order: {getFieldValue(selectedOrder, 'keyed_name') || 'Unknown Order'}
                  </h4>
                  <div className="order-details-status">
                    Status: {renderStatusBadge(getFieldValue(selectedOrder, 'state'))}
                  </div>
                </div>
                <div style={{marginBottom: 16, color: '#4a5568', fontSize: 14}}>
                  <b>Note:</b> Only non-empty fields are shown below. Fields already visible in the main table (Order Name, Order ID, Status, Date Created, Last Modified) are not repeated here.
                </div>
                {/* Order Metadata Section - Removed Locked By field */}
                <div className="order-details-section" style={{margin: '0 0 24px 0', padding: '16px 18px', background: '#f7fafc', borderRadius: 8, border: '1px solid #e2e8f0'}}>
                  <h4 style={{margin: '0 0 10px 0', fontWeight: 600, fontSize: 16}}>Order Metadata</h4>
                  <div style={{display: 'grid', gridTemplateColumns: 'max-content 1fr', rowGap: 6, columnGap: 16, fontSize: 15}}>
                    <div style={{fontWeight: 500}}>Created By:</div>
                    <div>{selectedOrder['created_by_id@aras.keyed_name'] || '—'}</div>
                    <div style={{fontWeight: 500}}>Created On:</div>
                    <div>{selectedOrder['created_on'] ? new Date(selectedOrder['created_on']).toLocaleString() : '—'}</div>
                    <div style={{fontWeight: 500}}>Modified By:</div>
                    <div>{selectedOrder['modified_by_id@aras.keyed_name'] || '—'}</div>
                    <div style={{fontWeight: 500}}>Modified On:</div>
                    <div>{selectedOrder['modified_on'] ? new Date(selectedOrder['modified_on']).toLocaleString() : '—'}</div>
                    <div style={{fontWeight: 500}}>Major Rev:</div>
                    <div>{selectedOrder['major_rev'] || '—'}</div>
                    <div style={{fontWeight: 500}}>Generation:</div>
                    <div>{selectedOrder['generation'] || '—'}</div>
                    <div style={{fontWeight: 500}}>State:</div>
                    <div>{selectedOrder['state'] || '—'}</div>
                  </div>
                </div>
                {/* Procurement Workflow Diagram */}
                <div className="order-details-section" style={{margin: '0 0 24px 0', padding: '32px 32px', background: '#f0f7fa', borderRadius: 12, border: '2px solid #b6d4e2'}}>
                  <h4 style={{margin: '0 0 18px 0', fontWeight: 600, fontSize: 20}}>Procurement Workflow</h4>
                  <div style={{width: '100%', overflowX: 'auto', overflowY: 'hidden', position: 'relative'}}>
                    {/* On Hold above Submitted with upward arrow centered */}
                    <div style={{position: 'absolute', left: 255, top: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60}}>
                      <div style={{padding: '2px 8px', background: '#e2e8f0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center'}}>On Hold</div>
                      <span style={{fontSize: 18, color: '#4a5568', margin: '2px 0'}}>↑</span>
                    </div>
                    {/* On Hold above Pending Approval with upward arrow centered */}
                    <div style={{position: 'absolute', left: 385, top: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100}}>
                      <div style={{padding: '2px 8px', background: '#e2e8f0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center'}}>On Hold</div>
                      <span style={{fontSize: 18, color: '#4a5568', margin: '2px 0'}}>↑</span>
                    </div>
                    {/* Cancel below Pending Approval with downward arrow */}
                    <div style={{position: 'absolute', left: 385, top: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100}}>
                      <span style={{fontSize: 18, color: '#a00', margin: '2px 0'}}>↓</span>
                      <div style={{padding: '2px 8px', background: '#ffe0e0', borderRadius: 14, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'center', color: '#a00'}}>Cancel</div>
                    </div>
                    {/* Highlight the current state in the workflow diagram */}
                    {(() => {
                      const workflowStates = [
                        'Start','New','Submitted','Pending Approval','Assign Shipment','Pending Invoice','Invoice','Pending Payment','Paid','Complete'
                      ];
                      const currentState = selectedOrder && (selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name'] || selectedOrder['state']);
                      return (
                        <div style={{display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, minHeight: 160, minWidth: 1800, justifyContent: 'flex-start'}}>
                          {workflowStates.map((state, idx, arr) => (
                            <React.Fragment key={state}>
                              <div
                                style={{
                                  padding: '2px 8px',
                                  background: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '#dbeafe' : '#e2e8f0',
                                  borderRadius: 14,
                                  fontWeight: 600,
                                  fontSize: 12,
                                  minWidth: state.length > 8 ? 100 : 60,
                                  textAlign: 'center',
                                  position: 'relative',
                                  border: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '2px solid #3182ce' : 'none',
                                  color: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '#1e293b' : undefined,
                                  boxShadow: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? '0 0 0 3px #3182ce, 0 2px 8px #3182ce33' : undefined,
                                  zIndex: (currentState && currentState.toLowerCase() === state.toLowerCase()) ? 2 : 1,
                                }}
                              >
                                {state}
                              </div>
                              {idx < arr.length - 1 && (
                                <span style={{margin: '0 10px', fontSize: 18, color: '#4a5568'}}>→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {/* --- Workflow Info Section --- */}
                  {(workflowProcess || workflowActivities.length > 0) && (
                    <div style={{marginTop: 24, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18}}>
                      <h5 style={{margin: '0 0 10px 0', fontWeight: 600, fontSize: 16}}>Workflow Info</h5>
                      {workflowProcess && (
                        <div style={{marginBottom: 8, fontSize: 15}}>
                          <b>Current Owner/Assignee:</b> {workflowProcess['process_owner@aras.keyed_name'] || '—'}<br/>
                          <b>Workflow Name:</b> {workflowProcess.label || workflowProcess.name || workflowProcess['label@aras.lang'] || '—'}<br/>
                          <b>Status:</b> {workflowProcess.state || workflowProcess['current_state@aras.name'] || '—'}<br/>
                          <b>Started:</b> {workflowProcess.active_date ? new Date(workflowProcess.active_date).toLocaleString() : '—'}<br/>
                          {workflowProcess.closed_date && (<><b>Closed:</b> {new Date(workflowProcess.closed_date).toLocaleString()}<br/></>)}
                        </div>
                      )}
                      {workflowActivities.length > 0 && (
                        <div style={{marginBottom: 8, fontSize: 15}}>
                          <b>Last Action:</b> {workflowActivities[0]['related_id@aras.keyed_name'] || '—'} by {workflowActivities[0]['created_by_id@aras.keyed_name'] || '—'} on {workflowActivities[0].created_on ? new Date(workflowActivities[0].created_on).toLocaleString() : '—'}
                        </div>
                      )}
                      {workflowActivities.length > 0 && (
                        <div style={{marginTop: 10}}>
                          <b>Order Timeline:</b>
                          <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'none', fontSize: 14}}>
                            {workflowActivities.slice(0, 8).map((act, i) => (
                              <li key={i} style={{marginBottom: 2}}>
                                <span style={{fontWeight: 500}}>{act['related_id@aras.keyed_name'] || '—'}</span> by <span>{act['created_by_id@aras.keyed_name'] || '—'}</span> on <span>{act.created_on ? new Date(act.created_on).toLocaleString() : '—'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="order-details-grid">
                  {/* Only show the curated list of fields, grouped and labeled, but skip those already in the main table and those that are empty/null */}
                  {/* 1. Project & Supplier */}
                  {selectedOrder['m_project@aras.keyed_name'] && <div className="order-details-item"><div className="order-details-label">Project</div><div className="order-details-value">{selectedOrder['m_project@aras.keyed_name']}</div></div>}
                  {selectedOrder['m_supplier@aras.keyed_name'] && <div className="order-details-item"><div className="order-details-label">Supplier</div><div className="order-details-value">{selectedOrder['m_supplier@aras.keyed_name']}</div></div>}
                  {selectedOrder['m_po_num'] && <div className="order-details-item"><div className="order-details-label">PO Number</div><div className="order-details-value">{selectedOrder['m_po_num']}</div></div>}
                  {selectedOrder['m_po_owner'] && <div className="order-details-item"><div className="order-details-label">PO Owner</div><div className="order-details-value">{selectedOrder['m_po_owner']}</div></div>}
                  {selectedOrder['m_coordinator'] && <div className="order-details-item"><div className="order-details-label">Coordinator</div><div className="order-details-value">{selectedOrder['m_coordinator']}</div></div>}
                  {/* 2. Financial & Purchase Details */}
                  {selectedOrder['m_total_price'] && <div className="order-details-item"><div className="order-details-label">Total Price</div><div className="order-details-value">{selectedOrder['m_total_price']}</div></div>}
                  {selectedOrder['m_currency'] && <div className="order-details-item"><div className="order-details-label">Currency</div><div className="order-details-value">{selectedOrder['m_currency']}</div></div>}
                  {selectedOrder['m_purchase_type'] && <div className="order-details-item"><div className="order-details-label">Purchase Type</div><div className="order-details-value">{selectedOrder['m_purchase_type']}</div></div>}
                  {selectedOrder['m_is_capex'] && <div className="order-details-item"><div className="order-details-label">Is Capex</div><div className="order-details-value">{selectedOrder['m_is_capex'] === '1' ? 'Yes' : selectedOrder['m_is_capex'] === '0' ? 'No' : ''}</div></div>}
                  {selectedOrder['m_io_num'] && <div className="order-details-item"><div className="order-details-label">IO Number</div><div className="order-details-value">{selectedOrder['m_io_num']}</div></div>}
                  {/* 3. Delivery & Contact */}
                  {selectedOrder['m_delivery_location'] && <div className="order-details-item"><div className="order-details-label">Delivery Location</div><div className="order-details-value">{selectedOrder['m_delivery_location']}</div></div>}
                  {selectedOrder['m_deliverto_msft'] && <div className="order-details-item"><div className="order-details-label">Deliver to MSFT</div><div className="order-details-value">{selectedOrder['m_deliverto_msft']}</div></div>}
                  {selectedOrder['m_contact'] && <div className="order-details-item"><div className="order-details-label">Contact</div><div className="order-details-value">{selectedOrder['m_contact']}</div></div>}
                  {selectedOrder['m_email'] && <div className="order-details-item"><div className="order-details-label">Email</div><div className="order-details-value">{selectedOrder['m_email']}</div></div>}
                  {selectedOrder['m_email_alias'] && <div className="order-details-item"><div className="order-details-label">Email Alias</div><div className="order-details-value">{selectedOrder['m_email_alias']}</div></div>}
                  {/* 4. Approval & Review */}
                  {selectedOrder['m_reviewer'] && <div className="order-details-item"><div className="order-details-label">Reviewer</div><div className="order-details-value">{selectedOrder['m_reviewer']}</div></div>}
                  {selectedOrder['m_invoice_approver'] !== undefined && selectedOrder['m_invoice_approver'] !== null && (
                    <div className="order-details-item">
                      <div className="order-details-label">Invoice Approver</div>
                      <div className="order-details-value">
                        {(() => {
                          const val = selectedOrder['m_invoice_approver'];
                          if (val === 0 || val === '0') return 'PO Owner';
                          if (val === 1 || val === '1') return 'Procurement team';
                          if (val === 2 || val === '2') return selectedOrder['m_invoice_approver_other'] || 'Other';
                          if (val === 'PO Owner') return 'PO Owner';
                          if (val === 'Procurement team') return 'Procurement team';
                          if (val === 'Other') return selectedOrder['m_invoice_approver_other'] || 'Other';
                          return val;
                        })()}
                      </div>
                    </div>
                  )}
                  {selectedOrder['m_interim_approver'] && <div className="order-details-item"><div className="order-details-label">Interim Approver</div><div className="order-details-value">{selectedOrder['m_interim_approver']}</div></div>}
                  {selectedOrder['m_safe_appover'] && <div className="order-details-item"><div className="order-details-label">SAFE Approver</div><div className="order-details-value">{selectedOrder['m_safe_appover']}</div></div>}
                  {selectedOrder['m_is_fid'] && <div className="order-details-item"><div className="order-details-label">Is FID</div><div className="order-details-value">{selectedOrder['m_is_fid'] === '1' ? 'Yes' : selectedOrder['m_is_fid'] === '0' ? 'No' : ''}</div></div>}
                  {selectedOrder['m_is_lab_tpm'] && <div className="order-details-item"><div className="order-details-label">Is Lab TPM</div><div className="order-details-value">{selectedOrder['m_is_lab_tpm'] === '1' ? 'Yes' : selectedOrder['m_is_lab_tpm'] === '0' ? 'No' : ''}</div></div>}
                  {selectedOrder['m_is_msft_poc'] && <div className="order-details-item"><div className="order-details-label">Is MSFT POC</div><div className="order-details-value">{selectedOrder['m_is_msft_poc'] === '1' ? 'Yes' : selectedOrder['m_is_msft_poc'] === '0' ? 'No' : ''}</div></div>}
                  {selectedOrder['m_is_po_urgent'] && <div className="order-details-item"><div className="order-details-label">Is PO Urgent</div><div className="order-details-value">{selectedOrder['m_is_po_urgent'] === '1' ? 'Yes' : selectedOrder['m_is_po_urgent'] === '0' ? 'No' : ''}</div></div>}
                  {/* 5. Business Justification & Notes */}
                  {selectedOrder['m_detail_info'] && <div className="order-details-item"><div className="order-details-label">Detail Info</div><div className="order-details-value">{selectedOrder['m_detail_info']}</div></div>}
                  {selectedOrder['m_notes_proc'] && <div className="order-details-item"><div className="order-details-label">Notes to Procurement</div><div className="order-details-value">{selectedOrder['m_notes_proc']}</div></div>}
                  {selectedOrder['m_explanation_for_wait'] && <div className="order-details-item"><div className="order-details-label">Explanation for Wait</div><div className="order-details-value">{selectedOrder['m_explanation_for_wait']}</div></div>}
                  {selectedOrder['m_explanation_not_submit'] && <div className="order-details-item"><div className="order-details-label">Explanation Not Submit</div><div className="order-details-value">{selectedOrder['m_explanation_not_submit']}</div></div>}
                  {selectedOrder['m_why_not_forecasted'] && <div className="order-details-item"><div className="order-details-label">Why Not Forecasted</div><div className="order-details-value">{selectedOrder['m_why_not_forecasted']}</div></div>}
                  {/* 6. Workflow & Attachments */}
                  {(selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name']) && <div className="order-details-item"><div className="order-details-label">Current State</div><div className="order-details-value">{selectedOrder['current_state@aras.name'] || selectedOrder['current_state@aras.keyed_name']}</div></div>}
                  {selectedOrder['m_lineitem_options'] && <div className="order-details-item"><div className="order-details-label">Line Items</div><div className="order-details-value">{selectedOrder['m_lineitem_options']}</div></div>}
                  {/* 7. Other Metadata */}
                  {selectedOrder['major_rev'] && <div className="order-details-item"><div className="order-details-label">Major Rev</div><div className="order-details-value">{selectedOrder['major_rev']}</div></div>}
                  {selectedOrder['generation'] && <div className="order-details-item"><div className="order-details-label">Generation</div><div className="order-details-value">{selectedOrder['generation']}</div></div>}
                  {selectedOrder['is_current'] && <div className="order-details-item"><div className="order-details-label">Is Current</div><div className="order-details-value">{selectedOrder['is_current'] === '1' || selectedOrder['is_current'] === 1 ? 'Yes' : selectedOrder['is_current'] === '0' || selectedOrder['is_current'] === 0 ? 'No' : selectedOrder['is_current']}</div></div>}
                  {selectedOrder['is_released'] && <div className="order-details-item"><div className="order-details-label">Is Released</div><div className="order-details-value">{selectedOrder['is_released'] === '1' || selectedOrder['is_released'] === 1 ? 'Yes' : selectedOrder['is_released'] === '0' || selectedOrder['is_released'] === 0 ? 'No' : selectedOrder['is_released']}</div></div>}
                  {/* Removed: itemtype, team, files/attachments, signoff, quote */}
                  {false && selectedOrder['itemtype']}
                  {false && selectedOrder['permission_id@aras.keyed_name']}
                  {false && selectedOrder['team_id@odata.navigationLink']}
                  {false && selectedOrder['m_Procurement_Request_Files@odata.navigationLink']}
                  {false && selectedOrder['m_Procurement_Request_Signoff@odata.navigationLink']}
                  {false && selectedOrder['m_quote@odata.navigationLink']}
                </div>
              </div>
              <div className="order-details-footer">
                <button 
                  className="order-details-button" 
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(OrdersPage);
