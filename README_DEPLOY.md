# Deployment & IPFS Pinning Documentation

This document explains the deployment workflows and IPFS pinning endpoint added to the Stampcoin-platform repository.

## Files Added

### GitHub Actions Workflows

1. **`.github/workflows/deploy-vercel.yml`** - Automated deployment to Vercel
2. **`.github/workflows/deploy-fly.yml`** - Automated deployment to Fly.io
3. **`.github/workflows/deploy-railway.yml`** - Automated deployment to Railway

### API Endpoints

4. **`api/pin.js`** - Serverless endpoint for pinning images to IPFS via nft.storage and Pinata

### Examples & Documentation

5. **`examples/pin-client.js`** - Client-side example for calling the pin endpoint
6. **`.env.example`** - Updated with deployment and IPFS environment variables
7. **`README_DEPLOY.md`** - This documentation file

---

## Required Environment Variables

All environment variables should be added to:
- GitHub repository secrets (for CI/CD workflows)
- Your deployment platform dashboard (Vercel/Fly/Railway)
- Local `.env` file (for development)

### IPFS/NFT Storage Variables

```bash
# Required for api/pin.js endpoint
NFT_STORAGE_API_KEY=         # Get from https://nft.storage
PINATA_API_KEY=              # Get from https://pinata.cloud
PINATA_SECRET_API_KEY=       # Get from https://pinata.cloud
PINATA_JWT=                  # Optional: JWT token from Pinata (preferred over API key/secret)
```

### Vercel Deployment Variables

```bash
VERCEL_TOKEN=                # Get from Vercel dashboard > Settings > Tokens
VERCEL_ORG_ID=              # Optional: Your Vercel organization ID
VERCEL_PROJECT_ID=          # Optional: Your Vercel project ID
```

### Fly.io Deployment Variables

```bash
FLY_API_TOKEN=              # Get from: flyctl auth token
FLY_APP_NAME=               # Your Fly app name (from fly.toml or flyctl apps list)
```

### Railway Deployment Variables

```bash
RAILWAY_TOKEN=              # Get from Railway dashboard > Account > Tokens
RAILWAY_PROJECT_ID=         # Your Railway project ID (from dashboard URL)
```

---

## Setup Instructions

### 1. Add Secrets to GitHub Repository

Navigate to your repository on GitHub:
1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Add each required secret:
   - `NFT_STORAGE_API_KEY`
   - `PINATA_API_KEY`
   - `PINATA_SECRET_API_KEY` (or `PINATA_JWT`)
   - `VERCEL_TOKEN`
   - `FLY_API_TOKEN`
   - `FLY_APP_NAME`
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`

### 2. Configure Deployment Platforms

#### Vercel Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` to authenticate
3. Run `vercel` in your project directory to create/link project
4. Add environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all required variables from `.env.example`
5. Get your `VERCEL_TOKEN` from: Settings > Tokens > Create Token

#### Fly.io Setup

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run `flyctl auth login` to authenticate
3. If you don't have `fly.toml`:
   - Run `flyctl launch` in your project directory
   - Follow prompts to configure your app
   - Commit the generated `fly.toml` file
4. Add secrets: `flyctl secrets set KEY=value`
5. Get your API token: `flyctl auth token`

#### Railway Setup

1. Create account at https://railway.app
2. Create a new project or link existing one
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard:
   - Go to your project > Variables tab
   - Add all required variables from `.env.example`
5. Get your Railway token: Settings > Tokens > Create Token
6. Find your project ID in the dashboard URL

---

## IPFS Pinning API Usage

### Endpoint: `POST /api/pin`

The serverless endpoint accepts JSON with the following structure:

```json
{
  "name": "My NFT",
  "description": "NFT description",
  "imageBase64": "data:image/png;base64,iVBORw0KG...",
  "pinata": false
}
```

### Parameters

- `name` (string, optional): Name for the NFT metadata
- `description` (string, optional): Description for the NFT metadata
- `imageBase64` (string, required): Base64-encoded data URL (e.g., `data:image/png;base64,...`)
- `pinata` (boolean, optional): If `true`, also pins to Pinata (default: `false`)

### Response

```json
{
  "nftStorage": {
    "ipnft": "bafyreid...",
    "url": "ipfs://bafyreid.../metadata.json"
  },
  "pinata": {
    "IpfsHash": "Qm...",
    "PinSize": 12345
  }
}
```

### Example Usage

See `examples/pin-client.js` for a complete client-side example.

