// server/userInfo.js
// REST endpoint to get user's first name from Aras Innovator

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// GET /api/user-info?username=USERNAME
router.get('/user-info', async (req, res) => {
  const username = req.query.username;
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  // Log for debugging
  if (!username || !token) {
    return res.status(400).json({ error: 'Missing username or Authorization header' });
  }
  try {
    // Use the same base URL as /api/parts
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    // Build OData query for User table with proper URL encoding
    const filter = `$filter=${encodeURIComponent(`login_name eq '${username}'`)}`;
    // Do NOT encode the comma in $select, only the field names
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