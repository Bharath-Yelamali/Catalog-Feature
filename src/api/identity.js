// src/api/identity.js
// Fetch all identities from the backend API
export async function fetchIdentities({ accessToken, signal } = {}) {
  let url = 'http://localhost:3001/api/identities';
  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch identities');
  const data = await response.json();
  return data;
}
