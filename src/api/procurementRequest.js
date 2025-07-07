/**
 * procurementRequest.js
 *
 * API utility functions for posting procurement requests and uploading related files to the backend server.
 *
 * - Uses the VITE_API_BASE_URL environment variable for all requests (set in the project root .env file).
 * - Provides functions to create procurement requests and upload files associated with those requests.
 * - All requests support Bearer token authentication.
 * - Designed for use in the React frontend with Vite.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Posts a new procurement request to the backend API.
 * @param {Object|FormData} request - The procurement request payload (JSON or FormData)
 * @param {string} accessToken - Bearer token for authentication
 * @param {boolean} [isFormData=false] - Whether the request is FormData (for file uploads)
 * @returns {Promise<Object>} The created procurement request object from the backend
 * @throws {Error} If the request fails
 */
export async function postProcurementRequest(request, accessToken, isFormData = false) {
  const url = `${BASE_URL}/m_Procurement_Request`;
  let headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  // If sending FormData, do not set Content-Type (browser will set it)
  const options = {
    method: 'POST',
    headers,
    body: isFormData ? request : JSON.stringify(request),
  };
  if (!isFormData) {
    options.headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Failed to add new procurement request');
  return await response.json();
}

/**
 * Uploads a file for a procurement request to the backend API.
 * @param {File|Blob} file - The file to upload
 * @param {string} source_id - The ID of the procurement request to attach the file to
 * @param {string} accessToken - Bearer token for authentication
 * @param {Object} [extraFields={}] - Additional fields to include in the form data
 * @returns {Promise<Object>} The created file object from the backend
 * @throws {Error} If the request fails
 */
export async function postProcurementRequestFile(file, source_id, accessToken, extraFields = {}) {
  const url = `${BASE_URL}/m_Procurement_Request_Files`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_id', source_id);
  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload procurement request file');
  return await response.json();
}
