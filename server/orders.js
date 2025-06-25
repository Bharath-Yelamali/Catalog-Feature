// server/orders.js
// REST endpoint to get purchase requests/orders for the current user from IMS

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');

// Helper function to decode JWT token and extract login name
function getLoginNameFromToken(token) {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decode
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64url').toString();
    const tokenData = JSON.parse(decodedPayload);
    
    console.log('JWT token payload:', tokenData);
    
    // Common JWT claim names for login name/username
    const loginName = tokenData.preferred_username || tokenData.username || tokenData.unique_name || 
                     tokenData.upn || tokenData.sub || tokenData.name || tokenData.email;
    
    if (!loginName) {
      throw new Error('Login name not found in JWT token');
    }
    
    console.log('Extracted login name from token:', loginName);
    return loginName;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    throw new Error(`Failed to extract login name from token: ${error.message}`);
  }
}

// Helper function to get current user's vault ID
async function getCurrentUserVaultId(token, baseUrl) {
  try {
    console.log('Phase 1 Step 1: Getting current user vault ID...');
      // Step 1: Extract login name from JWT token
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const loginName = getLoginNameFromToken(cleanToken);
    console.log('Extracted login name from token:', loginName);
    
    // Step 2: Find the User record by login_name to get the actual User ID
    const userLookupEndpoint = `${baseUrl}User?$filter=login_name eq '${loginName}'&$select=id,login_name,default_vault`;
    console.log(`Looking up user by login_name: ${userLookupEndpoint}`);
    
    const userLookupResponse = await fetch(userLookupEndpoint, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!userLookupResponse.ok) {
      const errorText = await userLookupResponse.text();
      console.log(`User lookup failed (${userLookupResponse.status}): ${errorText}`);
      throw new Error(`Failed to lookup user by login_name: ${userLookupResponse.status} ${errorText}`);
    }
    
    const userLookupData = await userLookupResponse.json();
    console.log('User lookup response:', userLookupData);
    
    if (!userLookupData.value || userLookupData.value.length === 0) {
      throw new Error(`No User found with login_name: ${loginName}`);
    }
    
    const user = userLookupData.value[0];
    const userId = user.id;
    
    if (!userId) {
      throw new Error('User ID not found in user lookup response');
    }
    
    console.log(`Found User ID: ${userId} for login_name: ${loginName}`);
    
    // Step 3: Get the vault_id using the actual User ID
    const vaultEndpoint = `${baseUrl}User('${userId}')?$select=default_vault`;
    console.log(`Getting vault ID: ${vaultEndpoint}`);
    
    const vaultResponse = await fetch(vaultEndpoint, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!vaultResponse.ok) {
      const errorText = await vaultResponse.text();
      console.log(`Vault query failed (${vaultResponse.status}): ${errorText}`);
      throw new Error(`Failed to get user vault info: ${vaultResponse.status} ${errorText}`);
    }
    
    const vaultData = await vaultResponse.json();
    console.log('Vault endpoint response:', vaultData);
    
    // Extract vault_id from response (as per Aras documentation)
    let vaultId = null;
    if (vaultData['default_vault@aras.id']) {
      vaultId = vaultData['default_vault@aras.id'];
    } else if (vaultData.default_vault) {
      vaultId = vaultData.default_vault;
    }
    
    if (!vaultId) {
      throw new Error('default_vault not found in user response');
    }    console.log('✓ Found vault_id:', vaultId);
    
    // Step 4: Get the actual Vault entity details to understand vault_url and other fields
    console.log('Step 4: Fetching Vault entity details...');
    const vaultEntityEndpoint = `${baseUrl}Vault('${vaultId}')?$select=*`;
    console.log(`Getting Vault entity details: ${vaultEntityEndpoint}`);
    
    let vaultUrl = null;
    const vaultEntityResponse = await fetch(vaultEntityEndpoint, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!vaultEntityResponse.ok) {
      const errorText = await vaultEntityResponse.text();
      console.log(`Vault entity lookup failed (${vaultEntityResponse.status}): ${errorText}`);
      console.log('Continuing without Vault entity details...');
    } else {
      const vaultEntityData = await vaultEntityResponse.json();
      console.log('=== VAULT ENTITY DETAILS ===');
      console.log(JSON.stringify(vaultEntityData, null, 2));
      console.log('=== END VAULT ENTITY DETAILS ===');
      
      // Extract vault_url for use in batch requests
      if (vaultEntityData.vault_url) {
        vaultUrl = vaultEntityData.vault_url;
        console.log('✓ Found vault_url in Vault entity:', vaultUrl);
      } else {
        console.log('! No vault_url field found in Vault entity');
      }
    }
    
    return { vaultId, vaultUrl };
    
  } catch (error) {
    console.error('Error getting user vault ID:', error);
    throw error;
  }
}

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

