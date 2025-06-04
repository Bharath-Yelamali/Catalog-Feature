require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// === OAuth Configuration (from .env) ===
const TOKEN_URL = process.env.ARAS_TOKEN_URL;
const USERNAME = process.env.ARAS_USERNAME;
const PASSWORD = process.env.ARAS_PASSWORD;
const DATABASE = process.env.ARAS_DATABASE;
const CLIENT_ID = process.env.ARAS_CLIENT_ID;
const SCOPE = process.env.ARAS_SCOPE;

// Token cache
let accessToken = null;
let tokenExpiry = null;

async function getToken() {
  // If token is valid, return it
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }
  // Request new token
  const payload = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    username: USERNAME,
    password: PASSWORD,
    scope: SCOPE,
    database: DATABASE
  });
  console.log('OAuth payload:', payload.toString());
  let response;
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload
    });
  } catch (err) {
    throw new Error('Network error while requesting OAuth token: ' + err.message);
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain OAuth token (status ${response.status}): ${errorText}`);
  }
  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry 1 minute before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

// Restrict CORS to only allow requests from your frontend
const allowedOrigin = 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend proxy server is running.');
});

// === Proxy Endpoint for Parts ===
// Remove database mapping, always use a single base URL
const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";

app.get('/api/parts', async (req, res) => {
  try {
    const token = await getToken();
    // Always fetch a limited set of inventoried parts
    let odataUrl = `${BASE_URL}m_Instance`;
    const { search, filterType } = req.query;
    // Always filter for classification 'Inventoried'
    let filterClauses = ["classification eq 'Inventoried'"];
    let queryParts = [
      `$filter=${filterClauses.join(' and ')}`
    ];
    // Always select only the specified fields
    const selectFields = [
      'm_parent_ref_path',
      'm_inventory_description',
      'm_mfg_part_number',
      'm_mfg_name',
      'id',
      'm_id',
      'm_custodian',
      'classification',
      'm_quantity',
      'm_maturity' // Added m_maturity
    ];
    queryParts.push(`$select=${selectFields.join(',')}`);
    // Expand related fields to get actual values
    const expandFields = [
      'm_inventory_item',
      'm_project'
    ];
    queryParts.push(`$expand=${expandFields.join(',')}`);
    // If search is empty, limit to top 500
    if (!search || search.trim() === '') {
      queryParts.push('$top=500');
    }
    odataUrl += '?' + queryParts.join('&');
    let response;
    try {
      response = await fetch(odataUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Network error while fetching parts:', err);
      return res.status(502).json({ error: 'Network error while fetching parts: ' + err.message });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch parts from external API (status ${response.status}): ${errorText}`);
      return res.status(response.status).json({ error: `Failed to fetch parts from external API (status ${response.status}): ${errorText}` });
    }
    const data = await response.json();
    // Log the first part to debug missing fields
    if (data.value && data.value.length > 0) {
      console.log('First part from OData API:', JSON.stringify(data.value[0], null, 2));
    }
    let results = data.value || [];
    // Group by inventory item number and sum quantities for total and spare
    const grouped = {};
    for (const part of results) {
      const itemNumber = part.m_inventory_item?.item_number || 'Unknown';
      if (!grouped[itemNumber]) grouped[itemNumber] = { instances: [], total: 0, spare: 0 };
      grouped[itemNumber].instances.push(part);
      // Add m_quantity to total if it is a number
      const qty = Number(part.m_quantity);
      if (!isNaN(qty)) {
        grouped[itemNumber].total += qty;
        // Check for spare: m_project fields all equal 'General Inventory'
        const proj = part.m_project;
        if (
          proj &&
          proj.item_number === 'General Inventory' &&
          proj.keyed_name === 'General Inventory' &&
          proj.m_name === 'General Inventory'
        ) {
          grouped[itemNumber].spare += qty;
        }
      }
    }
    // Attach total and spare to each instance for frontend display
    results = Object.entries(grouped).flatMap(([itemNumber, group]) => {
      const spareValue = group.spare !== undefined && group.spare !== null ? group.spare : 0;
      const totalValue = group.total !== undefined && group.total !== null ? group.total : 0;
      // Always ensure inUse is a number and never undefined/null
      const inUseValue = Number(totalValue) - Number(spareValue);
      return group.instances.map(instance => ({
        ...instance,
        total: totalValue,
        inUse: inUseValue,
        spare: spareValue
      }));
    });
    // Backend-side filtering for search
    if (search && search.trim() !== '') {
      const searchVal = search.trim().toLowerCase();
      // Map filterType to field(s)
      const fieldMap = {
        itemNumber: part => part.m_inventory_item?.item_number,
        manufacturerPartNumber: part => part.m_mfg_part_number,
        manufacturerName: part => part.m_mfg_name,
        parentPath: part => part.m_parent_ref_path,
        inventoryDescription: part => part.m_inventory_description || part.m_description,
        hardwareCustodian: part => part["m_custodian@aras.keyed_name"] || part.m_custodian,
        id: part => part.m_id, // search on m_id, not id
        all: part => [
          part.m_inventory_item?.item_number,
          part.m_mfg_part_number,
          part.m_mfg_name,
          part.m_parent_ref_path,
          part.m_inventory_description,
          part.m_description,
          part["m_custodian@aras.keyed_name"],
          part.m_custodian,
          part.m_id
        ].filter(Boolean).join(' || ')
      };
      const getField = fieldMap[filterType] || fieldMap['all'];
      results = results.filter(part => {
        const value = getField(part);
        if (!value) return false;
        if (Array.isArray(value)) {
          return value.some(v => typeof v === 'string' && v.toLowerCase().includes(searchVal));
        }
        return typeof value === 'string' && value.toLowerCase().includes(searchVal);
      });
    }
    // If search is empty, limit results to 500 (in case OData $top is ignored)
    if (!search || search.trim() === '') {
      results = results.slice(0, 500);
    }
    res.json({ value: results });
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
