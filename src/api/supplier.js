/**
 * supplier.js
 *
 * API utility function for fetching supplier data from the backend.
 *
 * - Provides a function to fetch all suppliers for use in the React frontend.
 * - Supports Bearer token authentication for secure API access.
 * - Designed for use with a backend route at /api/suppliers (proxied or direct).
 */

// src/api/supplier.js
export async function fetchSuppliers(token) {
  const response = await fetch('/api/suppliers', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch suppliers');
  }
  const data = await response.json();
  return data.value || [];
}
