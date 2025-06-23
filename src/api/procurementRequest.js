// src/api/procurementRequest.js
// API utility for posting procurement requests and files

export async function postProcurementRequest(request, accessToken, isFormData = false) {
  const url = 'http://localhost:3001/api/m_Procurement_Request';
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

export async function postProcurementRequestFile(file, source_id, accessToken, extraFields = {}) {
  const url = 'http://localhost:3001/api/m_Procurement_Request_Files';
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
