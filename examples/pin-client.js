// Simple example for calling the serverless /api/pin endpoint (browser or client-side)
async function pinImageBase64(imageBase64, name = 'My NFT', description = '') {
  const resp = await fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description,
      imageBase64
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'unknown' }));
    throw new Error('Pin failed: ' + (err.error || JSON.stringify(err)));
  }
  return resp.json();
}

// Example usage with an <input type="file"> element:
async function handleFileInput(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    try {
      const result = await pinImageBase64(dataUrl, 'Example', 'Pinned via API');
      console.log('Pin result:', result);
      console.log('IPFS URL:', result.ipfsUrl);
      console.log('Gateway URL:', result.gatewayUrl);
    } catch (err) {
      console.error(err);
    }
  };
  reader.readAsDataURL(file);
}
