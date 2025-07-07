/**
 * project.js
 * 
 * Express router for project-related API endpoints.
 * 
 * Responsibilities:
 *   - Securely fetches project data from the IMS OData backend (m_Project entity)
 *   - Maps and returns a simplified project list for frontend consumption
 * 
 * All endpoints require a valid Bearer token in the Authorization header.
 * 
 * Environment Variables:
 *   - IMS_ODATA_URL: Base URL for the IMS OData API (defaults to on-prem URL if not set)
 * 
 * Exports:
 *   - Express router with /projects endpoint
 */

const express = require('express');
const router = express.Router();

const BASE_URL = process.env.IMS_BASE_URL;

/**
 * @route   GET /projects
 * @desc    Fetch all projects from the IMS OData backend (m_Project entity).
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
 *     - id: Project's unique identifier
 *     - name: User-friendly project name (prefers keyed_name, then m_name, then item_number)
 *   - 401 Unauthorized: { error: string }
 *   - 500 Internal Server Error: { error: string }
 */
router.get('/projects', async (req, res) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length);
    }
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid access token. Please log in.' });
    }

    // Build OData query for m_Project entity, selecting key fields
    let odataUrl = `${BASE_URL}m_Project?$select=id,item_number,keyed_name,m_name`;
    // Optionally add $top or $filter here if needed for pagination/filtering

    // Fetch projects from OData backend
    const response = await fetch(odataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle OData errors
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to fetch projects: ${errorText}` });
    }

    // Parse and map OData response to simplified project list
    const data = await response.json();
    const projects = (data.value || []).map(p => ({
      id: p.id,
      name: p.keyed_name || p.m_name || p.item_number || 'Unnamed Project'
    }));

    // Return project list to client
    res.json({ value: projects });
  } catch (err) {
    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;
