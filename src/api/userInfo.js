/**
 * userInfo.js
 *
 * API utility function for fetching user information from the backend.
 *
 * - Provides a function to fetch the user's first name and related info for use in the React frontend.
 * - Uses the VITE_API_BASE_URL environment variable for all requests (set in the project root .env file).
 * - Supports Bearer token authentication for secure API access.
 * - Designed for use with a backend route at /api/user-info (proxied or direct).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Fetches the user's first name and related info from the backend API.
 * @param {Object} options - Options for the request.
 * @param {string} [options.username] - Optional username to query.
 * @param {string} [options.accessToken] - Optional Bearer token for authentication.
 * @param {AbortSignal} [options.signal] - Optional abort signal for fetch cancellation.
 * @returns {Promise<Object>} The user info object from the backend.
 * @throws {Error} If the request fails.
 */
export async function fetchUserFirstName({ username, accessToken, signal } = {}) {
  let url = `${BASE_URL}/user-info`;
  const params = [];
  if (username) {
    params.push(`username=${encodeURIComponent(username)}`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch user info');
  const data = await response.json();
  console.log('Fetched user info from backend API:', data); // Log the API response to the browser console
  return data;
}
