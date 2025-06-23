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
