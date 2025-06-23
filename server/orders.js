// server/orders.js
// REST endpoint to get purchase requests/orders for the current user from IMS

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');

// Helper function to check if a string is a UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Configure multer with limits and file validation
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept common document types and images
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimes.join(', ')}`), false);
    }
  }
});

// Helper function to handle OData responses consistently
async function handleODataResponse(response, res) {
  const preferHeader = res.req.headers['prefer'] || 'return=representation';
  
  if (preferHeader === 'return=minimal' && response.status === 204) {
    res.status(204);
    if (response.headers.get('Location')) {
      res.set('Location', response.headers.get('Location'));
    }
    return res.send();
  } else if (response.status === 201 || response.status === 200) {
    const data = await response.json();
    res.status(response.status);
    if (response.headers.get('Location')) {
      res.set('Location', response.headers.get('Location'));
    }
    return res.json(data);
  } else {
    // Handle error responses
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: { message: errorText } };
    }
    console.error('OData error response:', errorData);
    
    return res.status(response.status).json({
      error: {
        status: response.status,
        message: errorData.error?.message || 'Unknown OData error',
        details: errorData,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Helper function to validate required fields
function validateRequiredFields(payload, requiredFields) {
  const missing = requiredFields.filter(field => !payload[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { valid: true };
}

// GET /orders
router.get('/orders', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  
  const searchTerm = req.query.search ? req.query.search.trim() : '';

  try {
    // Fetch top 50 records from m_Procurement_Request sorted by created_on descending
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    const orderBy = `$orderby=${encodeURIComponent('created_on desc')}`;
    const top = `$top=50`;
    
    // Add filter if search term is provided - filter by keyed_name containing the search term
    const filter = searchTerm 
      ? `&$filter=contains(keyed_name,'${encodeURIComponent(searchTerm)}')`
      : '';
    
    // Use $select=* to request all available properties, including those with null values
    const select = "$select=*";
    const odataUrl = `${BASE_URL}m_Procurement_Request?${orderBy}&${top}&${select}${filter}`;

    const imsResp = await fetch(odataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!imsResp.ok) {
      const text = await imsResp.text();
      return res.status(imsResp.status).json({ error: `IMS error: ${text}` });
    }
    const imsData = await imsResp.json();
    // Only send the raw IMS response to the frontend for browser console logging
    return res.json({ imsRaw: imsData });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

// GET /workflow-processes?orderItemNumber=REQ-000070
router.get('/workflow-processes', async (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const orderItemNumber = req.query.orderItemNumber;
  try {
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    let filter = '';
    if (orderItemNumber) {
      filter = `&$filter=keyed_name eq '${orderItemNumber}'`;
    }
    const select = "$select=*";
    const url = `${BASE_URL}Workflow Process?${select}${filter}`;
    console.log(`Fetching workflow process for orderItemNumber: ${orderItemNumber} with URL: ${url}`);
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `IMS error: ${text}` });
    }
    const data = await resp.json();
    let workflowProcesses = data.value || [];
    if (workflowProcesses.length > 0) {
      // Sort by created_on descending and return the most recent
      workflowProcesses.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
      const mostRecent = workflowProcesses[0];
      return res.json({ workflowProcess: mostRecent });
    } else {
      return res.json({ workflowProcess: null });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch workflow processes' });
  }
});

// GET /workflow-process-activities?workflowProcessId=xxxx
router.get('/workflow-process-activities', async (req, res) => {
  console.log('workflow-process-activities endpoint hit');
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring('Bearer '.length);
  }
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const workflowProcessId = req.query.workflowProcessId;
  try {
    const BASE_URL = "https://chievmimsiiss01/IMSStage/Server/odata/";
    let filter = '';
    if (workflowProcessId) {
      filter = `&$filter=source_id eq '${workflowProcessId}'`;
    }
    const select = "$select=*";
    const url = `${BASE_URL}Workflow Process Activity?${select}${filter}`;
    console.log(`Fetching workflow process activities for workflowProcessId: ${workflowProcessId} with URL: ${url}`);
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `IMS error: ${text}` });
    }
    const data = await resp.json();
    let activities = data.value || [];
    if (activities.length > 0) {
      // Sort by created_on descending and return the most recent
      activities.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
      const mostRecent = activities[0];
      return res.json({ workflowProcessActivity: mostRecent });
    } else {
      return res.json({ workflowProcessActivity: null });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch workflow process activities' });
  }
});

// POST endpoint for new procurement request with file upload (forwards to OData API)
// Single unified route that handles both multipart/form-data and JSON
router.post('/m_Procurement_Request', upload.single('m_quote'), async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ 
        error: {
          status: 401,
          message: 'Authorization token required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const preferHeader = req.headers['prefer'] || 'return=representation';
    const odataUrl = 'https://chievmimsiiss01/IMSStage/Server/odata/m_Procurement_Request';
    const contentType = req.headers['content-type'] || '';

    // Log the incoming request
    console.log(`--- Incoming /api/m_Procurement_Request (${contentType.includes('multipart') ? 'Multipart' : 'JSON'}) ---`);
    console.log('req.headers["content-type"]:', contentType);
    console.log('req.body:', req.body);
    if (req.file) console.log('req.file:', { 
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Required fields validation
    // Updated to match new payload: require IDs, not names/aliases
    // Either m_po_owner or poOwnerAlias is required, but we'll check for this separately
    const requiredFields = ['title', 'm_project', 'm_supplier'];    const validation = validateRequiredFields(req.body || {}, requiredFields);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          status: 400,
          message: validation.error,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check for PO owner specifically - either poOwnerAlias or m_po_owner must be present
    if (!req.body.poOwnerAlias && !req.body.m_po_owner) {
      return res.status(400).json({
        error: {
          status: 400,
          message: "Missing required field: PO Owner Alias",
          timestamp: new Date().toISOString()
        }
      });
    }

    // Build the payload for OData
    const fields = req.body || {};
    delete fields.attachments;
    // Map frontend field names to backend-required names
    if (fields.invoiceApprover) {
      // Map invoice approver logic
      if (fields.invoiceApprover === 'PO Owner' && fields.poOwnerId) {
        fields.m_invoice_approver = fields.poOwnerId;
        delete fields.invoiceApprover;
        delete fields.poOwnerId;
      } else if (fields.invoiceApprover === 'Other' && fields.invoiceApproverId) {
        fields.m_invoice_approver = fields.invoiceApproverId;
        delete fields.invoiceApprover;
        delete fields.invoiceApproverId;
      } else if (fields.invoiceApprover) {
        // For 'Procurement Team' or any other value, leave as is for now
        fields.m_invoice_approver = fields.invoiceApprover;
        delete fields.invoiceApprover;
      }
    }    // Always use poOwnerAlias for m_po_owner if available, overriding any existing m_po_owner
    if (fields.poOwnerAlias) {
      fields.m_po_owner = fields.poOwnerAlias;
      delete fields.poOwnerAlias;
      console.log("Using poOwnerAlias for m_po_owner:", fields.m_po_owner);
    } else if (fields.m_po_owner) {
      console.log("Using existing m_po_owner:", fields.m_po_owner);
    } else if (fields.poOwnerId) {
      console.log("Warning: poOwnerId found without accompanying poOwnerAlias. This might result in ID being stored instead of alias.");
    }
    if (fields.projectId) {
      fields.m_project = fields.projectId;
      delete fields.projectId;
      if (fields.project) delete fields.project; // Remove project name if present
    } else if (fields.project) {
      fields.m_project = fields.project;
      delete fields.project;
    }
    if (fields.supplier) {
      fields.m_supplier = fields.supplier;
      delete fields.supplier;
    }
    if (fields.title) {
      fields.m_title = fields.title;
      delete fields.title;
    }
    // Map boolean fields to OData expected fields and types
    const booleanFieldMap = [
      { from: 'capex', to: 'm_is_capex' },
      { from: 'fid', to: 'm_is_fid' },
      { from: 'reviewedByLabTpm', to: 'm_is_lab_tpm' },
      { from: 'deliverToMsftPoc', to: 'm_is_msft_poc' },
      { from: 'urgent', to: 'm_is_po_urgent' },
    ];
    booleanFieldMap.forEach(({ from, to }) => {
      if (fields[from] !== undefined) {
        // Accept both boolean and string 'true'/'false'
        fields[to] = fields[from] === true || fields[from] === 'true';
        delete fields[from];
      }
    });
    // Ensure m_deliverto_third_party is set to 'No' if not provided (required text field)
    if (!fields.m_deliverto_third_party) {
      fields.m_deliverto_third_party = 'No';
    }
    // Concatenate business justification fields into m_detail_info
    if (!fields.m_detail_info) {
      const justificationParts = [
        fields.businessJustificationProject,
        fields.businessJustificationLocation,
        fields.businessJustificationWhat,
        fields.businessJustificationWhy,
        fields.businessJustificationImpact,
        fields.businessJustificationNotes
      ].filter(Boolean);
      fields.m_detail_info = justificationParts.length > 0 ? justificationParts.join('. ') + '.' : 'No business justification provided.';
    }
    // Add more mappings as needed for other required fields
    // Final validation for m_po_owner to ensure it doesn't contain a UUID
    if (fields.m_po_owner && isUUID(fields.m_po_owner)) {
      console.log('WARNING: m_po_owner contains a UUID instead of an alias. This is likely incorrect.');
      // If we have poOwnerAlias in the original request, use that instead
      if (req.body.poOwnerAlias) {
        console.log(`Replacing m_po_owner UUID with alias: ${req.body.poOwnerAlias}`);
        fields.m_po_owner = req.body.poOwnerAlias;
      }
    }
    
    let odataPayload = { ...fields };
    if (req.file) {
      // Deep insert: add file as related entity
      odataPayload.m_Procurement_Request_Files = [
        {
          file_name: req.file.originalname,
          file_content: req.file.buffer.toString('base64'),
          file_type: req.file.mimetype
        }
      ];
      console.log('Deep insert: including file in m_Procurement_Request_Files');
    } else {
      console.log('No file attached (file will be uploaded separately)');
    }
    console.log('Outgoing OData payload:', { ...odataPayload, ...(odataPayload.m_Procurement_Request_Files ? { m_Procurement_Request_Files: '[file omitted]' } : {}) });    console.log('Forwarding to OData URL:', odataUrl);

    // Log possible invalid ID fields (m_po_owner is excluded as it should contain alias text, not an ID)
    const idFields = ['m_project', 'm_supplier', 'm_invoice_approver'];
    idFields.forEach(field => {
      if (odataPayload[field] && typeof odataPayload[field] === 'string' && !/^[A-F0-9-]{8,}$/.test(odataPayload[field])) {
        console.warn(`WARNING: Field ${field} has suspicious value: '${odataPayload[field]}' (may not be a valid ID)`);
      }
    });

    // Send to OData API
    const response = await fetch(odataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Prefer': preferHeader,
      },
      body: JSON.stringify(odataPayload),
    });

    // Log OData response status and headers
    console.log('OData response status:', response.status);
    console.log('OData response headers:', response.headers.raw ? response.headers.raw() : response.headers);

    // Use the common handler for OData responses
    return await handleODataResponse(response, res);
  } catch (err) {
    console.error('Error adding new procurement request:', err);
    return res.status(500).json({
      error: {
        status: 500,
        message: 'Failed to add new procurement request',
        details: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST endpoint for procurement request file upload (forwards to OData API)
router.post('/m_Procurement_Request_Files', upload.single('file'), async (req, res) => {
  try {
    // Authorization check
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ 
        error: {
          status: 401,
          message: 'Authorization token required',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const preferHeader = req.headers['prefer'] || 'return=representation';
    const odataUrl = 'https://chievmimsiiss01/IMSStage/Server/odata/m_Procurement_Request_Files';
    const { source_id, ...metadata } = req.body;
    const file = req.file;

    // Validate required parameters
    if (!source_id) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'source_id is required',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (!file) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'File attachment is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Log incoming request
    console.log('POST /api/m_Procurement_Request_Files called');
    console.log('Metadata:', metadata);
    console.log('Source ID:', source_id);
    console.log('File received:', file.originalname, file.mimetype, file.size + ' bytes');
    console.log('Prefer header:', preferHeader);
    console.log('Forwarding to OData URL:', odataUrl);

    // Prepare payload for OData (adjust as needed for your backend)
    const odataPayload = {
      ...metadata,
      source_id,
      file_name: file.originalname,
      file_content: file.buffer.toString('base64'),
      file_type: file.mimetype
    };

    // Log the outgoing payload (without file content for brevity)
    const logPayload = {
      ...metadata,
      source_id,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size
    };
    console.log('Outgoing OData payload:', logPayload);

    const response = await fetch(odataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Prefer': preferHeader,
      },
      body: JSON.stringify(odataPayload),
    });    // Log OData response status and headers
    console.log('OData response status:', response.status);
    console.log('OData response headers:', response.headers.raw ? response.headers.raw() : response.headers);

    // Use the common handler for OData responses
    return await handleODataResponse(response, res);
  } catch (err) {
    console.error('Error uploading procurement request file:', err);
    return res.status(500).json({
      error: {
        status: 500,
        message: 'Failed to upload procurement request file',
        details: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
