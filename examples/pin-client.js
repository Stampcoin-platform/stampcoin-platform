// Example client for calling the /api/pin endpoint
// This demonstrates how to send a base64-encoded image to the IPFS pinning API

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000/api/pin';
const IMAGE_PATH = process.argv[2]; // Pass image path as command line argument

/**
 * Convert image file to base64 data URL
 * @param {string} filePath - Path to the image file
 * @returns {string} Base64 data URL
 */
function imageToBase64DataUrl(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  
  // Map file extension to MIME type
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  
  const mimeType = mimeTypes[ext] || 'image/jpeg';
  const base64 = imageBuffer.toString('base64');
  
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Pin image to IPFS via the API endpoint
 * @param {Object} options - Pin options
 * @param {string} options.name - Name/title for the NFT
 * @param {string} options.description - Description for the NFT
 * @param {string} options.imageBase64 - Base64-encoded image data URL
 * @param {boolean} options.pinata - Whether to also pin to Pinata (default: false)
 * @returns {Promise<Object>} API response with IPFS URLs
 */
async function pinToIPFS({ name, description, imageBase64, pinata = false }) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        imageBase64,
        pinata
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error pinning to IPFS:', error.message);
    throw error;
  }
}

// Example usage
async function main() {
  if (!IMAGE_PATH) {
    console.log('Usage: node pin-client.js <path-to-image>');
    console.log('Example: node pin-client.js ./my-stamp.png');
    process.exit(1);
  }

  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`Error: Image file not found at ${IMAGE_PATH}`);
    process.exit(1);
  }

  console.log('Converting image to base64...');
  const imageBase64 = imageToBase64DataUrl(IMAGE_PATH);
  
  console.log('Pinning to IPFS...');
  const result = await pinToIPFS({
    name: 'My Stamp Collection',
    description: 'A beautiful vintage stamp from my collection',
    imageBase64,
    pinata: false // Set to true if you also want to pin to Pinata
  });

  console.log('\n✅ Successfully pinned to IPFS!');
  console.log('\nNFT.Storage Result:');
  console.log(JSON.stringify(result.nftStorage, null, 2));
  
  if (result.pinata) {
    console.log('\nPinata Result:');
    console.log(JSON.stringify(result.pinata, null, 2));
  }

  console.log('\n📦 Metadata URL:', result.nftStorage.url);
  console.log('🖼️  IPFS Gateway URL:', result.nftStorage.data?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/'));
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { pinToIPFS, imageToBase64DataUrl };
