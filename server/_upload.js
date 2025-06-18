const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer(); // In-memory storage

// ...existing code...

module.exports = { router, upload };
