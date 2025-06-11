// server/identity.js
// REST endpoint to get all administrator members from Aras Innovator

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// GET /api/identities
router.get('/identities', async (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  try {
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    // Step 1: Get the 'Administrators' identity to find its id
    const identityUrl = `${BASE_URL}Identity?$filter=name eq 'Administrators'`;
    const identityResp = await fetch(identityUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const identityText = await identityResp.text();
    let identityData;
    try {
      identityData = JSON.parse(identityText);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse Aras Identity response', details: identityText });
    }
    if (!Array.isArray(identityData.value) || identityData.value.length === 0) {
      return res.status(404).json({ error: 'No administrators identity found' });
    }
    const adminIdentity = identityData.value[0];
    if (!adminIdentity.id) {
      return res.status(500).json({ error: 'Administrators identity missing id', details: adminIdentity });
    }
    // Step 2: Get members from the Member relationship table
    const memberUrl = `${BASE_URL}Member?$filter=source_id eq '${adminIdentity.id}'&$expand=related_id`;
    const memberResp = await fetch(memberUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const memberText = await memberResp.text();
    let memberData;
    try {
      memberData = JSON.parse(memberText);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse Aras Member response', details: memberText });
    }
    if (!Array.isArray(memberData.value)) {
      return res.status(404).json({ error: 'No members found for administrators' });
    }
    // Return the expanded related_id (the actual user/member info)
    const members = memberData.value.map(m => m.related_id).filter(Boolean);
    return res.json({ value: members });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch identities' });
  }
});

module.exports = router;
