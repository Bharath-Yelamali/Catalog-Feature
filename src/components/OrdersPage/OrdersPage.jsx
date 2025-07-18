/**
 * OrdersPage.jsx
 *
 * Renders the procurement orders page, including search, table, and order details modal.
 * Handles fetching, filtering, and displaying procurement orders for the user.
 *
 * Environment: React (Vite), uses API endpoints and environment variables for IMS links.
 *
 * @author Bharath Yelamali
 * @date 2025-07-17
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrdersSearchBar from './OrdersSearchBar';
import OrderDetailsModal from './OrderDetailsModal';
import { fetchOrders } from '../../api/orders';

/**
 * Whitelist of fields to display in the table in specified order.
 * @type {string[]}
 */
const INCLUDED_FIELDS = [
  'keyed_name',  // First column (Order Name)
  'created_on',  // Second column
  'modified_on', // Third column
  'id',          // Fourth column
  'state',       // Fifth column (rightmost position)
];

/**
 * Mapping of field names to user-friendly header names.
 * @type {Object.<string, string>}
 */
const HEADER_LABELS = {
  'created_on': 'Date Created',
  'modified_on': 'Last Modified',
  'keyed_name': 'Order Name',
  'state': 'Status',
  'id': 'Order ID'
};

/**
 * Filters only the included fields and maintains the specified order.
 * @param {Object} obj - The object representing an order.
 * @returns {string[]} Array of field names in the specified order.
 */
const filterFields = (obj) => {
  return INCLUDED_FIELDS.filter((field) =>
    Object.keys(obj).map((key) => key.toLowerCase()).includes(field.toLowerCase())
  );
};

/**
 * Gets a user-friendly header name for a field.
 * @param {string} field - The field name.
 * @returns {string} The user-friendly header label.
 */
const getHeaderLabel = (field) => {
  return HEADER_LABELS[field.toLowerCase()] || field;
};

/**
 * OrdersPage component
 *
 * Renders the procurement orders page, including search, table, and order details modal.
 * Handles fetching, filtering, and displaying procurement orders for the user.
 *
 * @param {Object} props
 * @param {string} props.username - The username of the logged-in user.
 * @param {string} props.accessToken - The access token for API authentication.
 * @returns {JSX.Element|null}
 */
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
  /**
   * Fetches all procurement orders from the backend.
   * @param {string} [search=''] - The search term.
   * @param {string} [field=searchField] - The field to search on.
   * @returns {Promise<void>}
   */
  const fetchAllOrders = useCallback(async (search = '', field = searchField) => {
    if (hasLoadedOrdersRef.current && search === '' && orders.length > 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(username, accessToken, search, field);
      setImsRaw(data.imsRaw);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
      console.log('IMS API response (raw):', data.imsRaw);
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
  /**
   * Handles search input change event.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submission
  /**
   * Handles search form submission event.
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllOrders(searchTerm, searchField);
  };
  
  // Handle row click to view order details
  /**
   * Handles row click to view order details.
   * @param {Object} order - The selected order object.
   */
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
  /**
   * Closes the order details modal.
   */
  const handleCloseDetails = () => {
    setShowOrderDetails(false);
  };
  // Helper function for case-insensitive field matching
  /**
   * Helper function for case-insensitive field matching.
   * @param {Object} order - The order object.
   * @param {string} fieldName - The field name to look for.
   * @returns {*}
   */
  const getFieldValue = (order, fieldName) => {
    const key = Object.keys(order).find((k) => k.toLowerCase() === fieldName.toLowerCase());
    return key ? order[key] : undefined;
  };
  
  // Helper to render status badge with appropriate styling
  /**
   * Renders a status badge with appropriate styling.
   * @param {string} status - The status string.
   * @returns {JSX.Element}
   */
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
  /**
   * Returns filtered orders based on search field and term.
   * @returns {Object[]} Filtered orders array.
   */
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
        <OrdersSearchBar
          searchTerm={searchTerm}
          searchField={searchField}
          onSearchChange={handleSearchChange}
          onSearchFieldChange={e => setSearchField(e.target.value)}
          onSubmit={handleSearchSubmit}
          loading={loading}
          totalCount={totalCount}
        />
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
                        // Use IMS_BASE_URL_2 from environment variables
                        const imsBaseUrl = import.meta.env.VITE_IMS_BASE_URL_2;
                        return (
                          <td key={field}>
                            {orderId ? (
                              <a
                                href={`${imsBaseUrl}/?StartItem=m_Procurement_Request:${orderId}`}
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
          <OrderDetailsModal
            selectedOrder={selectedOrder}
            onClose={handleCloseDetails}
            workflowProcess={workflowProcess}
            workflowActivities={workflowActivities}
            renderStatusBadge={renderStatusBadge}
          />
        )}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(OrdersPage);
