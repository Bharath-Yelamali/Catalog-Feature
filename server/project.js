const express = require('express');
const router = express.Router();

const BASE_URL = process.env.IMS_ODATA_URL || 'https://chievmimsiiss01/IMSStage/Server/odata/';

// GET /api/projects - fetch all projects from m_Project entity
router.get('/projects', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length);
    }
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid access token. Please log in.' });
    }
    // Build OData query for m_Project
    let odataUrl = `${BASE_URL}m_Project?$select=id,item_number,keyed_name,m_name`;
    // Optionally add $top or $filter here if needed
    const response = await fetch(odataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to fetch projects: ${errorText}` });
    }
    const data = await response.json();
    // Map to a simple list for the frontend
    const projects = (data.value || []).map(p => ({
      id: p.id,
      name: p.keyed_name || p.m_name || p.item_number || 'Unnamed Project'
    }));
    res.json({ value: projects });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;