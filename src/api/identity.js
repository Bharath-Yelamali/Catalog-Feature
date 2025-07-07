/**
 * identity.js
 * 
 * API utility functions for fetching identity-related data from the backend.
 * 
 * - Uses the VITE_API_BASE_URL environment variable for all requests.
 * - Provides functions to fetch administrator group members and all user identities.
 * - All requests require a Bearer token for authentication.
 * - Designed for use in the React frontend with Vite.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetch all identities (members of the Administrators group) from the backend API.
 * @param {Object} options
 * @param {string} [options.accessToken] - Optional Bearer token for authentication
 * @param {AbortSignal} [options.signal] - Optional abort signal for fetch cancellation
 * @returns {Promise<Object>} The full response JSON from the backend
 * @throws {Error} If the request fails
 */
export async function fetchIdentities({ accessToken, signal } = {}) {
  const url = `${BASE_URL}/identities`;
  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch identities');
  const data = await response.json();
  return data;
}

/**
 * Fetch all user aliases and IDs (for PO Owner selection) from the backend API.
 * @param {string} token - Bearer token for authentication
 * @returns {Promise<Array>} Array of user identity objects
 * @throws {Error} If the request fails
 */
export async function fetchAllIdentities(token) {
  const url = `${BASE_URL}/all-identities`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch identities');
  }
  const data = await response.json();
  return data.value || [];
}