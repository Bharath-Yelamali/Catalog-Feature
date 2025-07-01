// Constants
const BASE_URL = 'http://localhost:3001/api';

// Helper function to build headers
function buildHeaders(accessToken, additionalHeaders = {}) {
  const headers = { ...additionalHeaders };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

// Helper function to build URL with parameters
function buildURL(endpoint, params) {
  let url = `${BASE_URL}${endpoint}`;
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return url;
}

// Fetch all parts from the backend API
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

// Fetch parts by specific fields for "Specify Search" mode
export async function fetchPartsByFields({ classification, top, searchParams, filterType, signal, accessToken } = {}) {
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
  
  // Add field-specific search parameters
  if (searchParams && typeof searchParams === 'object') {
    Object.entries(searchParams).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        // Handle array of values for the same field
        value.forEach(val => {
          if (val && val.trim() !== '') {
            params.push(`${encodeURIComponent(field)}=${encodeURIComponent(val.trim())}`);
          }
        });
      } else if (value && value.trim() !== '') {
        // Handle single value
        params.push(`${encodeURIComponent(field)}=${encodeURIComponent(value.trim())}`);
      }
    });
  }
  
  const url = buildURL('/parts', params);
  console.log('Frontend API request URL (field-based search):', url); // Debug: log the request URL
  
  const headers = buildHeaders(accessToken);
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch parts by fields');
  
  const data = await response.json();
  console.log('Fetched parts from backend API (field-based):', data); // Log the API response to the terminal
  return data;
}

// Post a new inventory part to the backend
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

// Update spare_value for a specific instance
export async function updateSpareValue(instanceId, spareValue, accessToken) {
  const url = `${BASE_URL}/m_Instance/${instanceId}/spare-value`;
  const headers = buildHeaders(accessToken, { 'Content-Type': 'application/json' });
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ spare_value: spareValue }),
  });
  if (!response.ok) throw new Error('Failed to update spare value');
  return response.status === 204 ? null : await response.json();
}
