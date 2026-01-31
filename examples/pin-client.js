/**
 * Example Client for IPFS Pinning Endpoint
 * 
 * This example demonstrates how to call the /api/pin endpoint from a frontend application
 * to pin NFT metadata and images to IPFS using NFT.Storage and optionally Pinata.
 * 
 * Usage:
 * 1. Import this function into your React/Vue/vanilla JS app
 * 2. Call it with the required parameters
 * 3. Handle the response to get IPFS CIDs and URLs
 */

/**
 * Convert a File object to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string with data URI prefix
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
 * Pin content to IPFS via the serverless endpoint
 * 
 * @param {Object} options - Pin options
 * @param {string} options.name - Name/title of the NFT
 * @param {string} options.description - Description of the NFT
 * @param {File|string} options.image - File object or base64 string of the image
 * @param {boolean} options.pinata - Whether to also pin to Pinata (default: false)
 * @param {string} options.apiUrl - Base URL of your API (default: current origin)
 * @returns {Promise<Object>} Response with IPFS CIDs and URLs
 */
async function pinToIPFS({ name, description, image, pinata = false, apiUrl = '' }) {
  try {
    // Validate inputs
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required and must be a string');
    }

    if (!description || typeof description !== 'string') {
      throw new Error('Description is required and must be a string');
    }

    if (!image) {
      throw new Error('Image is required');
    }

    // Convert image to base64 if it's a File object
    let imageBase64;
    if (image instanceof File) {
      imageBase64 = await fileToBase64(image);
    } else if (typeof image === 'string') {
      imageBase64 = image;
    } else {
      throw new Error('Image must be a File object or base64 string');
    }

    // Prepare request body
    const requestBody = {
      name,
      description,
      imageBase64,
      pinata
    };

    // Make API request
    const response = await fetch(`${apiUrl}/api/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw error;
  }
}

/**
 * Example usage with file input
 */
async function exampleWithFileInput() {
  // Get file from input element
  const fileInput = document.getElementById('image-input');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select an image file');
    return;
  }

  try {
    // Show loading state
    console.log('Pinning to IPFS...');

    // Pin to IPFS
    const result = await pinToIPFS({
      name: 'My Rare Stamp NFT',
      description: 'A beautiful vintage stamp from 1920',
      image: file,
      pinata: true // Also pin to Pinata for redundancy
    });

    console.log('Successfully pinned to IPFS:', result);

    // Access the results
    const { nftStorage, pinata } = result;

    console.log('NFT.Storage CID:', nftStorage.cid);
    console.log('NFT.Storage URL:', nftStorage.gatewayUrl);
    
    if (pinata && pinata.success) {
      console.log('Pinata CID:', pinata.cid);
      console.log('Pinata URL:', pinata.gatewayUrl);
    }

    alert(`Success! IPFS CID: ${nftStorage.cid}`);
  } catch (error) {
    console.error('Failed to pin:', error);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Example usage with React
 */
function ReactExample() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const file = formData.get('image');
    const name = formData.get('name');
    const description = formData.get('description');

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await pinToIPFS({
        name,
        description,
        image: file,
        pinata: true
      });

      setResult(data);
      console.log('Pinning successful:', data);
    } catch (err) {
      setError(err.message);
      console.error('Pinning failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Pin NFT to IPFS</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">NFT Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="My Rare Stamp"
          />
        </div>

        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            required
            placeholder="A beautiful vintage stamp..."
          />
        </div>

        <div>
          <label htmlFor="image">Image:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Pinning...' : 'Pin to IPFS'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ color: 'green' }}>
          <h3>Success!</h3>
          <p>NFT.Storage CID: {result.nftStorage.cid}</p>
          <p>
            <a href={result.nftStorage.gatewayUrl} target="_blank" rel="noopener noreferrer">
              View on IPFS Gateway
            </a>
          </p>
          {result.pinata?.success && (
            <>
              <p>Pinata CID: {result.pinata.cid}</p>
              <p>
                <a href={result.pinata.gatewayUrl} target="_blank" rel="noopener noreferrer">
                  View on Pinata Gateway
                </a>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example usage with Vue 3
 */
const VueExample = {
  data() {
    return {
      loading: false,
      result: null,
      error: null,
      form: {
        name: '',
        description: '',
        image: null
      }
    };
  },
  methods: {
    handleFileChange(event) {
      this.form.image = event.target.files[0];
    },
    async handleSubmit() {
      this.loading = true;
      this.error = null;
      this.result = null;

      try {
        const data = await pinToIPFS({
          name: this.form.name,
          description: this.form.description,
          image: this.form.image,
          pinata: true
        });

        this.result = data;
        console.log('Pinning successful:', data);
      } catch (err) {
        this.error = err.message;
        console.error('Pinning failed:', err);
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div>
      <h2>Pin NFT to IPFS</h2>
      
      <form @submit.prevent="handleSubmit">
        <div>
          <label for="name">NFT Name:</label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            required
            placeholder="My Rare Stamp"
          />
        </div>

        <div>
          <label for="description">Description:</label>
          <textarea
            id="description"
            v-model="form.description"
            required
            placeholder="A beautiful vintage stamp..."
          />
        </div>

        <div>
          <label for="image">Image:</label>
          <input
            type="file"
            id="image"
            @change="handleFileChange"
            accept="image/*"
            required
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Pinning...' : 'Pin to IPFS' }}
        </button>
      </form>

      <div v-if="error" style="color: red;">
        <h3>Error:</h3>
        <p>{{ error }}</p>
      </div>

      <div v-if="result" style="color: green;">
        <h3>Success!</h3>
        <p>NFT.Storage CID: {{ result.nftStorage.cid }}</p>
        <p>
          <a :href="result.nftStorage.gatewayUrl" target="_blank" rel="noopener noreferrer">
            View on IPFS Gateway
          </a>
        </p>
        <template v-if="result.pinata?.success">
          <p>Pinata CID: {{ result.pinata.cid }}</p>
          <p>
            <a :href="result.pinata.gatewayUrl" target="_blank" rel="noopener noreferrer">
              View on Pinata Gateway
            </a>
          </p>
        </template>
      </div>
    </div>
  `
};

// Export for use in modules
export { pinToIPFS, fileToBase64 };
