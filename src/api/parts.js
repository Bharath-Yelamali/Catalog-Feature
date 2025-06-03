// Fetch all parts from the backend API
export async function fetchParts({ classification, top } = {}) {
  let url = 'http://localhost:3001/api/parts';
  const params = [];
  if (classification) {
    params.push(`classification=${encodeURIComponent(classification)}`);
  }
  if (top) {
    params.push(`$top=${top}`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch parts');
  const data = await response.json();
  console.log('Fetched parts from backend API:', data); // Log the API response to the terminal
  return data;
}
