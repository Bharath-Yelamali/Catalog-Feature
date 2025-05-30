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
    let response;
    try {
      response = await fetch(`${BASE_URL}Part`, {
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
    res.json(data);
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
