/**
 * Fetches all parts in need of a bulk order (bulk_order == true) from the backend API.
 * @param {Object} options - Options for the request.
 * @param {string} [options.accessToken] - Optional Bearer token for authentication.
 * @returns {Promise<Array>} The response array containing bulk order parts data.
 * @throws {Error} If the request fails.
 */
export async function fetchBulkOrderParts({ accessToken } = {}) {
  const url = `${BASE_URL}/parts/bulk-order`;
  const headers = buildHeaders(accessToken);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch bulk order parts');
  const data = await response.json();
  // If backend returns { value: [...] }, unwrap value
  return Array.isArray(data) ? data : data.value || [];
}
/**
 * parts.js
 *
 * API utility functions for interacting with inventory parts via the backend API.
 *
 * - Uses the VITE_API_BASE_URL environment variable for all requests (set in the project root .env file).
 * - Provides functions to fetch all parts, fetch parts by specific fields, add new inventory parts, and update spare values.
 * - All requests support Bearer token authentication.
 * - Designed for use in the React frontend with Vite.
 */

// Constants
// Use the VITE_API_BASE_URL environment variable for the backend API base URL (set in the project root .env file)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Builds headers for API requests, including Authorization if an access token is provided.
 * @param {string} accessToken - Optional Bearer token for authentication.
 * @param {Object} additionalHeaders - Additional headers to include.
 * @returns {Object} Headers object for fetch.
 */
function buildHeaders(accessToken, additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Builds a URL with query parameters for API requests.
 * @param {string} endpoint - API endpoint (e.g., '/parts').
 * @param {Array} params - Array of query parameter strings.
 * @returns {string} Full URL with parameters.
 */
function buildURL(endpoint, params) {
  let url = `${BASE_URL}${endpoint}`;
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return url;
}

/**
 * Fetches all parts from the backend API.
 * @param {Object} options - Options for the request.
 * @param {string} [options.classification] - Optional classification filter.
 * @param {number} [options.top] - Optional limit for number of results.
 * @param {string} [options.search] - Optional search term.
 * @param {string} [options.filterType] - Optional filter type.
 * @param {AbortSignal} [options.signal] - Optional abort signal for fetch cancellation.
 * @param {string} [options.accessToken] - Optional Bearer token for authentication.
 * @returns {Promise<Object>} The response JSON containing parts data.
 * @throws {Error} If the request fails.
 */
export async function fetchParts({ classification, top, search, filterType, signal, accessToken } = {}) {
  const params = [];
  if (classification) {
    params.push(`classification=${encodeURIComponent(classification)}`);
  }
  if (top) {
    params.push(`$top=${top}`);
  }
  if (search) {
    params.push(`search=${encodeURIComponent(search)}`);
  }
  if (filterType) {
    params.push(`filterType=${encodeURIComponent(filterType)}`);
  }
  
  const url = buildURL('/parts', params);
  console.log('Frontend API request URL:', url); // Debug: log the request URL
  
  const headers = buildHeaders(accessToken);
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch parts');
  const data = await response.json();
  console.log('Fetched parts from backend API:', data); // Log the API response to the terminal
  return data;
}

/**
 * Fetches parts by specific fields for "Specify Search" mode.
 * @param {Object} options - Options for the request.
 * @param {string} [options.classification] - Optional classification filter.
 * @param {number} [options.top] - Optional limit for number of results.
 * @param {Object} [options.searchParams] - Field-specific search parameters.
 * @param {string} [options.filterType] - Optional filter type.
 * @param {string} [options.logicalOperator] - Optional logical operator (e.g., 'and', 'or').
 * @param {AbortSignal} [options.signal] - Optional abort signal for fetch cancellation.
 * @param {string} [options.accessToken] - Optional Bearer token for authentication.
 * @returns {Promise<Object>} The response JSON containing parts data.
 * @throws {Error} If the request fails.
 */
export async function fetchPartsByFields({ classification, top, searchParams, filterType, logicalOperator, signal, accessToken } = {}) {
  const params = [];
  
  if (classification) {
    params.push(`classification=${encodeURIComponent(classification)}`);
  }
  if (top) {
    params.push(`$top=${top}`);
  }
  if (filterType) {
    params.push(`filterType=${encodeURIComponent(filterType)}`);
  }
  if (logicalOperator) {
    params.push(`logicalOperator=${encodeURIComponent(logicalOperator)}`);
  }
  
  // Add field-specific search parameters
  if (searchParams && typeof searchParams === 'object') {
    Object.entries(searchParams).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        // Handle array of operator-value objects for the same field
        value.forEach(operatorValueObj => {
          if (operatorValueObj && typeof operatorValueObj === 'object' && operatorValueObj.value && operatorValueObj.value.trim() !== '') {
            // JSON-encode the operator-value object
            params.push(`${encodeURIComponent(field)}=${encodeURIComponent(JSON.stringify(operatorValueObj))}`);
          }
        });
      } else if (value && typeof value === 'object' && value.value && value.value.trim() !== '') {
        // Handle single operator-value object - JSON-encode it
        params.push(`${encodeURIComponent(field)}=${encodeURIComponent(JSON.stringify(value))}`);
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Fallback: Handle legacy simple string values by converting to "contains" operator
        const operatorValueObj = { operator: 'contains', value: value.trim() };
        params.push(`${encodeURIComponent(field)}=${encodeURIComponent(JSON.stringify(operatorValueObj))}`);
      }
    });
  }
  
  const url = buildURL('/parts', params);
  console.log('Frontend API request URL (field-based search):', url); // Debug: log the request URL
  
  const headers = buildHeaders(accessToken);
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch parts by fields');
  
  const data = await response.json();
  return data;
}

