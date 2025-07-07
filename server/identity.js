/**
 * identity.js
 * Express router for identity-related endpoints.
 * 
 * Provides REST API endpoints to fetch:
 *   - All administrator members from Aras Innovator ("Administrators" group)
 *   - All user identities (id, alias, name) from Aras Innovator
 * 
 * Used for user management, permissions, and populating user dropdowns in the frontend.
 * 
 * Requires a Bearer token in the Authorization header for all endpoints.
 * 
 * Fields used:
 *   - For /api/identities: id, related_id (expanded user/member info)
 *   - For /api/all-identities: id, login_name, first_name, last_name
 * 
 * Return values:
 *   - { value: [ ... ] } where ... is an array of user/member objects
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";

function extractBearerToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring('Bearer '.length);
  }
  return null;
}

/**
 * GET /api/identities
 *
 * Returns all members of the "Administrators" group from Aras Innovator.
 *
 * Requires:
 *   - Bearer token in Authorization header
 *
 * Process:
 *   1. Fetches the "Administrators" identity to get its id.
 *   2. Fetches all members (users) related to that group via the Member relationship.
 *   3. Returns the expanded related_id (the actual user/member info).
 *
 * Fields used: id, related_id
 *
 * Return value:
 *   - { value: [ {id, ...user fields} ] }
 *   - 400 if missing token, 404 if not found, 500 on error
 */
router.get('/identities', async (req, res) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  try {
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

/**
 * GET /api/all-identities
 *
 * Returns all user identities (id, alias, name) from Aras Innovator.
 *
 * Requires:
 *   - Bearer token in Authorization header
 *
 * Fields used: id, login_name, first_name, last_name
 *
 * Return value:
 *   - { value: [ {id, alias, name} ] }
 *   - 400 if missing token, 500 on error
 */
router.get('/all-identities', async (req, res) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  try {
    let odataUrl = `${BASE_URL}User?$select=id,login_name,first_name,last_name`;
    const response = await fetch(odataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to fetch identities: ${errorText}` });
    }
    const data = await response.json();
    const identities = (data.value || []).map(u => ({
      id: u.id,
      alias: u.login_name,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.login_name
    }));
    return res.json({ value: identities });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

module.exports = router;