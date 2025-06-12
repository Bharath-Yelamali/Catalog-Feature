// server/orders.js
// REST endpoint to get purchase requests/orders for the current user from IMS

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// GET /orders
router.get('/orders', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  
  const searchTerm = req.query.search ? req.query.search.trim() : '';

  try {
    // Fetch top 50 records from m_Procurement_Request sorted by created_on descending
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    const orderBy = `$orderby=${encodeURIComponent('created_on desc')}`;
    const top = `$top=50`;
    
    // Add filter if search term is provided - filter by keyed_name containing the search term
    const filter = searchTerm 
      ? `&$filter=contains(keyed_name,'${encodeURIComponent(searchTerm)}')`
      : '';
    
    // Use $select=* to request all available properties, including those with null values
    const select = "$select=*";
    const odataUrl = `${BASE_URL}m_Procurement_Request?${orderBy}&${top}&${select}${filter}`;
    
    const imsResp = await fetch(odataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!imsResp.ok) {
      const text = await imsResp.text();
      return res.status(imsResp.status).json({ error: `IMS error: ${text}` });
    }
    const imsData = await imsResp.json();
    // Only send the raw IMS response to the frontend for browser console logging
    return res.json({ imsRaw: imsData });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

module.exports = router;
