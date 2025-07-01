const express = require('express');
const router = express.Router();

// Move these constants here since they're only used for parts
const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
const IMS_ODATA_URL = process.env.IMS_ODATA_URL || 'https://chievmimsiiss01/IMSStage/Server/odata';

// /parts endpoint (not /api/parts)
router.get('/parts', async (req, res) => {
  try {
    const overallStart = Date.now();
    // Get access token from Authorization header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length);
    }
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid access token. Please log in.' });
    }
    // Always fetch a limited set of inventoried parts
    let odataUrl = `${BASE_URL}m_Instance`;
    const { search } = req.query; // Removed filterType
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
      'm_maturity',
      'item_number',
      'spare_value' // Added spare_value to select fields
    ];
    queryParts.push(`$select=${selectFields.join(',')}`);
    // Expand related fields to get only needed values
    const expandFields = [
      'm_inventory_item($select=item_number)', // Only fetch item_number from m_inventory_item
      'm_project($select=item_number,keyed_name,m_name)' // Only fetch needed fields from m_project
    ];
    queryParts.push(`$expand=${expandFields.join(',')}`);
    // If search is empty, limit to top 500
    if (!search || search.trim() === '') {
      queryParts.push('$top=500');
    }
    odataUrl += '?' + queryParts.join('&');
    let response;
    const fetchStart = Date.now();
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
    const fetchEnd = Date.now();
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch parts from external API (status ${response.status}): ${errorText}`);
      return res.status(response.status).json({ error: `Failed to fetch parts from external API (status ${response.status}): ${errorText}` });
    }
    const data = await response.json();
    let results = data.value || [];
    const groupStart = Date.now();
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
    const groupEnd = Date.now();
    // Attach total and spare to each instance for frontend display
    const attachStart = Date.now();
    results = Object.entries(grouped).flatMap(([itemNumber, group]) => {
      const spareValue = group.spare !== undefined && group.spare !== null ? group.spare : 0;
      const totalValue = group.total !== undefined && group.total !== null ? group.total : 0;
      // Always ensure inUse is a number and never undefined/null
      const inUseValue = Number(totalValue) - Number(spareValue);
      return group.instances.map(instance => {
        // Compute generalInventory boolean for each instance
        let generalInventory = false;
        const proj = instance.m_project;
        if (proj) {
          // If m_project is an array, check if any value is 'General Inventory' (case-insensitive)
          if (Array.isArray(proj)) {
            generalInventory = proj.some(p => typeof p === 'string' && p.trim().toLowerCase() === 'general inventory');
          } else if (typeof proj === 'string') {
            generalInventory = proj.trim().toLowerCase() === 'general inventory';
          } else if (typeof proj === 'object') {
            // If m_project is an object, check common fields
            generalInventory = ['item_number', 'keyed_name', 'm_name'].some(
              key => proj[key] && typeof proj[key] === 'string' && proj[key].trim().toLowerCase() === 'general inventory'
            );
          }
        }
        return {
          ...instance,
          total: totalValue,
          inUse: inUseValue,
          spare: spareValue,
          generalInventory
        };
      });
    });
    const attachEnd = Date.now();
    // Backend-side filtering for search
    let searchStart, searchEnd;
    if (search && search.trim() !== '') {
      searchStart = Date.now();
      // Comma-separated AND/NOT logic: e.g. Rail, Delta, !Mark
      const terms = search.split(',').map(s => s.trim()).filter(Boolean);
      const includeKeywords = [];
      const excludeKeywords = [];
      for (const term of terms) {
        if (term.startsWith('!') || term.startsWith('-')) {
          excludeKeywords.push(term.slice(1).toLowerCase());
        } else {
          includeKeywords.push(term.toLowerCase());
        }
      }
      // Search all fields (no filterType logic)
      const allFields = [
        'm_inventory_item', // will check .item_number
        'm_mfg_part_number',
        'm_mfg_name',
        'm_parent_ref_path',
        'm_inventory_description',
        'm_custodian@aras.keyed_name',
        'm_custodian',
        'm_id',
        'item_number',
      ];
      // Step 1: Initial fast filter using big string
      const fastFiltered = results.filter(part => {
        // Build big string for this part
        const bigString = [
          part.m_inventory_item?.item_number,
          part.m_mfg_part_number,
          part.m_mfg_name,
          part.m_parent_ref_path,
          part.m_inventory_description,
          part["m_custodian@aras.keyed_name"],
          part.m_custodian,
          part.m_id,
          part.item_number,
          part.m_maturity
        ].filter(Boolean).join(' || ').toLowerCase();
        return includeKeywords.every(kw => bigString.includes(kw)) &&
               excludeKeywords.every(nk => !bigString.includes(nk));
      });
      // Step 2: Field-level match analysis for highlighting
      results = fastFiltered.map(part => {
        const matches = {};
        for (const field of allFields) {
          let value;
          if (field === 'm_inventory_item') {
            value = part.m_inventory_item?.item_number;
          } else {
            value = part[field];
          }
          if (!value) continue;
          const valStr = String(value).toLowerCase();
          for (const kw of includeKeywords) {
            if (valStr.includes(kw)) {
              if (!matches[field]) matches[field] = [];
              if (!matches[field].includes(kw)) matches[field].push(kw);
            }
          }
        }
        // Only include if all includeKeywords matched somewhere in the part
        const allMatched = includeKeywords.every(kw =>
          Object.values(matches).some(arr => arr.includes(kw))
        );
        if (allMatched) {
          return { ...part, _matches: matches };
        }
        return null;
      }).filter(Boolean);
      searchEnd = Date.now();
    }
    // If search is empty, limit results to 500 (in case OData $top is ignored)
    if (!search || search.trim() === '') {
      results = results.slice(0, 500);
    }
    const overallEnd = Date.now();
    console.log('--- Timing Breakdown for /parts ---');
    console.log('OData fetch:', (fetchEnd - fetchStart) + 'ms');
    console.log('Grouping:', (groupEnd - groupStart) + 'ms');
    console.log('Attach totals:', (attachEnd - attachStart) + 'ms');
    if (search && search.trim() !== '' && searchStart && searchEnd) {
      console.log('Backend search/filter:', (searchEnd - searchStart) + 'ms');
    }
    console.log('Total API time:', (overallEnd - overallStart) + 'ms');
    res.json({ value: results });
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// POST endpoint for new inventory item part (forwards to OData API)
router.post('/m_Inventory', async (req, res) => {
  try {
    const newPart = req.body;
    const token = req.headers['authorization']; // Bearer <token>
    const preferHeader = req.headers['prefer'] || 'return=representation';
    const odataUrl = 'https://chievmimsiiss01/IMSStage/Server/odata/m_Inventory';

    // Log the incoming request
    console.log('POST /api/m_Inventory called');
    console.log('Request body:', newPart);
    console.log('Authorization header:', token);
    console.log('Prefer header:', preferHeader);
    console.log('Forwarding to OData URL:', odataUrl);

    const response = await fetch(odataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Prefer': preferHeader,
      },
      body: JSON.stringify(newPart),
    });

    // Log OData response status and headers
    console.log('OData response status:', response.status);
    console.log('OData response headers:', response.headers.raw ? response.headers.raw() : response.headers);

    if (preferHeader === 'return=minimal' && response.status === 204) {
      res.status(204);
      if (response.headers.get('Location')) {
        res.set('Location', response.headers.get('Location'));
      }
      return res.send();
    } else if (response.status === 201) {
      const data = await response.json();
      res.status(201);
      if (response.headers.get('Location')) {
        res.set('Location', response.headers.get('Location'));
      }
      return res.json(data);
    } else {
      const errorText = await response.text();
      console.error('OData error response:', errorText);
      return res.status(response.status).send(errorText);
    }
  } catch (err) {
    console.error('Error adding new inventory part:', err);
    res.status(500).json({ error: 'Failed to add new inventory part: ' + err.message, stack: err.stack });
  }
});

// PATCH endpoint to update spare_value for a specific instance
router.patch('/m_Instance/:id/spare-value', async (req, res) => {
  const { id } = req.params;
  const { spare_value } = req.body;
  if (typeof spare_value !== 'number') {
    return res.status(400).json({ error: 'spare_value must be a number' });
  }
  // Accept Authorization and Prefer headers from the request
  const token = req.headers['authorization']; // Bearer <token>
  const preferHeader = req.headers['prefer'] || 'return=representation';
  try {    // Forward PATCH to IMS OData backend (m_Instance)
    const odataUrl = `${IMS_ODATA_URL}/m_Instance('${id}')`;
    // No debug logging for production
    const response = await fetch(odataUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': '*',
        ...(token ? { 'Authorization': token } : {}),
        'Prefer': preferHeader,
      },
      body: JSON.stringify({ spare_value }),
    });    if (!response.ok) {
      const text = await response.text();
      // Only log errors in case of failure
      return res.status(response.status).json({ error: text });
    }
    // Handle Location header if present
    if (response.headers.get('Location')) {
      res.set('Location', response.headers.get('Location'));
    }
    // Return the IMS response (could be 204 or 200)
    if (response.status === 204) return res.status(204).end();
    const data = await response.json();
    res.json(data);  } catch (err) {
    // Keep error logging in case of exceptions, but make it more concise
    res.status(500).json({ error: 'Failed to update spare_value in IMS: ' + err.message });
  }
});

module.exports = router;
