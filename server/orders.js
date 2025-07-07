/**
 * orders.js
 *
 * Express router for procurement request/order-related API endpoints.
 * Handles:
 *   - Listing and searching procurement requests/orders
 *   - Retrieving workflow process and activity details
 *   - Creating procurement requests (with file upload support)
 *   - Uploading files for procurement requests
 *
 * All endpoints require a valid Bearer token in the Authorization header.
 * File uploads are validated for type and size.
 *
 * This module acts as a secure bridge between the frontend and the IMS OData backend.
 */

// server/orders.js
// REST endpoint to get purchase requests/orders for the current user from IMS

require('dotenv').config();
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');

// Use BASE_URL from environment variable
const BASE_URL = process.env.IMS_BASE_URL;

// Helper function to check if a string is a UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to extract Bearer token from request
function extractBearerToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring('Bearer '.length);
  }
  return null;
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

/**
 * GET /orders
 * Fetches purchase requests/orders for the current user from IMS.
 * Supports optional search and field filtering.
 * Requires Bearer token in Authorization header.
 *
 * Query Params:
 *   - search: (optional) search term
 *   - field: (optional) field to search (allowed: 'keyed_name', 'created_by_id/keyed_name')
 *
 * Response: { orders: Array, totalCount: number, imsRaw: Object }
 */
