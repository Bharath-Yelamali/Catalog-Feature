// Fetch all parts from the backend API
export async function fetchParts({ classification, top, search, filterType, signal, accessToken } = {}) {
  let url = 'http://localhost:3001/api/parts';
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
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  console.log('Frontend API request URL:', url); // Debug: log the request URL
  const headers = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error('Failed to fetch parts');
  const data = await response.json();
  console.log('Fetched parts from backend API:', data); // Log the API response to the terminal
  return data;
}
