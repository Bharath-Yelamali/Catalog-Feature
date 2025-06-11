// src/api/userInfo.js
// Fetch the user's first name from the backend API
export async function fetchUserFirstName({ username, accessToken, signal } = {}) {
  let url = 'http://localhost:3001/api/user-info';
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
