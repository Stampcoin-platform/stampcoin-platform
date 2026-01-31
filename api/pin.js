/**
 * Serverless IPFS Pinning Endpoint
 * 
 * This function accepts POST requests to pin images and metadata to nft.storage
 * and optionally to Pinata. Compatible with Vercel, Netlify, and other serverless platforms.
 * 
 * Environment Variables Required:
 * - NFT_STORAGE_API_KEY: API key for nft.storage
 * - PINATA_API_KEY: API key for Pinata (optional)
 * - PINATA_SECRET_API_KEY: Secret API key for Pinata (optional, use with PINATA_API_KEY)
 * - PINATA_JWT: JWT token for Pinata (optional, alternative to API key/secret)
 */

const https = require('https');
const http = require('http');

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Make an HTTPS request
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'http:' ? http : https;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: body });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Pin to nft.storage
 */
async function pinToNFTStorage(fileBuffer, fileName, apiKey) {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  
  // Build multipart form data properly with Buffer
  const parts = [
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
    Buffer.from('Content-Type: application/octet-stream\r\n\r\n'),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ];
  
  const formData = Buffer.concat(parts);

  const options = {
    hostname: 'api.nft.storage',
    port: 443,
    path: '/upload',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': formData.length
    }
  };

  return makeRequest(options, formData);
}

/**
 * Pin to Pinata
 */
async function pinToPinata(fileBuffer, fileName, auth) {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  
  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      timestamp: new Date().toISOString()
    }
  });

  // Build multipart form data properly with Buffer
  const parts = [
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
    Buffer.from('Content-Type: application/octet-stream\r\n\r\n'),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="pinataMetadata"\r\n'),
    Buffer.from('Content-Type: application/json\r\n\r\n'),
    Buffer.from(metadata),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ];
  
  const formData = Buffer.concat(parts);

  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': formData.length
  };

  // Support both JWT and API key/secret authentication
  if (auth.jwt) {
    headers['Authorization'] = `Bearer ${auth.jwt}`;
  } else if (auth.apiKey && auth.secretApiKey) {
    headers['pinata_api_key'] = auth.apiKey;
    headers['pinata_secret_api_key'] = auth.secretApiKey;
  }

  const options = {
    hostname: 'api.pinata.cloud',
    port: 443,
    path: '/pinning/pinFileToIPFS',
    method: 'POST',
    headers
  };

  return makeRequest(options, formData);
}

/**
 * Validate request body
 */
function validateRequest(body, fileBuffer) {
  if (!body) {
    throw new Error('Request body is required');
  }

  if (!body.file) {
    throw new Error('File data is required (base64 encoded)');
  }

  if (!body.fileName) {
    throw new Error('File name is required');
  }

  // Check file size using the already decoded buffer
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  return true;
}

/**
 * Main handler function
 */
async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Parse request body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }

    // Validate base64 format before decoding
    if (!body.file || !/^[A-Za-z0-9+/=]+$/.test(body.file)) {
      throw new Error('Invalid base64 encoded file data');
    }

    // Decode file data once
    const fileBuffer = Buffer.from(body.file, 'base64');

    // Validate request with the decoded buffer
    validateRequest(body, fileBuffer);

    const { fileName, metadata } = body;
    const results = {};

    // Check for required environment variables
    const nftStorageKey = process.env.NFT_STORAGE_API_KEY;
    if (!nftStorageKey) {
      throw new Error('NFT_STORAGE_API_KEY environment variable is not set');
    }

    // Pin to nft.storage (required)
    const nftStorageResult = await pinToNFTStorage(fileBuffer, fileName, nftStorageKey);
    results.nftStorage = {
      success: true,
      data: nftStorageResult.body
    };

    // Pin to Pinata (optional)
    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;

    if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
      try {
        const pinataAuth = pinataJwt 
          ? { jwt: pinataJwt }
          : { apiKey: pinataApiKey, secretApiKey: pinataSecretKey };
        
        const pinataResult = await pinToPinata(fileBuffer, fileName, pinataAuth);
        results.pinata = {
          success: true,
          data: pinataResult.body
        };
      } catch (pinataError) {
        results.pinata = {
          success: false,
          error: pinataError.message
        };
      }
    } else {
      results.pinata = {
        success: false,
        message: 'Pinata credentials not configured (optional)'
      };
    }

    // Include metadata if provided
    if (metadata) {
      results.metadata = metadata;
    }

    res.status(200).json({
      success: true,
      message: 'File pinned successfully',
      results
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Export for different serverless platforms
module.exports = handler;
module.exports.handler = handler;

// For local testing
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.post('/api/pin', handler);
  app.options('/api/pin', handler);
  
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Test server running on http://localhost:${port}`);
    console.log(`POST to http://localhost:${port}/api/pin to test`);
  });
}
