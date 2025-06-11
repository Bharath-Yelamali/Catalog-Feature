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
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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
                
                <div className="order-details-grid">
                  {Object.keys(selectedOrder).map((key) => {
                    // Skip displaying fields with null values or system fields
                    if (
                      selectedOrder[key] === null || 
                      key.startsWith('_') ||
                      key === '@odata.context'
                    ) {
                      return null;
                    }
                    
                    // Handle date fields
                    let value = selectedOrder[key];
                    if (
                      (key.toLowerCase().includes('date') || 
                       key.toLowerCase().includes('_on') || 
                       key.toLowerCase().includes('_at')) && 
                      value && typeof value === 'string' && value.includes('T')
                    ) {
                      const date = new Date(value);
                      if (!isNaN(date)) {
                        value = date.toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }
                    }
                    
                    return (
                      <div key={key} className="order-details-item">
                        <div className="order-details-label">{key}</div>
                        <div className="order-details-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    );
                  })}
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
