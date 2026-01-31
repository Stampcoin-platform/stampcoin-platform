/**
 * Example client for using the serverless IPFS pinning endpoint
 * 
 * This demonstrates how to call the /api/pin endpoint from a frontend application
 * to pin images and metadata to IPFS via nft.storage and Pinata.
 */

// Configuration
const API_ENDPOINT = '/api/pin'; // Update with your deployed endpoint URL
// For production: const API_ENDPOINT = 'https://your-app.vercel.app/api/pin';

/**
 * Convert a File object to base64 string
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pin a file to IPFS using the serverless endpoint
 * 
 * @param {File} file - The file to pin
 * @param {Object} metadata - Optional metadata to include
 * @returns {Promise<Object>} - Response from the API
 */
async function pinToIPFS(file, metadata = {}) {
  try {
    // Convert file to base64
    console.log('Converting file to base64...');
    const base64Data = await fileToBase64(file);
    
    // Prepare request payload
    const payload = {
      file: base64Data,
      fileName: file.name,
      metadata: {
        ...metadata,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Send request to API
    console.log('Sending request to API...');
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    // Parse response
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: Request failed`);
    }
    
    console.log('File pinned successfully!', result);
    return result;
    
  } catch (error) {
    console.error('Error pinning file:', error);
    throw error;
  }
}

/**
 * Example usage with an HTML form
 */
function setupFormHandler() {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  
  if (!form || !fileInput) {
    console.warn('Form elements not found. Make sure you have the required HTML elements.');
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    // Update UI
    statusDiv.textContent = 'Uploading...';
    statusDiv.className = 'status uploading';
    resultDiv.textContent = '';
    
    try {
      // Pin the file
      const result = await pinToIPFS(file, {
        description: 'Example upload from pin-client.js',
        uploadedBy: 'demo-user'
      });
      
      // Display results
      statusDiv.textContent = 'Upload successful!';
      statusDiv.className = 'status success';
      
      // Format result for display
      let resultText = 'File pinned successfully!\n\n';
      
      if (result.results.nftStorage?.success) {
        const ipfsUrl = `https://ipfs.io/ipfs/${result.results.nftStorage.data.value.cid}`;
        resultText += `NFT.Storage: ✓\n`;
        resultText += `IPFS CID: ${result.results.nftStorage.data.value.cid}\n`;
        resultText += `URL: ${ipfsUrl}\n\n`;
      }
      
      if (result.results.pinata?.success) {
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.results.pinata.data.IpfsHash}`;
        resultText += `Pinata: ✓\n`;
        resultText += `IPFS Hash: ${result.results.pinata.data.IpfsHash}\n`;
        resultText += `URL: ${ipfsUrl}\n`;
      }
      
      resultDiv.textContent = resultText;
      
    } catch (error) {
      statusDiv.textContent = `Error: ${error.message}`;
      statusDiv.className = 'status error';
    }
  });
}

/**
 * Example: Pin an image from a URL
 */
async function pinImageFromURL(imageUrl, fileName) {
  try {
    // Fetch image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Convert to File object
    const file = new File([blob], fileName, { type: blob.type });
    
    // Pin to IPFS
    return await pinToIPFS(file);
    
  } catch (error) {
    console.error('Error pinning image from URL:', error);
    throw error;
  }
}

/**
 * Example: Pin base64 data directly
 */
async function pinBase64Data(base64Data, fileName, metadata = {}) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Data,
        fileName: fileName,
        metadata: metadata
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error pinning base64 data:', error);
    throw error;
  }
}

// Initialize form handler when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFormHandler);
  } else {
    setupFormHandler();
  }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    pinToIPFS,
    pinImageFromURL,
    pinBase64Data,
    fileToBase64
  };
}

/* 
 * Example HTML to use with this script:
 * 
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <title>IPFS Pin Example</title>
 *   <style>
 *     .container { max-width: 600px; margin: 50px auto; padding: 20px; }
 *     .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
 *     .status.uploading { background: #fff3cd; color: #856404; }
 *     .status.success { background: #d4edda; color: #155724; }
 *     .status.error { background: #f8d7da; color: #721c24; }
 *     #result { white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; }
 *   </style>
 * </head>
 * <body>
 *   <div class="container">
 *     <h1>Pin File to IPFS</h1>
 *     <form id="upload-form">
 *       <input type="file" id="file-input" accept="image/*" required>
 *       <button type="submit">Upload to IPFS</button>
 *     </form>
 *     <div id="status"></div>
 *     <div id="result"></div>
 *   </div>
 *   <script src="pin-client.js"></script>
 * </body>
 * </html>
 */