```javascript
// Browser example
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    const imageBase64 = event.target.result;
    
    const response = await fetch('/api/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Stamp NFT',
        description: 'Vintage stamp from collection',
        imageBase64,
        pinata: false
      })
    });
    
    const result = await response.json();
    console.log('IPFS URL:', result.nftStorage.url);
  };
  
  reader.readAsDataURL(file);
});
```

---

## Security Recommendations

### DO NOT commit secrets

- Never commit actual API keys, tokens, or passwords to the repository
- Always use `.env` files for local development
- Use GitHub Secrets for CI/CD workflows
- Use platform environment variables for production deployments

### API Rate Limits

- **nft.storage**: Free tier has rate limits; monitor usage
- **Pinata**: Free tier limits apply; consider paid plans for production

### File Size Limits

- The `api/pin.js` endpoint enforces a 5MB file size limit
- Adjust `MAX_BYTES` constant if needed
- Consider implementing additional validation (file type, dimensions, etc.)

### CORS Configuration

If deploying the API endpoint separately from your frontend, configure CORS appropriately:

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

---

## Workflow Behavior

All three deployment workflows (Vercel, Fly, Railway) trigger on:
- Push to `main` branch

### Common Steps

1. **Checkout code** - Retrieves repository code
2. **Validate .env.example** - Ensures configuration template exists
3. **Setup Node.js** - Installs Node.js 18
4. **Install dependencies** - Runs `npm ci`
5. **Build** - Runs `npm run build`
6. **Deploy** - Platform-specific deployment

### Workflow-Specific Notes

#### Vercel Workflow
- Uses `vercel` CLI with `--prod` flag
- Requires `VERCEL_TOKEN` secret
- Automatically detects project from repository

#### Fly Workflow
- Requires `fly.toml` configuration file
- Uses `FLY_API_TOKEN` and `FLY_APP_NAME` secrets
- Runs with production build arguments

#### Railway Workflow
- Can use Railway GitHub integration or CLI deployment
- Falls back gracefully if `RAILWAY_PROJECT_ID` not set
- Logs in with `RAILWAY_TOKEN`

---

## Next Steps

1. **Add Required Secrets**: Follow setup instructions above to add all required secrets
2. **Test Locally**: Test the pin endpoint locally before deploying
3. **Choose Deployment Platform**: Select Vercel, Fly, or Railway (or multiple)
4. **Configure Platform**: Set up environment variables in your chosen platform
5. **Push to Main**: Merge your PR to trigger automatic deployment
6. **Monitor Deployments**: Check GitHub Actions logs for deployment status

### If Using Next.js

The `api/pin.js` file is compatible with Vercel Serverless Functions. If you're using Next.js:

1. Move `api/pin.js` to `pages/api/pin.js` (Pages Router)
2. Or move to `app/api/pin/route.js` and adapt for App Router
3. Update import statements as needed for Next.js compatibility

### Testing the API

```bash
# Test locally (requires nft.storage API key in .env)
curl -X POST http://localhost:3000/api/pin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test NFT",
    "description": "Testing pinning",
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "pinata": false
  }'
```

---

## Troubleshooting

### Workflow fails with "Missing secrets"
- Verify all required secrets are added to GitHub repository
- Check secret names match exactly (case-sensitive)

### Vercel deployment fails
- Ensure `VERCEL_TOKEN` has proper permissions
- Run `vercel` locally first to link project
- Check build command in `package.json`

### Fly deployment fails
- Verify `fly.toml` exists and is committed
- Check `FLY_APP_NAME` matches your app
- Ensure `FLY_API_TOKEN` is valid

### Railway deployment fails
- Verify Railway GitHub integration is enabled
- Check `RAILWAY_PROJECT_ID` is correct
- Ensure `RAILWAY_TOKEN` has proper permissions

### Pin endpoint returns 500 error
- Check `NFT_STORAGE_API_KEY` is valid
- Verify image is proper base64 data URL format
- Check file size is under 5MB limit
- Review server logs for detailed error messages

---

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs)
- [Railway Documentation](https://docs.railway.app)
- [nft.storage Documentation](https://nft.storage/docs)
- [Pinata Documentation](https://docs.pinata.cloud)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Support

For issues related to:
- **Deployment workflows**: Check GitHub Actions logs
- **IPFS pinning**: Verify API keys and file format
- **Platform-specific issues**: Consult platform documentation

See `.env.example` for a complete list of required environment variables.
