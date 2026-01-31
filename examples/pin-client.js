// Example browser client for the IPFS pinning API
// This demonstrates how to use the /api/pin endpoint to pin images to IPFS

/**
 * Convert a File object to a base64 data URL
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pin an image to IPFS using the /api/pin endpoint
 * 
 * @param {string} name - Name of the NFT
 * @param {string} description - Description of the NFT
 * @param {File} imageFile - Image file to upload (max 5MB)
 * @param {boolean} pinToPinata - Whether to also pin to Pinata (default: false)
 * @returns {Promise<object>} Response from the API
 */
async function pinToIPFS(name, description, imageFile, pinToPinata = false) {
  try {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error(`Image size (${(imageFile.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 5MB`);
    }

    // Convert file to base64
    console.log('Converting image to base64...');
    const imageBase64 = await fileToBase64(imageFile);

    // Prepare request payload
    const payload = {
      name,
      description,
      imageBase64,
      pinata: pinToPinata
    };

    // Send request to API
    console.log('Sending request to /api/pin...');
    const response = await fetch('/api/pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    console.log('Successfully pinned to IPFS:', data);
    return data;

  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw error;
  }
}

/**
 * Example usage with a file input element
 */
function setupPinningForm() {
  // Create HTML form
  const html = `
    <div style="max-width: 600px; margin: 50px auto; font-family: Arial, sans-serif;">
      <h2>IPFS Pinning Example</h2>
      <form id="pinForm">
        <div style="margin-bottom: 15px;">
          <label for="name" style="display: block; margin-bottom: 5px;">NFT Name:</label>
          <input type="text" id="name" name="name" required 
                 style="width: 100%; padding: 8px; box-sizing: border-box;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="description" style="display: block; margin-bottom: 5px;">Description:</label>
          <textarea id="description" name="description" required 
                    style="width: 100%; padding: 8px; box-sizing: border-box; min-height: 80px;"></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="image" style="display: block; margin-bottom: 5px;">Image (max 5MB):</label>
          <input type="file" id="image" name="image" accept="image/*" required
                 style="width: 100%; padding: 8px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block;">
            <input type="checkbox" id="pinata" name="pinata">
            Also pin to Pinata
          </label>
        </div>
        
        <button type="submit" 
                style="background: #0070f3; color: white; padding: 10px 20px; border: none; 
                       border-radius: 5px; cursor: pointer; font-size: 16px;">
          Pin to IPFS
        </button>
        
        <div id="status" style="margin-top: 20px; padding: 10px; display: none;"></div>
      </form>
      
      <div id="result" style="margin-top: 30px; display: none;">
        <h3>Result:</h3>
        <div id="resultContent" style="background: #f5f5f5; padding: 15px; border-radius: 5px; 
                                       overflow-x: auto;">
        </div>
      </div>
    </div>
  `;

  // Insert HTML into page
  document.body.innerHTML = html;

  // Handle form submission
  document.getElementById('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const statusDiv = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');

    try {
      // Show loading status
      statusDiv.style.display = 'block';
      statusDiv.style.background = '#fffbcc';
      statusDiv.style.border = '1px solid #f0e68c';
      statusDiv.textContent = 'Uploading and pinning to IPFS...';
      resultDiv.style.display = 'none';

      // Get form values
      const name = document.getElementById('name').value;
      const description = document.getElementById('description').value;
      const imageFile = document.getElementById('image').files[0];
      const pinToPinata = document.getElementById('pinata').checked;

      // Pin to IPFS
      const result = await pinToIPFS(name, description, imageFile, pinToPinata);

      // Show success status
      statusDiv.style.background = '#d4edda';
      statusDiv.style.border = '1px solid #c3e6cb';
      statusDiv.textContent = '✓ Successfully pinned to IPFS!';

      // Show result
      resultDiv.style.display = 'block';
      resultContent.innerHTML = `
        <h4>nft.storage:</h4>
        <p><strong>IPFS URL:</strong> <a href="${result.nftStorage.ipfsUrl}" target="_blank">${result.nftStorage.ipfsUrl}</a></p>
        <p><strong>CID:</strong> ${result.nftStorage.cid}</p>
        
        ${result.pinata ? `
          <h4>Pinata:</h4>
          <p><strong>IPFS URL:</strong> <a href="${result.pinata.ipfsUrl}" target="_blank">${result.pinata.ipfsUrl}</a></p>
          <p><strong>Hash:</strong> ${result.pinata.hash}</p>
        ` : ''}
        
        <h4>Full Response:</h4>
        <pre style="overflow-x: auto; background: white; padding: 10px; border: 1px solid #ddd;">${JSON.stringify(result, null, 2)}</pre>
      `;

    } catch (error) {
      // Show error status
      statusDiv.style.display = 'block';
      statusDiv.style.background = '#f8d7da';
      statusDiv.style.border = '1px solid #f5c6cb';
      statusDiv.textContent = `✗ Error: ${error.message}`;
      resultDiv.style.display = 'none';
    }
  });
}

// Initialize the form when the page loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPinningForm);
  } else {
    setupPinningForm();
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    pinToIPFS,
    fileToBase64,
    setupPinningForm
  };
}
