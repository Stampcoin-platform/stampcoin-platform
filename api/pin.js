/**
 * Secure Serverless IPFS Pinning Endpoint
 * 
 * This endpoint pins media and metadata to IPFS using NFT.Storage and optionally Pinata.
 * It's framework-agnostic and compatible with Vercel, Netlify, and other serverless platforms.
 * 
 * Required Environment Variables:
 * - NFT_STORAGE_API_KEY: API key for NFT.Storage
 * - PINATA_API_KEY: (Optional) API key for Pinata
 * - PINATA_SECRET_API_KEY: (Optional) Secret key for Pinata
 * - PINATA_JWT: (Optional) JWT token for Pinata (alternative to API key/secret)
 * 
 * Usage:
 * POST /api/pin with JSON body:
 * {
 *   "name": "NFT Name",
 *   "description": "NFT Description",
 *   "imageBase64": "base64-encoded-image-data",
 *   "pinata": true  // Optional: also pin to Pinata
 * }
 */

import https from 'https';
import { Buffer } from 'buffer';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validate base64 image data
 */
function validateBase64Image(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('Invalid image data');
  }

  // Extract MIME type from data URI if present
  let mimeType = 'image/png';
  let base64Content = base64Data;

  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URI format');
    }
    mimeType = matches[1];
    base64Content = matches[2];
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  // Decode and validate size
  const buffer = Buffer.from(base64Content, 'base64');
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  return { buffer, mimeType };
}

/**
 * Pin to NFT.Storage
 */
async function pinToNFTStorage(name, description, imageBuffer, mimeType) {
  const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY;
  
  if (!NFT_STORAGE_API_KEY) {
    throw new Error('NFT_STORAGE_API_KEY is not configured');
  }

  // Import crypto for secure random boundary
  const crypto = await import('crypto');
  
  // Create form data boundary with cryptographically secure random
  const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
  
  // Build multipart form data
  const parts = [];
  
  // Add image file
  parts.push(
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="image.${mimeType.split('/')[1]}"\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  
  const header = Buffer.from(parts.join(''));
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, imageBuffer, footer]);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.nft.storage',
      path: '/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve({
              success: true,
              cid: response.value?.cid,
              ipfsUrl: `ipfs://${response.value?.cid}`,
              gatewayUrl: `https://nftstorage.link/ipfs/${response.value?.cid}`,
              name,
              description
            });
          } catch (error) {
            reject(new Error(`Failed to parse NFT.Storage response: ${error.message}`));
          }
        } else {
          reject(new Error(`NFT.Storage API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`NFT.Storage request failed: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Pin to Pinata
 */
async function pinToPinata(name, description, imageBuffer, mimeType) {
  const PINATA_JWT = process.env.PINATA_JWT;
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_API_KEY)) {
    throw new Error('Pinata credentials not configured');
  }

  // Import crypto for secure random boundary
  const crypto = await import('crypto');
  
  // Create form data boundary with cryptographically secure random
  const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
  
  // Build multipart form data
  const parts = [];
  
  // Add image file
  parts.push(
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="${name}.${mimeType.split('/')[1]}"\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  
  const header = Buffer.from(parts.join(''));
  
  // Add metadata
  const metadata = JSON.stringify({
    name,
    keyvalues: {
      description
    }
  });
  
  const metadataPart = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="pinataMetadata"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    metadata
  );
  
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, imageBuffer, metadataPart, footer]);

  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    };

    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_API_KEY;
    }

    const options = {
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinFileToIPFS',
      method: 'POST',
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            resolve({
              success: true,
              cid: response.IpfsHash,
              ipfsUrl: `ipfs://${response.IpfsHash}`,
              gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`,
              pinSize: response.PinSize,
              timestamp: response.Timestamp
            });
          } catch (error) {
            reject(new Error(`Failed to parse Pinata response: ${error.message}`));
          }
        } else {
          reject(new Error(`Pinata API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Pinata request failed: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Main handler function (Vercel/Netlify compatible)
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    let body = req.body;
    
    // If body is a string, parse it
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    // Validate required fields
    const { name, description, imageBase64, pinata = false } = body;

    if (!name || typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!description || typeof description !== 'string' || description.length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate and decode image
    const { buffer, mimeType } = validateBase64Image(imageBase64);

    // Pin to NFT.Storage
    const nftStorageResult = await pinToNFTStorage(name, description, buffer, mimeType);

    // Prepare response
    const response = {
      success: true,
      nftStorage: nftStorageResult
    };

    // Optionally pin to Pinata
    if (pinata === true || pinata === 'true') {
      try {
        const pinataResult = await pinToPinata(name, description, buffer, mimeType);
        response.pinata = pinataResult;
      } catch (error) {
        // Non-fatal: return partial success
        response.pinata = {
          success: false,
          error: error.message
        };
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Pin endpoint error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false 
    });
  }
}

// Alternative exports for different serverless platforms
export { handler };

// Note: CommonJS exports removed as this is an ES module
// For platforms requiring CommonJS, they should transpile this module
