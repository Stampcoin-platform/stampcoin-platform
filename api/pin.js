// Serverless endpoint for pinning to nft.storage and optionally Pinata.
// Compatible with Vercel Serverless (place in /api/pin.js).
// Expects POST with JSON: { name, description, imageBase64, pinata }
const { NFTStorage, File } = require('nft.storage');
const fetch = require('node-fetch');

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const nft = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY || '' });

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
    let pinata = false;

    if (contentType.includes('application/json')) {
      ({ name = '', description = '', imageBase64 = '', pinata = false } = req.body || {});
    } else {
      return res.status(400).json({ error: 'Unsupported content type. Use application/json with imageBase64.' });
    }

    if (!imageBase64 || !isBase64DataUrl(imageBase64)) {
      return res.status(400).json({ error: 'imageBase64 must be a data URL (e.g., data:image/png;base64,...)' });
    }

    const base64 = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: `File too large. Max ${MAX_BYTES} bytes.` });
    }

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const ext = mimeType.split('/')[1] || 'bin';
    
    // Validate extension to prevent path traversal
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg+xml', 'bmp'];
    const safeExt = allowedExtensions.includes(ext.toLowerCase()) ? ext : 'bin';
    const filename = `upload.${safeExt}`;

    // Pin via nft.storage
    const file = new File([buffer], filename, { type: mimeType });
    const metadata = await nft.store({
      image: file,
      name: name || 'untitled',
      description: description || ''
    });

    const result = { nftStorage: metadata };

    // Optionally pin to Pinata
    if (pinata === true) {
      const pinataJwt = process.env.PINATA_JWT || '';
      const pinataApiKey = process.env.PINATA_API_KEY || '';
      const pinataSecret = process.env.PINATA_SECRET_API_KEY || '';

      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', buffer, { filename });

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
        result.pinata = { ok: false, status: pinataResp.status, message: text };
      } else {
        result.pinata = await pinataResp.json();
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