router.get('/orders', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  const token = extractBearerToken(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  
  const searchTerm = req.query.search ? req.query.search.trim() : '';
  // Accept a field parameter, default to keyed_name
  let searchField = req.query.field || 'keyed_name';

  // Only allow certain fields for security
  const allowedFields = ['keyed_name', 'created_by_id/keyed_name'];
  if (!allowedFields.includes(searchField)) {
    searchField = 'keyed_name';
  }

  try {
    const orderBy = `$orderby=${encodeURIComponent('created_on desc')}`;
    let top = `$top=50`;
    let count = `$count=true`;
    // If searching, do not limit results
    if (searchTerm) top = '';

    // Build filter for the selected field
    let filter = '';
    if (searchTerm) {
      // OData navigation property: use / not @aras.
      filter = `&$filter=contains(${searchField},'${encodeURIComponent(searchTerm)}')`;
    }
    // Use $select=* to request all available properties, including those with null values
    const select = "$select=*";
    // Always request $count=true for total count
    let odataUrl = `${BASE_URL}m_Procurement_Request?${orderBy}`;
    if (top) odataUrl += `&${top}`;
    odataUrl += `&${select}&${count}`;
    if (filter) odataUrl += filter;

    const imsResp = await fetch(odataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!imsResp.ok) {
      const text = await imsResp.text();
      return res.status(imsResp.status).json({ error: `IMS error: ${text}` });
    }
    const imsData = await imsResp.json();
    // Return the orders and the total count
    return res.json({
      orders: imsData.value || [],
      totalCount: typeof imsData['@odata.count'] === 'number' ? imsData['@odata.count'] : (imsData.value ? imsData.value.length : 0),
      imsRaw: imsData // for debugging
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

/**
 * GET /workflow-processes
 * Fetches the most recent workflow process for a given order item number.
 *
 * - A "workflow process" represents the overall approval or processing workflow instance
 *   associated with a specific procurement request/order (e.g., REQ-000070).
 * - Use this endpoint to retrieve the workflow process metadata and status for a given order.
 * - Typically, this is the first step to understand the current workflow state of an order.
 *
 * Requires Bearer token in Authorization header.
 *
 * Query Params:
 *   - orderItemNumber: (required) the order item number (e.g., REQ-000070)
 *
 * Response: { workflowProcess: Object|null }
 */
router.get('/workflow-processes', async (req, res) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const orderItemNumber = req.query.orderItemNumber;
  try {
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

/**
 * GET /workflow-process-activities
 * Fetches the most recent workflow process activity for a given workflow process ID.
 *
 * - A "workflow process activity" represents a specific step, action, or task within a workflow process
 *   (such as an approval, review, or transition event).
 * - Use this endpoint to retrieve the latest activity (step/status) for a given workflow process instance.
 * - Typically, you first use /workflow-processes to get the process ID, then use this endpoint to get the latest activity for that process.
 *
 * Requires Bearer token in Authorization header.
 *
 * Query Params:
 *   - workflowProcessId: (required) the workflow process ID
 *
 * Response: { workflowProcessActivity: Object|null }
 */
router.get('/workflow-process-activities', async (req, res) => {
  console.log('workflow-process-activities endpoint hit');
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const workflowProcessId = req.query.workflowProcessId;
  try {
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

/**
 * POST /m_Procurement_Request
 * Creates a new procurement request, with optional file upload (multipart/form-data or JSON).
 * Requires Bearer token in Authorization header.
 *
 * Body:
 *   - m_project, m_supplier, m_po_owner or poOwnerAlias, and other procurement fields
 *   - m_quote: (optional) file upload (multipart/form-data)
 *
 * Response: OData API response (created procurement request)
 */
router.post('/m_Procurement_Request', upload.single('m_quote'), async (req, res) => {
  try {
    const token = extractBearerToken(req);
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
    const odataUrl = `${BASE_URL}m_Procurement_Request`;
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
    const requiredFields = ['m_project', 'm_supplier'];    const validation = validateRequiredFields(req.body || {}, requiredFields);
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
    console.log("Invoice Approver Debug - Initial state:", {
      invoiceApprover: fields.invoiceApprover,
      invoiceApproverId: fields.invoiceApproverId,
      poOwner: fields.m_po_owner,
      poOwnerAlias: fields.poOwnerAlias
    });    if (fields.invoiceApprover) {
      // Send numeric values directly to m_invoice_approver dropdown
      if (fields.invoiceApprover === '0' || fields.invoiceApprover === 'PO Owner') {
        fields.m_invoice_approver = 0;
        console.log(`Setting m_invoice_approver to: 0 (PO Owner)`);
      } else if (fields.invoiceApprover === '1' || fields.invoiceApprover === 'Procurement team') {
        fields.m_invoice_approver = 1;
        console.log(`Setting m_invoice_approver to: 1 (Procurement team)`);
      } else if (fields.invoiceApprover === '2' || fields.invoiceApprover === 'Other') {
        fields.m_invoice_approver = 2;
        console.log(`Setting m_invoice_approver to: 2 (Other)`);
        // For "Other", also set the alias in m_invoice_approver_other
        if (fields.invoiceApproverDisplay) {
          fields.m_invoice_approver_other = fields.invoiceApproverDisplay;
          console.log(`Setting m_invoice_approver_other to: ${fields.invoiceApproverDisplay}`);
        }
      }
      delete fields.invoiceApprover;
      if (fields.invoiceApproverDisplay) delete fields.invoiceApproverDisplay;
    } else {
      // Default to PO Owner (0) if no invoice approver specified
      fields.m_invoice_approver = 0;
      console.log(`Using default m_invoice_approver: 0 (PO Owner)`);
    }
      // CRITICAL: Ensure m_invoice_approver is always set before continuing
    // This is a final validation to prevent NULL constraint errors
    // Note: 0 is a valid value (PO Owner), so we only check for null/undefined
    if (fields.m_invoice_approver === null || fields.m_invoice_approver === undefined) {
      console.log("WARNING: m_invoice_approver is still null after processing. Setting to default value.");
      // If we have a PO owner, use that
      if (fields.m_po_owner) {
        fields.m_invoice_approver = fields.m_po_owner;
      } else {
        // Last resort - set a fixed value
        fields.m_invoice_approver = "DEFAULT_INVOICE_APPROVER";      }
      console.log(`Final m_invoice_approver value: ${fields.m_invoice_approver}`);
    }
    
    // Debug: Log final m_invoice_approver value after all processing
    console.log(`✓ Final m_invoice_approver after all checks: ${fields.m_invoice_approver} (type: ${typeof fields.m_invoice_approver})`);
    
    // Always use poOwnerAlias for m_po_owner if available, overriding any existing m_po_owner
    if (fields.poOwnerAlias) {
      fields.m_po_owner = fields.poOwnerAlias;
      delete fields.poOwnerAlias;
      console.log("Using poOwnerAlias for m_po_owner:", fields.m_po_owner);
    } else if (fields.m_po_owner) {
      console.log("Using existing m_po_owner:", fields.m_po_owner);    } else if (fields.poOwnerId) {
      console.log("Warning: poOwnerId found without accompanying poOwnerAlias. This might result in ID being stored instead of alias.");
    }    // Properly handle reviewer field mapping - validate and set reviewer name
    console.log("Reviewer Debug - Initial state:", {
      reviewer: fields.reviewer,
      m_reviewer: fields.m_reviewer
    });
    
    if (fields.reviewer) {
      // Validate reviewer name against allowed list
      const validReviewers = ['Jeremy Webster', 'Luke Duchesneau', 'Heather Phan', 'Dave Artz'];
      if (validReviewers.includes(fields.reviewer)) {
        fields.m_reviewer = fields.reviewer;
        console.log(`Setting m_reviewer to: ${fields.m_reviewer}`);
      } else {
        console.log(`WARNING: Invalid reviewer name '${fields.reviewer}'. Using default reviewer.`);
        fields.m_reviewer = 'Jeremy Webster'; // Default to first reviewer
        console.log(`Setting m_reviewer to default: ${fields.m_reviewer}`);
      }
      delete fields.reviewer;
      // Delete any legacy display name field if it exists
      if (fields.reviewerName) delete fields.reviewerName;
    } else if (fields.m_reviewer) {
      console.log("Using existing m_reviewer:", fields.m_reviewer);
    } else {
      // Default to first reviewer if no reviewer specified
      fields.m_reviewer = 'Jeremy Webster';
      console.log(`Using default m_reviewer: ${fields.m_reviewer}`);
    }
    
    // Final validation to ensure m_reviewer is always set and valid
    if (!fields.m_reviewer || !['Jeremy Webster', 'Luke Duchesneau', 'Heather Phan', 'Dave Artz'].includes(fields.m_reviewer)) {
      console.log("WARNING: m_reviewer is invalid after processing. Setting to default value.");
      fields.m_reviewer = 'Jeremy Webster';
      console.log(`Final m_reviewer value: ${fields.m_reviewer}`);
    }
    
    // Debug: Log final m_reviewer value after all processing
    console.log(`✓ Final m_reviewer after all checks: ${fields.m_reviewer} (type: ${typeof fields.m_reviewer})`);
    
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
    }    // Map boolean fields to OData expected fields and types
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
    
    // Handle FID-related fields properly
    if (fields.m_is_fid === false || fields.m_is_fid === 'false') {
      // When FID is false, require a reason for not having FID
      if (fields.m_why_not_forecasted) {
        // Use the provided reason, trimmed
        fields.m_why_not_forecasted = String(fields.m_why_not_forecasted).trim();
      } else {
        // Default reason if not provided
        fields.m_why_not_forecasted = 'No FID required for this purchase type';
      }
      // Remove any FID code if present
      if (fields.m_fid_code) delete fields.m_fid_code;
    } else if (fields.m_is_fid === true || fields.m_is_fid === 'true') {
      // When FID is true, make sure the FID code is properly set
      if (fields.m_fid_code) {
        console.log(`FID is true, using FID code: ${fields.m_fid_code}`);
      }
      // Remove any reason if present
      if (fields.m_why_not_forecasted) delete fields.m_why_not_forecasted;
    }
    
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
    // Always use deep insert for file - if no file provided, create a default one
    if (req.file) {
      odataPayload.m_Procurement_Request_Files = [
        {
          file_name: req.file.originalname,
          file_content: req.file.buffer.toString('base64'),
          file_type: req.file.mimetype
        }
      ];
      console.log('Added m_Procurement_Request_Files deep insert to payload:', {
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size
      });
    } else {
      // Create a default text file when no attachment is provided
      // This satisfies the IMS requirement for an attachment
      const defaultContent = `Procurement Request - ${new Date().toISOString()}

This is an automatically generated file for procurement requests submitted without attachments.

Request Details:
- Project: ${fields.m_project || 'N/A'}
- Supplier: ${fields.m_supplier || 'N/A'}
- PO Owner: ${fields.m_po_owner || 'N/A'}
- Submitted: ${new Date().toLocaleString()}

No additional attachments were provided with this request.
`;
      
      odataPayload.m_Procurement_Request_Files = [
        {
          file_name: `procurement_request_${Date.now()}.txt`,
          file_content: Buffer.from(defaultContent, 'utf8').toString('base64'),
          file_type: 'text/plain'
        }
      ];
      console.log('No attachment provided - added default text file to satisfy IMS requirement');
    }

    // Send to OData API
    const response = await fetch(odataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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

/**
 * POST /m_Procurement_Request_Files
 * Uploads a file attachment for a procurement request.
 * Requires Bearer token in Authorization header.
 *
 * Body:
 *   - source_id: (required) procurement request ID
 *   - file: (required) file upload (multipart/form-data)
 *   - other metadata fields as needed
 *
 * Response: OData API response (created file record)
 */
router.post('/m_Procurement_Request_Files', upload.single('file'), async (req, res) => {
  try {
    // Authorization check
    const token = extractBearerToken(req);
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
    const odataUrl = `${BASE_URL}m_Procurement_Request_Files`;
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
        'Authorization': `Bearer ${token}`,
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