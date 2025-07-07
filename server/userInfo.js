/**
 * userInfo.js
 *
 * Express router for user information API endpoints.
 *
 * Responsibilities:
 *   - Securely fetches a user's first and last name from the IMS OData backend (User entity)
 *   - Requires a valid Bearer token in the Authorization header
 *
 * Environment Variables:
 *   - IMS_BASE_URL: Base URL for the IMS OData API
 *
 * Exports:
 *   - Express router with /user-info endpoint
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Use IMS_BASE_URL from environment variable
const BASE_URL = process.env.IMS_BASE_URL;

/**
 * @route   GET /user-info
 * @desc    Fetch a user's first and last name from the IMS OData backend (User entity).
 * @access  Protected (requires Bearer token)
 *
 * Request Headers:
 *   - Authorization: Bearer <access_token>
 *
 * Query Parameters:
 *   - username: The login name of the user to look up (required)
 *
 * Response:
 *   - 200 OK: { firstName: string, lastName: string }
 *   - 400 Bad Request: { error: string } (missing username or token)
 *   - 404 Not Found: { error: string } (user not found)
 *   - 500 Internal Server Error: { error: string }
 */
router.get('/user-info', async (req, res) => {
  const username = req.query.username;
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!username || !token) {
    return res.status(400).json({ error: 'Missing username or Authorization header' });
  }
  try {
    // Build OData query for User table with proper URL encoding
    // Note: Only the filter value is encoded, not the comma in $select
    const filter = `$filter=${encodeURIComponent(`login_name eq '${username}'`)}`;
    const select = `$select=first_name,last_name`;
    const odataUrl = `${BASE_URL}User?${filter}&${select}`;
    const userResp = await fetch(odataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userText = await userResp.text();
    let userData;
    try {
      userData = JSON.parse(userText);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse Aras response', details: userText });
    }
    if (!userData.value || !userData.value.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const firstName = userData.value[0].first_name || '';
    const lastName = userData.value[0].last_name || '';
    return res.json({ firstName, lastName });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch user info' });
  }
});

module.exports = router;
