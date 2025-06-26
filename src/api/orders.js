// src/api/orders.js
// API utility for fetching orders for the current user

export async function fetchOrders(username, token, searchTerm = '', searchField = 'orderName') {
  if (!username || !token) throw new Error('Missing username or token');
  
  // Map UI field to backend OData field
  let fieldParam = 'keyed_name';
  if (searchField === 'createdBy') fieldParam = 'created_by_id/keyed_name';

  // Add cache-busting and search parameters
  const cacheBuster = Date.now();
  const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
  const fieldQuery = `&field=${encodeURIComponent(fieldParam)}`;

  const resp = await fetch(
    `/api/orders?username=${encodeURIComponent(username)}&cb=${cacheBuster}${searchParam}${fieldQuery}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to fetch orders: ${err}`);
  }
  
  const data = await resp.json();
  return data;
}
