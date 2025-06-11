require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const PORT = 3001;

// === OAuth Configuration (hardcoded) ===
const TOKEN_URL = "https://chievmimsiiss01/IMSStage/OAuthServer/connect/token";
const DATABASE = "IMSStageBharath";
const CLIENT_ID = "IOMApp";
const SCOPE = "Innovator";

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

// === Login Endpoint for User Authentication ===
app.post('/api/login', async (req, res) => {
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

// Register userInfo route
const userInfoRouter = require('./userInfo');
app.use('/api', userInfoRouter);

// Register identity route
const identityRouter = require('./identity');
app.use('/api', identityRouter);

// Register parts route
const partsRouter = require('./parts');
app.use('/api', partsRouter);

// Register orders route
const ordersRouter = require('./orders');
app.use('/api', ordersRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
