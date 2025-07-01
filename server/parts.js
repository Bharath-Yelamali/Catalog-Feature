const express = require('express');
const router = express.Router();

// Move these constants here since they're only used for parts
const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
const IMS_ODATA_URL = process.env.IMS_ODATA_URL || 'https://chievmimsiiss01/IMSStage/Server/odata';

// Centralized field configuration
const FIELD_CONFIG = {
  MAPPING: {
    'm_inventory_description': 'm_inventory_description',
    'm_mfg_part_number': 'm_mfg_part_number', 
    'm_mfg_name': 'm_mfg_name',
    'm_parent_ref_path': 'm_parent_ref_path',
    'm_custodian': 'm_custodian',
    'm_custodian@aras.keyed_name': 'm_custodian@aras.keyed_name',
    'm_inventory_item': 'm_inventory_item/item_number',
    'm_id': 'm_id',
    'item_number': 'item_number',
    'm_maturity': 'm_maturity',
    'm_quantity': 'm_quantity'
  },
  SELECT_FIELDS: [
    'm_parent_ref_path', 'm_inventory_description', 'm_mfg_part_number', 'm_mfg_name',
    'id', 'm_id', 'm_custodian', 'classification', 'm_quantity', 'm_maturity',
    'item_number', 'spare_value'
  ],
  EXPAND_FIELDS: [
    'm_inventory_item($select=item_number)',
    'm_project($select=item_number,keyed_name,m_name)'
  ],
  SEARCH_FIELDS: [
    'm_inventory_item', 'm_mfg_part_number', 'm_mfg_name', 'm_parent_ref_path',
    'm_inventory_description', 'm_custodian@aras.keyed_name', 'm_custodian',
    'm_id', 'item_number'
  ]
};

// Helper function to check if a field parameter has values
function hasFieldValues(fieldValue) {
  if (!fieldValue) return false;
  
  if (Array.isArray(fieldValue)) {
    return fieldValue.some(v => v && v.trim() !== '');
  }
  
  return typeof fieldValue === 'string' && fieldValue.trim() !== '';
}

/**
 * Build OData filter clauses from field-specific query parameters
 * @param {Object} fieldParams - Object containing field/value pairs from query string
 * @returns {Array} Array of OData filter strings
 */
