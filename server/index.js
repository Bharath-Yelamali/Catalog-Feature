/**
 * index.js
 * Main entry point for the Express backend server.
 * - Handles OAuth authentication with Aras Innovator
 * - Registers all API routers (orders, userInfo, identity, parts, project, supplier)
 * - Configures CORS and JSON parsing
 * - Provides login and health check endpoints
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const PORT = 3001;

const API_PREFIX = '/api';

// === OAuth Configuration (from environment variables) ===
const TOKEN_URL = process.env.TOKEN_URL;
const DATABASE = process.env.DATABASE;
const CLIENT_ID = process.env.CLIENT_ID;
const SCOPE = process.env.SCOPE;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

// Token cache
let accessToken = null;
let tokenExpiry = null;

// --- OAuth Token Helper ---
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

// --- CORS Configuration ---
const allowedOrigin = 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));

// --- Register orders route (with file upload) BEFORE express.json() ---
const ordersRouter = require('./orders');
app.use(API_PREFIX, ordersRouter);

// --- JSON Middleware ---
app.use(express.json());

// --- Root and Health Endpoints ---
app.get('/', (req, res) => {
  res.send('Backend proxy server is running.');
});
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// --- Login Endpoint ---
app.post(`${API_PREFIX}/login`, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  // Hash the password using MD5 (Aras expects MD5 hash)
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
  // Prepare OAuth payload
  const payload = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    username,
    password: hashedPassword,
    scope: SCOPE,
    database: DATABASE
  });
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Failed to obtain OAuth token: ${errorText}` });
    }
    const data = await response.json();
    // Return the access token and expiry to the frontend
    return res.json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// === API Routers Registration ===
const userInfoRouter = require('./userInfo');
app.use(API_PREFIX, userInfoRouter);

const identityRouter = require('./identity');
app.use(API_PREFIX, identityRouter);

const partsRouter = require('./parts');
app.use(API_PREFIX, partsRouter);

const projectRouter = require('./project');
app.use(API_PREFIX, projectRouter);

const supplierRouter = require('./supplier');
app.use(API_PREFIX, supplierRouter);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
