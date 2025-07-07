/**
 * orders.js
 * 
 * API utility for fetching procurement orders for the current user from the backend.
 * - Designed for use in the React frontend.
 * - Sends a GET request to the /api/orders endpoint with search and field parameters.
 * - Requires a Bearer token for authentication.
 * - Handles mapping of UI search fields to backend OData fields.
 * - Adds cache-busting to prevent stale results.
 */

/**
 * Fetches procurement orders for the current user from the backend API.
 *
 * @param {string} username - The username of the current user (required).
 * @param {string} token - Bearer token for authentication (required).
 * @param {string} [searchTerm=''] - Optional search term to filter orders.
 * @param {string} [searchField='orderName'] - UI field to search by ('orderName' or 'createdBy').
 * @returns {Promise<Object>} The response JSON containing order data.
 * @throws {Error} If the request fails or required parameters are missing.
 *
 * Usage:
 *   fetchOrders(username, token, searchTerm, searchField)
 */
export async function fetchOrders(username, token, searchTerm = '', searchField = 'orderName') {
  if (!username || !token) throw new Error('Missing username or token');
  
  // Map UI field to backend OData field
  let fieldParam = 'keyed_name';
  if (searchField === 'createdBy') fieldParam = 'created_by_id/keyed_name';

  // Add cache-busting and search parameters
  const cacheBuster = Date.now();
  const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
  const fieldQuery = `&field=${encodeURIComponent(fieldParam)}`;

  // Construct the API endpoint URL with all query parameters
  const resp = await fetch(
    `/api/orders?username=${encodeURIComponent(username)}&cb=${cacheBuster}${searchParam}${fieldQuery}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  // Handle non-OK responses with detailed error message
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to fetch orders: ${err}`);
  }
  
  // Parse and return the response JSON
  const data = await resp.json();
  return data;
}