/**
 * Posts a new inventory part to the backend API.
 * @param {Object} part - The part object to add.
 * @param {string} accessToken - Bearer token for authentication.
 * @returns {Promise<Object>} The created part object from the backend.
 * @throws {Error} If the request fails or the part already exists.
 */
export async function postNewInventoryPart(part, accessToken) {
  const url = `${BASE_URL}/m_Inventory`;
  const headers = buildHeaders(accessToken, { 'Content-Type': 'application/json' });
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(part),
  });
  if (!response.ok) {
    let errorText = await response.text();
    let duplicate = false;
    try {
      // Try to parse as JSON
      const errorObj = JSON.parse(errorText);
      if (
        errorObj.error &&
        errorObj.error.message &&
        errorObj.error.message.toLowerCase().includes('already exists')
      ) {
        duplicate = true;
      }
    } catch (e) {
      // If not JSON, fallback to text search
      if (errorText.toLowerCase().includes('already exists')) {
        duplicate = true;
      }
    }
    if (duplicate) {
      const err = new Error('part_already_exists');
      err.isDuplicate = true;
      throw err;
    }
    throw new Error('Failed to add new inventory part');
  }
  return await response.json();
}

/**
 * Updates the spare_value for a specific inventory instance.
 * @param {string} instanceId - The ID of the inventory instance to update.
 * @param {number|string} spareValue - The new spare value to set.
 * @param {string} accessToken - Bearer token for authentication.
 * @returns {Promise<Object|null>} The updated instance object, or null if no content returned.
 * @throws {Error} If the request fails.
 */
export async function updateSpareValue(instanceId, spareValue, accessToken) {
  const url = `${BASE_URL}/m_Instance/${instanceId}/spare-value`;
  const headers = buildHeaders(accessToken, { 'Content-Type': 'application/json' });
  // Accept both spareValue and bulkOrder
  const patchBody = {};
  if (typeof spareValue !== 'undefined') patchBody.spare_value = spareValue;
  // Accept bulkOrder as an optional second argument
  if (arguments.length > 3 && typeof arguments[3] !== 'undefined') {
    patchBody.bulk_order = arguments[3];
  }
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patchBody),
  });
  if (!response.ok) throw new Error('Failed to update spare value');
  return response.status === 204 ? null : await response.json();
}
