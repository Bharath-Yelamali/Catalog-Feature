const express = require('express');
const router = express.Router();

const BASE_URL = process.env.IMS_ODATA_URL || 'https://chievmimsiiss01/IMSStage/Server/odata/';

// GET /api/suppliers - fetch all suppliers from m_Supplier entity
router.get('/suppliers', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length);
    }
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid access token. Please log in.' });
    }
    // Build OData query for m_Supplier
    let odataUrl = `${BASE_URL}m_Supplier?$select=id,keyed_name,m_name`;
    // Optionally add $top or $filter here if needed
    const response = await fetch(odataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to fetch suppliers: ${errorText}` });
    }
    const data = await response.json();
    // Map to a simple list for the frontend
    const suppliers = (data.value || []).map(s => ({
      id: s.id,
      name: s.keyed_name || s.m_name || 'Unnamed Supplier'
    }));
    res.json({ value: suppliers });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;
