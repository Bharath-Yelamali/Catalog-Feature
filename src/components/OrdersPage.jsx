import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrders } from '../api/orders';

// Whitelist of fields to display in the table in specified order
const INCLUDED_FIELDS = [
  'created_on',  // First column
  'modified_on', // Second column
  'keyed_name',  // Third column
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Use ref to track if we've loaded orders to prevent multiple API calls
  // This persists across re-renders unlike a state variable
  const hasLoadedOrdersRef = useRef(false);
  
  // Prevent initial debounce effect on component mount
  const isFirstRenderRef = useRef(true);
  
  // Debounce search term to prevent too frequent API calls
  useEffect(() => {
    // Skip the initial render effect for search debouncing
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    // Only setup debounce for actual user input
    if (searchTerm !== '') {
      const timerId = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
      }, 500); // 500ms debounce delay
      
      return () => clearTimeout(timerId);
    }
  }, [searchTerm]);
  // Fetch orders function
  const fetchAllOrders = useCallback(async (search = '') => {
    // Don't refetch if we already have orders and there's no search term
    if (hasLoadedOrdersRef.current && search === '' && orders.length > 0) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchOrders(username, accessToken, search);
      setImsRaw(data.imsRaw);
      setOrders(Array.isArray(data.imsRaw?.value) ? data.imsRaw.value : []);
      
      // Log the raw IMS response to the browser console
      console.log('IMS API response (raw):', data.imsRaw);
      
      // Mark that we've loaded orders using the ref
      hasLoadedOrdersRef.current = true;
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
      setImsRaw(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, orders.length, username]);
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
  
  // Separate effect for search terms
  useEffect(() => {
    // Skip initial render and only respond to actual search terms
    if (!isFirstRenderRef.current && debouncedSearchTerm !== '') {
      fetchAllOrders(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, fetchAllOrders]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllOrders(searchTerm);
  };
  
  // Handle row click to view order details
  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    // --- Add API call for workflow process here ---
    try {
      console.log('Order clicked:', order);
      const itemNumber = order.item_number || order.keyed_name;
      if (!itemNumber) {
        console.warn('No item_number or keyed_name found on order:', order);
        return;
      }
      const resp = await fetch(`/api/workflow-processes?orderItemNumber=${encodeURIComponent(itemNumber)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await resp.json();
      console.log('Workflow process response:', data);
    } catch (err) {
      console.error('Error fetching workflow process:', err);
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
    
    // Convert status to lowercase for consistent comparison
    const lowerStatus = status.toLowerCase();
    
    // Determine appropriate class based on status
    let statusClass = 'order-status';
    if (lowerStatus.includes('draft')) {
      statusClass += ' order-status-draft';
    } else if (lowerStatus.includes('submitted') || lowerStatus.includes('pending')) {
      statusClass += ' order-status-submitted';
    } else if (lowerStatus.includes('approved')) {
      statusClass += ' order-status-approved';
    } else if (lowerStatus.includes('rejected') || lowerStatus.includes('denied')) {
      statusClass += ' order-status-rejected';
    } else if (lowerStatus.includes('complete')) {
      statusClass += ' order-status-completed';
    }
    
    return <span className={statusClass}>{status}</span>;
  };
  
  // Only render the component if user is logged in (accessToken exists)
  if (!accessToken) return null;
  
  return (
    <div className="orders-page-container">
      <div className="orders-dropdown">        <div className="orders-header">
          <h2 style={{ margin: "0 0 4px 0" }}>Procurement Orders</h2>
          <div className="orders-subtitle">
            {searchTerm ? `Filtered results for "${searchTerm}"` : "Showing your 50 most recent orders"}
          </div>
          
          {/* Enhanced Search bar */}
          <div className="orders-search-container">
            <form onSubmit={handleSearchSubmit} className="orders-search-form">
              <input
                type="text"
                placeholder="Search by Order Name"
                value={searchTerm}
                onChange={handleSearchChange}
                className="orders-search-input"
                aria-label="Search orders by name"
              />
              <button type="submit" className="orders-search-button">
                Search
              </button>
              {searchTerm && (
                <button 
                  type="button" 
                  className="orders-search-clear" 
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearchTerm('');
                    fetchAllOrders('');
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
          {error && (
          <div className="orders-error">
            <div className="orders-error-icon">⚠️</div>
            <div className="orders-error-message">{error}</div>
          </div>
        )}
        
        {loading && (
          <div className="orders-loading">
            <div className="orders-loading-spinner"></div>
            <div>Loading your procurement orders...</div>
          </div>
        )}
        
        {!loading && hasSearched && orders.length === 0 && (
          <div className="orders-no-results">
            <div className="orders-no-results-icon">🔍</div>
            <h3>No orders found</h3>
            <p>{searchTerm ? "Try adjusting your search criteria or using fewer keywords." : "You don't have any recent procurement orders."}</p>
          </div>
        )}        {orders.length > 0 && (
          <div className="orders-content">
            <table className="orders-table">
              <thead>
                <tr>
                  {filterFields(orders[0]).map((field) => (
                    <th key={field}>{getHeaderLabel(field)}</th>
                  ))}
                </tr>
              </thead><tbody>
                {orders.map((order, idx) => (
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
                  {selectedOrder['m_invoice_approver'] && <div className="order-details-item"><div className="order-details-label">Invoice Approver</div><div className="order-details-value">{selectedOrder['m_invoice_approver']}</div></div>}
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
                  {selectedOrder['m_Procurement_Request_Files@odata.navigationLink'] && <div className="order-details-item"><div className="order-details-label">Files/Attachments</div><div className="order-details-value"><a href={selectedOrder['m_Procurement_Request_Files@odata.navigationLink']} target="_blank" rel="noopener noreferrer">View Files</a></div></div>}
                  {selectedOrder['m_Procurement_Request_Signoff@odata.navigationLink'] && <div className="order-details-item"><div className="order-details-label">Signoff</div><div className="order-details-value"><a href={selectedOrder['m_Procurement_Request_Signoff@odata.navigationLink']} target="_blank" rel="noopener noreferrer">View Signoff</a></div></div>}
                  {selectedOrder['m_quote@odata.navigationLink'] && <div className="order-details-item"><div className="order-details-label">Quote</div><div className="order-details-value"><a href={selectedOrder['m_quote@odata.navigationLink']} target="_blank" rel="noopener noreferrer">View Quote</a></div></div>}
                  {/* 7. Other Metadata */}
                  {selectedOrder['major_rev'] && <div className="order-details-item"><div className="order-details-label">Major Rev</div><div className="order-details-value">{selectedOrder['major_rev']}</div></div>}
                  {selectedOrder['generation'] && <div className="order-details-item"><div className="order-details-label">Generation</div><div className="order-details-value">{selectedOrder['generation']}</div></div>}
                  {selectedOrder['is_current'] && <div className="order-details-item"><div className="order-details-label">Is Current</div><div className="order-details-value">{selectedOrder['is_current']}</div></div>}
                  {selectedOrder['is_released'] && <div className="order-details-item"><div className="order-details-label">Is Released</div><div className="order-details-value">{selectedOrder['is_released']}</div></div>}
                  {selectedOrder['itemtype'] && <div className="order-details-item"><div className="order-details-label">Itemtype</div><div className="order-details-value">{selectedOrder['itemtype']}</div></div>}
                  {selectedOrder['permission_id@aras.keyed_name'] && <div className="order-details-item"><div className="order-details-label">Permission</div><div className="order-details-value">{selectedOrder['permission_id@aras.keyed_name']}</div></div>}
                  {selectedOrder['team_id@odata.navigationLink'] && <div className="order-details-item"><div className="order-details-label">Team</div><div className="order-details-value"><a href={selectedOrder['team_id@odata.navigationLink']} target="_blank" rel="noopener noreferrer">View Team</a></div></div>}
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
