/**
 * supplier.js
 *
 * Express router for supplier-related API endpoints.
 *
 * Responsibilities:
 *   - Securely fetches supplier data from the IMS OData backend (m_Supplier entity)
 *   - Maps and returns a simplified supplier list for frontend consumption
 *
 * All endpoints require a valid Bearer token in the Authorization header.
 *
 * Environment Variables:
 *   - IMS_ODATA_URL: Base URL for the IMS OData API (defaults to on-prem URL if not set)
 *
 * Exports:
 *   - Express router with /suppliers endpoint
 */

const express = require('express');
const router = express.Router();
const BASE_URL = process.env.IMS_BASE_URL;

/**
 * @route   GET /suppliers
 * @desc    Fetch all suppliers from the IMS OData backend (m_Supplier entity).
 * @access  Protected (requires Bearer token)
 *
 * Request Headers:
 *   - Authorization: Bearer <access_token>
 *
 * Query Parameters:
 *   - None (optionally, $top or $filter could be added for pagination/filtering)
 *
 * Response:
 *   - 200 OK: { value: [ { id: string, name: string } ] }
 *     - id: Supplier's unique identifier
 *     - name: User-friendly supplier name (prefers keyed_name, then m_name, else 'Unnamed Supplier')
 *   - 401 Unauthorized: { error: string }
 *   - 500 Internal Server Error: { error: string }
 */
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
