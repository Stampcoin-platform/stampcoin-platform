// Serverless API endpoint for pinning NFT metadata to IPFS
// Compatible with Vercel serverless functions

const https = require('https');

// Maximum image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validates a data URL and returns the decoded buffer
 */
function validateAndDecodeDataURL(dataURL) {
  if (!dataURL || typeof dataURL !== 'string') {
    throw new Error('Invalid data URL');
  }

  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate MIME type
  if (!mimeType.startsWith('image/')) {
    throw new Error('Data URL must be an image');
  }

  // Decode base64
  const buffer = Buffer.from(base64Data, 'base64');

  // Check size
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  return { buffer, mimeType };
}

/**
 * Pin to nft.storage
 */
async function pinToNFTStorage(name, description, imageBuffer, mimeType, apiKey) {
  if (!apiKey) {
    throw new Error('NFT_STORAGE_API_KEY not configured');
  }

  // Create FormData-like structure for multipart/form-data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  // Build multipart form data
  const parts = [];
  
  // Add metadata
  const metadata = JSON.stringify({
    name,
    description,
    image: 'image.jpg' // placeholder, will be replaced by actual file
  });
  
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="meta"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${metadata}\r\n`
  );
  
  // Add image file
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image"; filename="image.jpg"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  
  const header = Buffer.from(parts.join(''), 'utf8');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const body = Buffer.concat([header, imageBuffer, footer]);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.nft.storage',
      path: '/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
            const result = JSON.parse(data);
            resolve({
              success: true,
              ipfsUrl: result.value?.url || `ipfs://${result.value?.cid}`,
              cid: result.value?.cid,
              data: result.value
            });
          } catch (e) {
            reject(new Error(`Failed to parse nft.storage response: ${e.message}`));
          }
        } else {
          reject(new Error(`nft.storage API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`nft.storage request failed: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Pin to Pinata
 */
async function pinToPinata(name, description, imageBuffer, mimeType, apiKey, apiSecret, jwt) {
  // Pinata requires either API Key + Secret OR JWT
  const authHeader = jwt 
    ? `Bearer ${jwt}`
    : null;

  if (!authHeader && (!apiKey || !apiSecret)) {
    throw new Error('Pinata requires either PINATA_JWT or both PINATA_API_KEY and PINATA_SECRET_API_KEY');
  }

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  // Build multipart form data for Pinata
  const metadata = JSON.stringify({
    name,
    keyvalues: {
      description
    }
  });

  const parts = [];
  
  // Add file
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  
  const header = Buffer.from(parts.join(''), 'utf8');
  
  const metadataPart = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="pinataMetadata"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}--\r\n`,
    'utf8'
  );
  
  const body = Buffer.concat([header, imageBuffer, metadataPart]);

  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    };

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    } else {
      headers['pinata_api_key'] = apiKey;
      headers['pinata_secret_api_key'] = apiSecret;
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
            const result = JSON.parse(data);
            resolve({
              success: true,
              ipfsUrl: `ipfs://${result.IpfsHash}`,
              hash: result.IpfsHash,
              data: result
            });
          } catch (e) {
            reject(new Error(`Failed to parse Pinata response: ${e.message}`));
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
 * Main serverless function handler
 */
module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const { name, description, imageBase64, pinata } = req.body;

    // Validate required fields
    if (!name || !description || !imageBase64) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, imageBase64' 
      });
    }

    // Validate and decode image
    const { buffer, mimeType } = validateAndDecodeDataURL(imageBase64);

    // Get API keys from environment variables
    const nftStorageKey = process.env.NFT_STORAGE_API_KEY;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    const pinataJWT = process.env.PINATA_JWT;

    // Pin to nft.storage (required)
    const nftStorageResult = await pinToNFTStorage(
      name,
      description,
      buffer,
      mimeType,
      nftStorageKey
    );

    const response = {
      success: true,
      nftStorage: nftStorageResult
    };

    // Optionally pin to Pinata if requested and credentials available
    if (pinata && (pinataJWT || (pinataApiKey && pinataSecretKey))) {
      try {
        const pinataResult = await pinToPinata(
          name,
          description,
          buffer,
          mimeType,
          pinataApiKey,
          pinataSecretKey,
          pinataJWT
        );
        response.pinata = pinataResult;
      } catch (error) {
        // Don't fail the entire request if Pinata fails
        response.pinata = {
          success: false,
          error: error.message
        };
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Pin API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
};