// Helper function to get Aras session cookie for vault authentication
async function getArasSessionCookie(token) {
  try {
    console.log('Getting Aras session cookie for vault authentication...');
    
    // Clean the token if it has 'Bearer ' prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Make a lightweight OData request to obtain session cookie
    const baseODataUrl = 'https://chievmimsiiss01/IMSStage/Server/odata/';
    const sessionUrl = `${baseODataUrl}User?$top=1&$select=id`;
    
    const response = await fetch(sessionUrl, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get session cookie: ${response.status}`);
    }
    
    // Extract Aras.Server.Session cookie from response headers
    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('No set-cookie header found in OData response');
    }
    
    console.log('Set-Cookie header:', setCookieHeader);
    
    // Extract the Aras.Server.Session cookie value
    const sessionMatch = setCookieHeader.match(/Aras\.Server\.Session=([^;]+)/);
    if (!sessionMatch) {
      throw new Error('Aras.Server.Session cookie not found in response');
    }
    
    const sessionCookie = `Aras.Server.Session=${sessionMatch[1]}`;
    console.log('✓ Extracted session cookie for vault authentication');
    return sessionCookie;
    
  } catch (error) {
    console.error('Error getting Aras session cookie:', error);
    throw error;
  }
}

// Helper function to upload file using Aras Vault OData interface (3-step process)
async function uploadFileToArasVault(token, vaultId, fileBuffer, fileName, mimeType, vaultUrl = null) {
  try {
    console.log('Phase 2: Uploading file using Aras Vault OData interface...');
    
    // Clean the token if it has 'Bearer ' prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Generate client GUID for file ID (remove dashes, uppercase as per Aras convention)
    const { v4: uuidv4 } = require('uuid');
    const fileId = uuidv4().replace(/-/g, '').toUpperCase();
    
    console.log(`Generated file ID: ${fileId}`);
    console.log(`Vault ID: ${vaultId}`);
    console.log(`Vault URL from entity: ${vaultUrl || 'Not provided'}`);
    console.log(`File: ${fileName} (${mimeType}, ${fileBuffer.length} bytes)`);
    
    // Try different vault base URLs based on Aras documentation
    const vaultBaseUrls = [
      'https://chievmimsiiss01/IMSStage/vault/odata/',
      'https://chievmimsiiss01/vault/odata/',
      'https://chievmimsiiss01/IMSStage/Server/vault/odata/'
    ];
    
    let lastError = null;
    let transactionId = null;
    let workingVaultUrl = null;
    
    // Step 1: Begin transaction
    console.log('Step 1: Beginning vault transaction...');
    for (const baseUrl of vaultBaseUrls) {
      const beginUrl = `${baseUrl}vault.BeginTransaction`;
      console.log(`Trying BeginTransaction with: ${beginUrl}`);
      
      try {
        const response = await fetch(beginUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'VAULTID': vaultId,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        console.log(`BeginTransaction response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          transactionId = data.transactionId;
          workingVaultUrl = baseUrl;
          console.log(`✓ SUCCESS: Got transaction ID: ${transactionId}`);
          break;
        } else {
          const errorText = await response.text();
          lastError = new Error(`BeginTransaction failed (${response.status}): ${errorText}`);
          console.log(`✗ FAILED with ${beginUrl}: ${lastError.message}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`✗ ERROR with ${beginUrl}: ${error.message}`);
      }
    }
    
    if (!transactionId) {
      throw lastError || new Error('Failed to begin vault transaction with all URLs');
    }
    
    // Step 2: Upload file chunk
    console.log('Step 2: Uploading file chunk...');
    const uploadUrl = `${workingVaultUrl}vault.UploadFile?fileId=${fileId}`;
    console.log(`Uploading to: ${uploadUrl}`);
    
    // Encode filename for Content-Disposition header as per Aras documentation
    const encodedFileName = encodeURIComponent(fileName);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'VAULTID': vaultId,
        'transactionid': transactionId,
        'Content-Disposition': `attachment; filename*=utf-8''${encodedFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
        'Content-Type': 'application/octet-stream'
        // Note: Skipping checksum headers for now (can be added later if needed)
      },
      body: fileBuffer
    });
    
    console.log(`File upload response status: ${uploadResponse.status}`);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed (${uploadResponse.status}): ${errorText}`);
    }
      console.log('✓ File chunk uploaded successfully');
      // Step 3: Commit vault transaction with File item creation (multipart/mixed batch)
    console.log('Step 3: Committing vault transaction with File item metadata...');
    const commitUrl = `${workingVaultUrl}vault.CommitTransaction`;
    console.log(`[DEBUG] CommitTransaction URL:`, commitUrl);
    // Create multipart/mixed batch request as per Aras Vault OData documentation
    const boundary = `batch_${Date.now()}`;
    const changesetBoundary = `changeset_${Date.now()}`;

    // Target the main Innovator OData endpoint for File creation
    const batchRequestUri = '/odata/m_Procurement_Request_Files';
    console.log(`[DEBUG] Using batch request URI: ${batchRequestUri}`);
    
    // Prepare the File item payload for main Innovator context
    const filePayload = {
      "id": fileId,
      "filename": fileName,
      "file_type": mimeType,
      "file_size": fileBuffer.length,
      // Link to the vault-stored file
      "located": [
        {
          "id": fileId,
          "file_version": 1,
          "related_id": vaultId
        }
      ]
    };
    console.log('[DEBUG] File payload for batch:', JSON.stringify(filePayload, null, 2));
    
    const filePayloadJson = JSON.stringify(filePayload);
    
    // Construct the batch request body with File item metadata
    // The POST should target the main Innovator OData endpoint
    const batchBody = [
      `--${boundary}`,
      `Content-Type: multipart/mixed; boundary=${changesetBoundary}`,
      ``,
      `--${changesetBoundary}`,
      `Content-Type: application/http`,
      `Content-Transfer-Encoding: binary`,
      ``,
      `POST ${batchRequestUri}`,
      `Host: chievmimsiiss01`,
      `Content-Type: application/json`,
      `Content-Length: ${filePayloadJson.length}`,
      ``,
      filePayloadJson,
      `--${changesetBoundary}--`,
      `--${boundary}--`
    ].join('\r\n');
    
    console.log('[DEBUG] Batch request body being sent to CommitTransaction:');
    console.log(batchBody);
    
    const commitHeaders = {
      'Authorization': `Bearer ${cleanToken}`,
      'VAULTID': vaultId,
      'transactionid': transactionId,
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation',
      'OData-Version': '4.0'
    };
    console.log('[DEBUG] CommitTransaction request headers:', JSON.stringify(commitHeaders, null, 2));
    
    let commitResponse;
    try {
      commitResponse = await fetch(commitUrl, {
        method: 'POST',
        headers: commitHeaders,
        body: batchBody
      });
    } catch (err) {
      console.log('[ERROR] Network or fetch error during CommitTransaction:', err);
      throw err;
    }
    console.log(`[DEBUG] CommitTransaction response status: ${commitResponse.status}`);
    console.log('[DEBUG] Full response headers from CommitTransaction:');
    try {
      console.log(JSON.stringify([...commitResponse.headers.entries()], null, 2));
    } catch (e) {
      console.log('[DEBUG] Could not stringify commitResponse.headers:', e);
    }
    let commitResponseText;
    try {
      commitResponseText = await commitResponse.text();
      console.log('[DEBUG] Raw response body from CommitTransaction:');
      console.log(commitResponseText);
    } catch (e) {
      console.log('[DEBUG] Could not read commitResponse.text():', e);
    }
    if (!commitResponse.ok) {
      // Try to parse as JSON to get more structured error info
      try {
        const errorJson = JSON.parse(commitResponseText);
        console.log('[DEBUG] Parsed error JSON:');
        console.log(JSON.stringify(errorJson, null, 2));
        if (errorJson.error) {
          console.log('[DEBUG] Error object details:');
          console.log('  - Code:', errorJson.error.code);
          console.log('  - Message:', errorJson.error.message);
          console.log('  - Target:', errorJson.error.target);
          console.log('  - Details:', errorJson.error.details);
          console.log('  - Inner Error:', errorJson.error.innererror);
        }
      } catch (parseError) {
        console.log('[DEBUG] Error response is not JSON, raw text above');
      }
      throw new Error(`Commit transaction failed (${commitResponse.status}): ${commitResponseText}`);
    }
    console.log('✓ Transaction committed successfully');
    
    // Parse response to extract any returned data
    let uploadResult = {
      fileId: fileId,
      fileName: fileName,
      mimeType: mimeType,
      size: fileBuffer.length,
      vaultId: vaultId,
      transactionId: transactionId
    };
    
    console.log('✓ File uploaded to Aras Vault using OData interface successfully');
    return uploadResult;
    
  } catch (error) {
    console.error('Error uploading file to Aras Vault:', error);
    throw error;
  }
}

// Helper function to create File item reference after vault upload
async function createFileItemAfterVaultUpload(token, baseODataUrl, uploadResult) {
  try {
    console.log('Phase 3: Creating File item in main IMS OData context...');
    
    // Clean the token if it has 'Bearer ' prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Create File item in the main IMS OData context (not vault context)
    const fileODataUrl = `${baseODataUrl}File`;
    console.log(`Creating File item at: ${fileODataUrl}`);
    
    // Prepare File item payload with vault reference
    const fileItemPayload = {
      id: uploadResult.fileId,
      filename: uploadResult.fileName,
      file_type: uploadResult.mimeType,
      file_size: uploadResult.size,
      // Link to the vault-stored file
      located: [
        {
          file_version: 1,
          related_id: uploadResult.vaultId
        }
      ]
    };
    
    console.log('Creating File item with payload:', fileItemPayload);
    
    const fileResponse = await fetch(fileODataUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fileItemPayload)
    });
    
    console.log(`File item creation response status: ${fileResponse.status}`);
    
    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.log('File item creation failed:', errorText);
      throw new Error(`File item creation failed (${fileResponse.status}): ${errorText}`);
    }
    
    const fileData = await fileResponse.json();
    console.log('File item created successfully:', fileData);
    
    const fileItemId = fileData.id || uploadResult.fileId;
    
    console.log('✓ File item created with ID:', fileItemId);
    return {
      fileItemId: fileItemId,
      fileName: uploadResult.fileName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size
    };
    
  } catch (error) {
    console.error('Error creating File item after vault upload:', error);
    throw error;
  }
}

// Legacy helper function (kept for reference but not used)
async function beginVaultTransaction(token, vaultId) {
  try {
    console.log('Phase 1 Step 2: Beginning vault transaction...');
    
    // Try different vault URL patterns based on Aras documentation
    const vaultUrls = [
      'https://chievmimsiiss01/IMSStage/vault/odata/vault.BeginTransaction', // Current attempt
      'https://chievmimsiiss01/vault/odata/vault.BeginTransaction',          // Alternative 1: Direct vault URL
      'https://chievmimsiiss01/IMSStage/Server/vault/odata/vault.BeginTransaction' // Alternative 2: Server/vault path
    ];
    
    let lastError = null;
    
    for (const vaultUrl of vaultUrls) {
      console.log(`Trying vault URL: ${vaultUrl}`);
      console.log(`Using vault_id: ${vaultId}`);
      console.log(`Token preview: ${token.substring(0, 20)}...`);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'VAULTID': vaultId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      console.log('Request headers:', headers);
      
      const response = await fetch(vaultUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      
      console.log(`BeginTransaction response status: ${response.status}`);
      console.log(`Response headers:`, response.headers.raw ? response.headers.raw() : 'No headers available');
      
      if (response.ok) {
        console.log(`✓ SUCCESS with vault URL: ${vaultUrl}`);
        const data = await response.json();
        console.log('BeginTransaction response:', data);
        
        const transactionId = data.transactionId || data.transaction_id || data.id;
        if (!transactionId) {
          throw new Error('transactionId not found in BeginTransaction response');
        }
        
        console.log('✓ Got transaction_id:', transactionId);
        return transactionId;
      } else {
        const errorText = await response.text();
        lastError = new Error(`BeginTransaction failed with ${vaultUrl} (${response.status}): ${errorText}`);
        console.log(`✗ FAILED with vault URL: ${vaultUrl} - ${lastError.message}`);
      }
    }
    
    // If all URLs failed, throw the last error
    throw lastError;  } catch (error) {
    console.error('Error beginning vault transaction:', error);
    throw error;
  }
}

// Helper function to upload file content to vault
async function uploadFileToVault(token, vaultId, transactionId, fileBuffer, fileName, mimeType) {
  try {
    console.log('Phase 1 Step 3: Uploading file to vault...');
    
    // Generate client GUID for file ID (remove dashes, uppercase as per Aras convention)
    const { v4: uuidv4 } = require('uuid');
    const fileId = uuidv4().replace(/-/g, '').toUpperCase();
    
    const vaultUrl = `https://chievmimsiiss01/IMSStage/vault/odata/vault.UploadFile?fileId=${fileId}`;
    console.log(`Vault UploadFile URL: ${vaultUrl}`);
    console.log(`File ID: ${fileId}`);
    
    // Encode filename for Content-Disposition header
    const encodedFileName = encodeURIComponent(fileName);
    
    const response = await fetch(vaultUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'VAULTID': vaultId,
        'transactionid': transactionId,
        'Content-Disposition': `attachment; filename*=utf-8''${encodedFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`,
        'Content-Type': 'application/octet-stream'
        // Note: Skipping checksum headers for now (Aras-Content-Range-Checksum)
      },
      body: fileBuffer
    });
    
    console.log(`UploadFile response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`UploadFile failed (${response.status}): ${errorText}`);
    }
    
    console.log('✓ File uploaded to vault successfully');
    return {
      fileId: fileId,
      fileName: fileName,
      mimeType: mimeType,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error('Error uploading file to vault:', error);
    throw error;
  }
}

// Helper function to commit vault transaction and create File item
async function commitVaultTransaction(token, vaultId, transactionId, fileMetadata) {
  try {
    console.log('Phase 1 Step 4: Committing vault transaction...');
    
    const vaultUrl = 'https://chievmimsiiss01/IMSStage/vault/odata/vault.CommitTransaction';
    console.log(`Vault CommitTransaction URL: ${vaultUrl}`);
    
    // Create the multipart/mixed batch request body for File item creation
    const boundary = `batch_${Date.now()}`;
    const changesetBoundary = `changeset_${Date.now()}`;
      // Construct the batch request body
    const batchBody = [
      `--${boundary}`,
      `Content-Type: multipart/mixed; boundary=${changesetBoundary}`,
      ``,      `--${changesetBoundary}`,
      `Content-Type: application/http`,
      `Content-Transfer-Encoding: binary`,
      ``,      `POST File HTTP/1.1`,
      `Host: chievmimsiiss01`,
      `Content-Type: application/json`,
      ``,
      JSON.stringify({
        filename: fileMetadata.fileName,
        file_type: fileMetadata.mimeType,
        file_size: fileMetadata.size,
        vault_id: vaultId,
        actual_filename: fileMetadata.fileId
      }),
      `--${changesetBoundary}--`,
      `--${boundary}--`
    ].join('\r\n');
    
    const response = await fetch(vaultUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'VAULTID': vaultId,
        'transactionid': transactionId,
        'Content-Type': `multipart/mixed; boundary=${boundary}`,
        'Accept': 'application/json'
      },
      body: batchBody
    });
    
    console.log(`CommitTransaction response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CommitTransaction failed (${response.status}): ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log('CommitTransaction response:', responseText);
    
    // Parse the multipart response to extract the File item ID
    let fileItemId = null;
    try {
      // Look for JSON response in the multipart response
      const jsonMatch = responseText.match(/\{[^}]*"id"[^}]*\}/);
      if (jsonMatch) {
        const fileData = JSON.parse(jsonMatch[0]);
        fileItemId = fileData.id;
      }
    } catch (parseError) {
      console.log('Could not parse File item ID from response, will extract from location header or response');
    }
    
    if (!fileItemId) {
      // Try to extract from Location header or other patterns
      const locationMatch = responseText.match(/Location:\s*.*File\('([^']+)'\)/);
      if (locationMatch) {
        fileItemId = locationMatch[1];
      }
    }
    
    if (!fileItemId) {
      throw new Error('Could not extract File item ID from CommitTransaction response');
    }
    
    console.log('✓ Vault transaction committed successfully, File item created:', fileItemId);
    return {
      fileItemId: fileItemId,
      fileName: fileMetadata.fileName,
      mimeType: fileMetadata.mimeType,
      size: fileMetadata.size
    };
  } catch (error) {
    console.error('Error committing vault transaction:', error);
    throw error;
  }
}

