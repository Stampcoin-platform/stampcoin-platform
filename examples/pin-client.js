// Simple browser example showing how to call /api/pin with base64 image data
// This demonstrates how to use the IPFS pinning endpoint from client-side code

async function pinImageToIPFS(file, options = {}) {
  const { name = '', description = '', pinata = false } = options;

  // Convert file to base64 data URL
  const reader = new FileReader();
  const imageBase64 = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Make request to serverless endpoint
  const response = await fetch('/api/pin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      imageBase64,
      pinata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

// Example usage in browser:
// HTML: <input type="file" id="fileInput" accept="image/*">
// 
// document.getElementById('fileInput').addEventListener('change', async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
//
//   try {
//     console.log('Pinning image to IPFS...');
//     const result = await pinImageToIPFS(file, {
//       name: 'My Stamp NFT',
//       description: 'A beautiful vintage stamp',
//       pinata: true  // Also pin to Pinata if credentials are configured
//     });
//     
//     console.log('Success!', result);
//     console.log('NFT.storage IPFS URL:', result.nftStorage.url);
//     console.log('NFT Metadata:', result.nftStorage.data);
//     
//     if (result.pinata) {
//       console.log('Pinata IPFS Hash:', result.pinata.IpfsHash);
//     }
//   } catch (error) {
//     console.error('Error pinning to IPFS:', error.message);
//   }
// });