function buildFieldFilters(fieldParams) {
  const filters = [];
  
  Object.entries(fieldParams).forEach(([field, value]) => {
    if (!value) return;
    
    const odataField = FIELD_CONFIG.MAPPING[field] || field;
    
    // Skip fields with @ symbols for OData filtering (handle client-side)
    if (field.includes('@')) {
      console.log(`Skipping field with @ symbol for OData filtering: ${field}`);
      return;
    }
    
    // Handle both single values and arrays
    const values = Array.isArray(value) ? value : [value];
    const validValues = values.filter(v => v && v.trim() !== '');
    
    if (validValues.length === 0) return;
    
    // Separate positive and negative filters
    const positiveFilters = [];
    const negativeFilters = [];
    
    validValues.forEach(val => {
      const trimmedValue = val.trim();
      const isNot = trimmedValue.startsWith('!');
      const actualValue = isNot ? trimmedValue.substring(1).trim() : trimmedValue;
      
      if (!actualValue) return;
      
      // Build appropriate filter clause
      if (field === 'm_quantity') {
        const numValue = parseFloat(actualValue);
        if (!isNaN(numValue)) {
          const filterClause = `${odataField} eq ${numValue}`;
          if (isNot) {
            negativeFilters.push(filterClause);
          } else {
            positiveFilters.push(filterClause);
          }
        }
      } else {
        const escapedValue = actualValue.replace(/'/g, "''");
        const filterClause = `contains(${odataField}, '${escapedValue}')`;
        if (isNot) {
          negativeFilters.push(filterClause);
        } else {
          positiveFilters.push(filterClause);
        }
      }
    });
    
    // Combine positive filters with OR (any match is good)
    if (positiveFilters.length > 0) {
      if (positiveFilters.length === 1) {
        filters.push(positiveFilters[0]);
      } else {
        filters.push(`(${positiveFilters.join(' or ')})`);
      }
    }
    
    // Combine negative filters with AND (exclude all)
    if (negativeFilters.length > 0) {
      negativeFilters.forEach(negFilter => {
        filters.push(`not (${negFilter})`);
      });
    }
  });
  
  return filters;
}

/**
 * Build OData query URL with filters, select, and expand clauses
 * @param {Object} params - Query parameters
 * @returns {string} Complete OData URL
 */
function buildODataUrl(params) {
  const { fieldParams, search, hasClientSideFilters } = params;
  
  let filterClauses = ["classification eq 'Inventoried'"];
  const fieldFilters = buildFieldFilters(fieldParams);
  
  if (fieldFilters.length > 0) {
    filterClauses.push(...fieldFilters);
    console.log('Added field-specific filters:', fieldFilters);
  }
  
  const queryParts = [
    `$filter=${filterClauses.join(' and ')}`,
    `$select=${FIELD_CONFIG.SELECT_FIELDS.join(',')}`,
    `$expand=${FIELD_CONFIG.EXPAND_FIELDS.join(',')}`
  ];
  
  // Add $top limit if no specific filtering is applied
  const hasFieldFilters = fieldFilters.length > 0;
  if ((!search || search.trim() === '') && !hasFieldFilters && !hasClientSideFilters) {
    queryParts.push('$top=500');
  }
  
  return `${BASE_URL}m_Instance?${queryParts.join('&')}`;
}

/**
 * Group parts by inventory item number and calculate totals
 * @param {Array} parts - Raw parts data
 * @returns {Array} Grouped and processed parts
 */
function groupAndProcessParts(parts) {
  const grouped = {};
  
  // Group by inventory item number
  for (const part of parts) {
    const itemNumber = part.m_inventory_item?.item_number || 'Unknown';
    if (!grouped[itemNumber]) {
      grouped[itemNumber] = { instances: [], total: 0, spare: 0 };
    }
    grouped[itemNumber].instances.push(part);
    
    // Calculate totals
    const qty = Number(part.m_quantity);
    if (!isNaN(qty)) {
      grouped[itemNumber].total += qty;
      
      // Check if this is spare inventory
      const proj = part.m_project;
      if (proj?.item_number === 'General Inventory' && 
          proj?.keyed_name === 'General Inventory' && 
          proj?.m_name === 'General Inventory') {
        grouped[itemNumber].spare += qty;
      }
    }
  }
  
  // Flatten and attach computed values
  return Object.entries(grouped).flatMap(([itemNumber, group]) => {
    const { total = 0, spare = 0 } = group;
    const inUse = total - spare;
    
    return group.instances.map(instance => ({
      ...instance,
      total,
      inUse,
      spare,
      generalInventory: isGeneralInventory(instance.m_project)
    }));
  });
}

/**
 * Check if a project represents general inventory
 * @param {*} proj - Project data
 * @returns {boolean} True if general inventory
 */
function isGeneralInventory(proj) {
  if (!proj) return false;
  
  if (Array.isArray(proj)) {
    return proj.some(p => typeof p === 'string' && 
                     p.trim().toLowerCase() === 'general inventory');
  }
  
  if (typeof proj === 'string') {
    return proj.trim().toLowerCase() === 'general inventory';
  }
  
  if (typeof proj === 'object') {
    return ['item_number', 'keyed_name', 'm_name'].some(
      key => proj[key]?.trim()?.toLowerCase() === 'general inventory'
    );
  }
  
  return false;
}

/**
 * Apply backend search filtering with keyword logic
 * @param {Array} results - Parts to filter
 * @param {string} search - Search string
 * @returns {Array} Filtered results with match highlighting
 */
function applySearchFilter(results, search) {
  const terms = search.split(',').map(s => s.trim()).filter(Boolean);
  const includeKeywords = [];
  const excludeKeywords = [];
  
  // Parse include/exclude keywords
  terms.forEach(term => {
    if (term.startsWith('!') || term.startsWith('-')) {
      excludeKeywords.push(term.slice(1).toLowerCase());
    } else {
      includeKeywords.push(term.toLowerCase());
    }
  });
  
  // Fast filter using concatenated string
  const fastFiltered = results.filter(part => {
    const searchableText = [
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
    
    return includeKeywords.every(kw => searchableText.includes(kw)) &&
           excludeKeywords.every(nk => !searchableText.includes(nk));
  });
  
  // Add match highlighting information
  return fastFiltered.map(part => {
    const matches = {};
    
    FIELD_CONFIG.SEARCH_FIELDS.forEach(field => {
      const value = field === 'm_inventory_item' 
        ? part.m_inventory_item?.item_number 
        : part[field];
      
      if (!value) return;
      
      const valueStr = String(value).toLowerCase();
      includeKeywords.forEach(keyword => {
        if (valueStr.includes(keyword)) {
          if (!matches[field]) matches[field] = [];
          if (!matches[field].includes(keyword)) {
            matches[field].push(keyword);
          }
        }
      });
    });
    
    // Only include if all keywords matched
    const allMatched = includeKeywords.every(kw =>
      Object.values(matches).some(arr => arr.includes(kw))
    );
    
    return allMatched ? { ...part, _matches: matches } : null;
  }).filter(Boolean);
}

/**
 * Apply highlighting for field-specific searches
 * @param {Array} results - Results to add highlighting to
 * @param {Object} fieldParams - Field parameters with search values
 * @returns {Array} Results with _matches property added
 */
function applyFieldHighlighting(results, fieldParams) {
  return results.map(part => {
    const matches = {};
    
    Object.entries(fieldParams).forEach(([field, searchValue]) => {
      if (!searchValue) return;
      
      // Handle both single values and arrays
      const values = Array.isArray(searchValue) ? searchValue : [searchValue];
      const validValues = values.filter(v => v && v.trim() !== '');
      
      if (validValues.length === 0) return;
      
      // Get the actual field value from the part and map field names correctly
      let value;
      let matchFieldName = field; // Default to the original field name
      
      if (field === 'm_inventory_item') {
        value = part.m_inventory_item?.item_number;
        matchFieldName = 'm_inventory_item'; // Frontend expects this key
      } else if (field === 'm_custodian@aras.keyed_name') {
        value = part["m_custodian@aras.keyed_name"];
        matchFieldName = 'm_custodian'; // Frontend expects 'm_custodian' for highlighting
      } else if (field === 'item_number') {
        value = part.item_number;
        matchFieldName = 'm_project'; // Frontend expects 'm_project' for project/item_number highlighting
      } else {
        value = part[field];
        matchFieldName = field;
      }
      
      if (!value) return;
      
      const valueStr = String(value).toLowerCase();
      
      // Process each search value
      validValues.forEach(searchVal => {
        const trimmedValue = searchVal.trim();
        const isNot = trimmedValue.startsWith('!');
        const keyword = (isNot ? trimmedValue.substring(1).trim() : trimmedValue).toLowerCase();
        
        if (!keyword) return;
        
        // For NOT searches, we still highlight the term (even though it's excluded)
        // This helps users see what was being filtered out
        if (valueStr.includes(keyword)) {
          if (!matches[matchFieldName]) matches[matchFieldName] = [];
          if (!matches[matchFieldName].includes(keyword)) {
            matches[matchFieldName].push(keyword);
          }
        }
      });
    });
    
    return { ...part, _matches: matches };
  });
}

/**
 * Apply client-side filtering for fields that can't be handled in OData
 * @param {Array} results - Results to filter
 * @param {Object} fieldParams - Field parameters
 * @returns {Array} Filtered results
 */
function applyClientSideFilters(results, fieldParams) {
  const clientSideFilters = Object.entries(fieldParams).filter(([field]) => field.includes('@'));
  
  if (clientSideFilters.length === 0) return results;
  
  console.log('Applying client-side filters for @ fields:', clientSideFilters);
  
  return results.filter(part => {
    return clientSideFilters.every(([field, value]) => {
      if (!value) return true;
      
      // Handle both single values and arrays
      const values = Array.isArray(value) ? value : [value];
      const validValues = values.filter(v => v && v.trim() !== '');
      
      if (validValues.length === 0) return true;
      
      const fieldValue = field === 'm_custodian@aras.keyed_name' 
        ? part["m_custodian@aras.keyed_name"] 
        : part[field];
      
      // Separate positive and negative filters
      const positiveMatches = [];
      const negativeMatches = [];
      
      validValues.forEach(val => {
        const trimmedValue = val.trim();
        const isNot = trimmedValue.startsWith('!');
        const actualValue = isNot ? trimmedValue.substring(1).trim() : trimmedValue;
        
        if (!actualValue) return;
        
        if (!fieldValue) {
          // If no field value, NOT filters should pass, regular filters should fail
          if (isNot) {
            negativeMatches.push(true);
          } else {
            positiveMatches.push(false);
          }
          return;
        }
        
        const matches = String(fieldValue).toLowerCase().includes(actualValue.toLowerCase());
        
        if (isNot) {
          negativeMatches.push(!matches); // NOT filter: invert the result
        } else {
          positiveMatches.push(matches); // Regular filter: direct result
        }
      });
      
      // For positive filters: at least one must match (OR logic)
      const positiveResult = positiveMatches.length === 0 || positiveMatches.some(match => match);
      
      // For negative filters: all must be true (AND logic - exclude all specified values)
      const negativeResult = negativeMatches.length === 0 || negativeMatches.every(match => match);
      
      return positiveResult && negativeResult;
    });
  });
}

// /parts endpoint (not /api/parts)
router.get('/parts', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid access token. Please log in.' });
    }

    // Parse query parameters
    const { search, classification, $top, filterType, ...fieldParams } = req.query;
    const hasClientSideFilters = Object.keys(fieldParams).some(field => 
      field.includes('@') && hasFieldValues(fieldParams[field])
    );
    
    // Build and execute OData query
    const odataUrl = buildODataUrl({ fieldParams, search, hasClientSideFilters });
    console.log('Final OData URL:', odataUrl);
    
    const fetchStart = Date.now();
    const response = await fetch(odataUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fetchTime = Date.now() - fetchStart;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OData API error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: `Failed to fetch parts from external API (status ${response.status}): ${errorText}` 
      });
    }

    // Process results
    const data = await response.json();
    let results = data.value || [];
    
    // Group and calculate totals
    const groupStart = Date.now();
    results = groupAndProcessParts(results);
    const groupTime = Date.now() - groupStart;
    
    // Apply search filtering if needed
    let searchTime = 0;
    if (search?.trim()) {
      const searchStart = Date.now();
      results = applySearchFilter(results, search.trim());
      searchTime = Date.now() - searchStart;
    }
    
    // Apply client-side filtering for @ fields
    results = applyClientSideFilters(results, fieldParams);
    
    // Add highlighting for field-specific searches if we have field parameters and not a general search
    const hasFieldParams = Object.keys(fieldParams).some(field => hasFieldValues(fieldParams[field]));
    if (!search?.trim() && hasFieldParams) {
      results = applyFieldHighlighting(results, fieldParams);
    }
    
    // Apply result limit for default queries
    const hasFieldFilters = Object.keys(fieldParams).some(field => 
      !field.includes('@') && hasFieldValues(fieldParams[field])
    );
    if (!search?.trim() && !hasFieldFilters && !hasClientSideFilters) {
      results = results.slice(0, 500);
    }

    // Log performance metrics
    const totalTime = Date.now() - startTime;
    console.log('--- Performance Metrics ---');
    console.log(`OData fetch: ${fetchTime}ms`);
    console.log(`Grouping: ${groupTime}ms`);
    if (searchTime > 0) console.log(`Search filtering: ${searchTime}ms`);
    console.log(`Total: ${totalTime}ms`);
    
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