// Helper function to test vault connectivity and authentication
async function testVaultConnectivity(token, vaultId) {
  try {
    console.log('Testing vault connectivity...');
    
    // Test different vault base URLs
    const vaultBaseUrls = [
      'https://chievmimsiiss01/IMSStage/vault/odata/',
      'https://chievmimsiiss01/vault/odata/',
      'https://chievmimsiiss01/IMSStage/Server/vault/odata/'
    ];
    
    for (const baseUrl of vaultBaseUrls) {
      console.log(`Testing vault base URL: ${baseUrl}`);
      
      try {
        // Try to get vault metadata or service document
        const metadataUrl = `${baseUrl}$metadata`;
        const serviceUrl = baseUrl;
        
        for (const testUrl of [serviceUrl, metadataUrl]) {
          console.log(`  Testing endpoint: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'VAULTID': vaultId,
              'Accept': 'application/json'
            }
          });
          
          console.log(`  Response status: ${response.status}`);
          
          if (response.ok) {
            console.log(`  ✓ Success with ${testUrl}`);
            const responseText = await response.text();
            console.log(`  Response preview: ${responseText.substring(0, 200)}...`);
            return baseUrl; // Return the working base URL
          } else {
            const errorText = await response.text();
            console.log(`  ✗ Failed: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        }
      } catch (error) {
        console.log(`  ✗ Error testing ${baseUrl}: ${error.message}`);
      }
    }
    
    console.log('No working vault URL found');
    return null;
  } catch (error) {
    console.error('Error testing vault connectivity:', error);
    return null;
  }
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
    delete fields.attachments;    // Map frontend field names to backend-required names
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
    if (fields.m_is_fid === false) {
      // When FID is false, provide a default reason for not having FID
      if (!fields.m_fid_reason && !fields.m_fid_code) {
        fields.m_fid_reason = 'No FID required for this purchase type';
      }
    } else if (fields.m_is_fid === true && fields.m_fid_code) {
      // When FID is true, make sure the FID code is properly set
      console.log(`FID is true, using FID code: ${fields.m_fid_code}`);
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
      let odataPayload = { ...fields };    // Vault Integration: Use Aras Vault OData interface (3-step process)
    if (req.file) {
      console.log('File detected - testing Aras Vault OData integration...');
      
      try {
        const baseODataUrl = 'https://chievmimsiiss01/IMSStage/Server/odata/';
          // Step 1: Get vault ID and vault URL
        const vaultInfo = await getCurrentUserVaultId(token, baseODataUrl);
        console.log('✓ Step 1 SUCCESS: Got vault info:', vaultInfo);
        
        // Step 2: Upload file to Aras Vault using OData interface (3-step process)
        const uploadResult = await uploadFileToArasVault(
          token,
          vaultInfo.vaultId,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          vaultInfo.vaultUrl
        );
        console.log('✓ Step 2 SUCCESS: File uploaded to Aras Vault:', uploadResult.fileId);
          // Step 3: Create File item in main IMS OData context
        const fileItemResult = await createFileItemAfterVaultUpload(
          token,
          baseODataUrl,
          uploadResult
        );
        console.log('✓ Step 3 SUCCESS: File item created in IMS OData context:', fileItemResult.fileItemId);
        
        // Use the File item reference instead of deep insert
        odataPayload.m_quote = fileItemResult.fileItemId;
        console.log('Aras Vault integration: File uploaded to vault and File item created in IMS OData context - using File item reference in m_quote field');
        
      } catch (vaultError) {
        console.error('Aras Vault integration FAILED:', vaultError.message);
        
        // Fallback to deep insert for now
        odataPayload.m_Procurement_Request_Files = [
          {
            file_name: req.file.originalname,
            file_content: req.file.buffer.toString('base64'),
            file_type: req.file.mimetype
          }
        ];
        console.log('Fallback: using deep insert due to vault operation failure');
      }
    } else {
      console.log('No file attached');
    }
    console.log('Outgoing OData payload:', { ...odataPayload, ...(odataPayload.m_Procurement_Request_Files ? { m_Procurement_Request_Files: '[file omitted]' } : {}) });    console.log('Forwarding to OData URL:', odataUrl);    // Log possible invalid ID fields (m_po_owner and m_reviewer are excluded as they contain names/aliases, not IDs)
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
