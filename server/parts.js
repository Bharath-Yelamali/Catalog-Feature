const express = require('express');
const router = express.Router();

// Move these constants here since they're only used for parts
const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";

// /parts endpoint (not /api/parts)
router.get('/parts', async (req, res) => {
  try {
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
      'm_maturity',
      'item_number',
      'spare_value' // Added spare_value to select fields
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
    // Backend-side filtering for search
    if (search && search.trim() !== '') {
      // Multi-keyword support: split on '+' and require all keywords to match
      const keywords = search.split('+').map(s => s.trim().toLowerCase()).filter(Boolean);
      // Map filterType to field(s)
      const fieldMap = {
        itemNumber: part => part.m_inventory_item?.item_number,
        manufacturerPartNumber: part => part.m_mfg_part_number,
        manufacturerName: part => part.m_mfg_name,
        parentPath: part => part.m_parent_ref_path,
        inventoryDescription: part => part.m_inventory_description || part.m_description,
        hardwareCustodian: part => part["m_custodian@aras.keyed_name"] || part.m_custodian,
        id: part => part.m_id, // search on m_id, not id
        serialNumber: part => part.item_number, // search on item_number field
        inventoryMaturity: part => part.m_maturity, // search on m_maturity field
        all: part => [
          part.m_inventory_item?.item_number,
          part.m_mfg_part_number,
          part.m_mfg_name,
          part.m_parent_ref_path,
          part.m_inventory_description,
          part.m_description,
          part["m_custodian@aras.keyed_name"],
          part.m_custodian,
          part.m_id,
          part.item_number,
          part.m_maturity
        ].filter(Boolean).join(' || ')
      };
      const getField = fieldMap[filterType] || fieldMap['all'];
      results = results.filter(part => {
        const value = getField(part);
        if (!value) return false;
        if (Array.isArray(value)) {
          // For array fields, check if all keywords are present in any value
          return keywords.every(kw => value.some(v => typeof v === 'string' && v.toLowerCase().includes(kw)));
        }
        // For string fields, check if all keywords are present
        return keywords.every(kw => typeof value === 'string' && value.toLowerCase().includes(kw));
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

module.exports = router;
