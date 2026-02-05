// Serverless endpoint for pinning to nft.storage and optionally Pinata.
// Compatible with Vercel Serverless (place in /api/pin.js).
// Expects POST with JSON: { name, description, imageBase64, pinata }
const { NFTStorage, File } = require('nft.storage');

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// prefer global fetch if available, otherwise fallback to node-fetch
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    // will surface error below if fetch is needed and unavailable
  }
}

const NFT_TOKEN = process.env.NFT_STORAGE_API_KEY || '';

function isBase64DataUrl(s) {
  return typeof s === 'string' && s.startsWith('data:') && s.includes(';base64,');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!NFT_TOKEN) {
    console.error('Missing NFT_STORAGE_API_KEY');
    return res.status(500).json({ error: 'Server misconfiguration: NFT_STORAGE_API_KEY not set' });
  }

  if (!fetchFn) {
    console.error('fetch is not available (install node-fetch)');
    return res.status(500).json({ error: 'Server misconfiguration: fetch not available' });
  }

  const nft = new NFTStorage({ token: NFT_TOKEN });

  try {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Unsupported content type. Use application/json with imageBase64.' });
    }

    const {
      name = '',
      description = '',
      imageBase64 = '',
      pinata = false
    } = req.body || {};

    const pinataFlag = pinata === true || String(pinata).toLowerCase() === 'true';

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
    const filename = `upload.${ext}`;

    // Pin via nft.storage
    const file = new File([buffer], filename, { type: mimeType });
    const metadata = await nft.store({
      image: file,
      name: name || 'untitled',
      description: description || ''
    });

    const result = { nftStorage: metadata };

    // Optionally pin to Pinata
    if (pinataFlag) {
      const pinataJwt = process.env.PINATA_JWT || '';
      const pinataApiKey = process.env.PINATA_API_KEY || '';
      const pinataSecret = process.env.PINATA_SECRET_API_KEY || '';

      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', buffer, { filename });

      // include any metadata if desired (e.g., name/description) — omitted here for simplicity

      // Use form headers (contains boundary)
      const formHeaders = form.getHeaders ? form.getHeaders() : {};

      // attach auth headers appropriately
      const headers = { ...formHeaders };
      if (pinataJwt) {
        headers.Authorization = `Bearer ${pinataJwt}`;
      } else if (pinataApiKey && pinataSecret) {
        // Pinata expects these two fields as headers
        headers.pinata_api_key = pinataApiKey;
        headers.pinata_secret_api_key = pinataSecret;
      } else {
        // no Pinata auth available
        result.pinata = { ok: false, message: 'No Pinata credentials (PINATA_JWT or API key/secret) provided' };
      }

      if (!result.pinata) {
        const pinataResp = await fetchFn('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers,
          body: form
        });

        if (!pinataResp.ok) {
          const text = await pinataResp.text();
          result.pinata = { ok: false, status: pinataResp.status, message: text };
        } else {
          // some Pinata responses are JSON
          try {
            result.pinata = await pinataResp.json();
          } catch (e) {
            result.pinata = { ok: true, status: pinataResp.status };
          }
        }
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('pin endpoint error:', err);
    return res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
  }
};
