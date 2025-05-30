// Fetch all parts from the backend API
export async function fetchParts() {
  const response = await fetch('http://localhost:3001/api/parts');
  if (!response.ok) throw new Error('Failed to fetch parts');
  return response.json();
}
