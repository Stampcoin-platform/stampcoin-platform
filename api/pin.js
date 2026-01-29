// Serverless endpoint for pinning to IPFS via Pinata.
// Compatible with Vercel Serverless (place in /api/pin.js).
// Expects POST with JSON: { name, description, imageBase64 }
// Note: nft.storage has been decommissioned and is no longer supported.
const fetch = require('node-fetch');
const FormData = require('form-data');

// Max file size (default 5MB, configurable via MAX_FILE_SIZE_MB env var)
const MAX_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

// Allowed MIME types for security
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

function isBase64DataUrl(s) {
  return typeof s === 'string' && s.startsWith('data:') && s.includes(';base64,');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    let name = '';
    let description = '';
    let imageBase64 = '';

    if (contentType.includes('application/json')) {
      ({ name = '', description = '', imageBase64 = '' } = req.body || {});
    } else {
      return res.status(400).json({ error: 'Unsupported content type. Use application/json with imageBase64.' });
    }

    if (!imageBase64 || !isBase64DataUrl(imageBase64)) {
      return res.status(400).json({ error: 'imageBase64 must be a data URL (e.g., data:image/png;base64,...)' });
    }

    // Validate MIME type
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (!mimeMatch) {
      return res.status(400).json({ error: 'Invalid data URL format' });
    }
    
    const mimeType = mimeMatch[1];
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ 
        error: `Unsupported MIME type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
      });
    }

    // Extract and validate base64 data
    const parts = imageBase64.split(',');
    if (parts.length !== 2 || !parts[1]) {
      return res.status(400).json({ error: 'Invalid data URL format. Expected format: data:image/type;base64,<data>' });
    }
    
    const base64 = parts[1];
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: `File too large. Max ${MAX_BYTES} bytes (${MAX_BYTES / 1024 / 1024}MB).` });
    }
    
    const ext = mimeType.split('/')[1] || 'bin';
    
    // Sanitize filename to prevent path traversal attacks
    const sanitizeName = (str) => {
      if (!str) return '';
      // Remove path separators, special chars, limit length
      return str
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
    };
    
    const safeName = sanitizeName(name);
    const filename = safeName ? `${safeName}.${ext}` : `upload.${ext}`;

    // Check Pinata credentials
    const pinataJwt = process.env.PINATA_JWT || '';
    const pinataApiKey = process.env.PINATA_API_KEY || '';
    const pinataSecret = process.env.PINATA_SECRET_API_KEY || '';

    if (!pinataJwt && (!pinataApiKey || !pinataSecret)) {
      return res.status(500).json({ 
        error: 'IPFS pinning not configured. Set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_API_KEY environment variables.' 
      });
    }

    // Pin to Pinata
    const form = new FormData();
    form.append('file', buffer, { filename });

    // Add metadata if provided
    if (name || description) {
      const metadata = {
        name: filename,
        keyvalues: {}
      };
      if (name) metadata.keyvalues.name = name;
      if (description) metadata.keyvalues.description = description;
      form.append('pinataMetadata', JSON.stringify(metadata));
    }

    const headers = {};
    if (pinataJwt) {
      headers.Authorization = `Bearer ${pinataJwt}`;
    } else {
      headers.pinata_api_key = pinataApiKey;
      headers.pinata_secret_api_key = pinataSecret;
    }

    const pinataResp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: form
    });

    if (!pinataResp.ok) {
      const text = await pinataResp.text();
      return res.status(pinataResp.status).json({ 
        error: 'Failed to pin to Pinata', 
        details: text 
      });
    }

    const result = await pinataResp.json();
    
    // Return standardized response
    return res.status(200).json({
      success: true,
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      metadata: { name, description }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
