# Deployment and IPFS Pinning Setup Guide

This guide explains the deployment workflows and IPFS pinning functionality added to the Stampcoin Platform.

## Overview

This repository now includes:
1. **Three GitHub Actions workflows** for automated deployment to Vercel, Fly.io, and Railway
2. **A serverless IPFS pinning API** (`/api/pin`) that supports NFT.Storage and Pinata
3. **Example client code** demonstrating how to use the pinning API
4. **Environment variable templates** for all required secrets

## Table of Contents

- [Deployment Workflows](#deployment-workflows)
  - [Vercel Deployment](#vercel-deployment)
  - [Fly.io Deployment](#flyio-deployment)
  - [Railway Deployment](#railway-deployment)
- [IPFS Pinning API](#ipfs-pinning-api)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Security](#security)
- [Required Environment Variables](#required-environment-variables)
- [Setup Instructions](#setup-instructions)
- [Troubleshooting](#troubleshooting)

---

## Deployment Workflows

All three deployment workflows are located in `.github/workflows/` and trigger automatically on pushes to the `main` branch. Each workflow:
- Validates that `.env.example` exists
- Sets up Node.js 18
- Installs dependencies with `npm ci`
- Builds the project with `npm run build`
- Deploys to the respective platform

### Vercel Deployment

**File:** `.github/workflows/deploy-vercel.yml`

**Required GitHub Secrets:**
- `VERCEL_TOKEN` - Your Vercel authentication token

**Setup Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → Tokens
3. Create a new token with deployment permissions
4. Add the token to GitHub:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Your Vercel token
5. In your Vercel project settings, add all required environment variables from `.env.example`

**Optional Environment Variables for Vercel:**
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### Fly.io Deployment

**File:** `.github/workflows/deploy-fly.yml`

**Required GitHub Secrets:**
- `FLY_API_TOKEN` - Your Fly.io API token
- `FLY_APP_NAME` - Your Fly.io app name

**Required File:** `fly.toml` (must be in repository root)

**Setup Steps:**
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Create app: `flyctl launch --no-deploy`
4. This generates `fly.toml` - commit it to your repository
5. Get your API token: `flyctl auth token`
6. Add secrets to GitHub:
   - `FLY_API_TOKEN` - The token from step 5
   - `FLY_APP_NAME` - Your app name from `fly.toml`
7. Set environment variables in Fly.io:
   ```bash
   flyctl secrets set NFT_STORAGE_API_KEY=your_key
   flyctl secrets set PINATA_JWT=your_jwt
   # Add all other required secrets from .env.example
   ```

### Railway Deployment

**File:** `.github/workflows/deploy-railway.yml`

**Required GitHub Secrets:**
- `RAILWAY_TOKEN` - Your Railway API token
- `RAILWAY_PROJECT_ID` - Your Railway project ID (optional if using GitHub integration)

**Setup Steps:**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create a new project or select existing one
3. Get your project ID from the project settings
4. Generate a token:
   - Go to Account Settings → Tokens
   - Create a new token
5. Add secrets to GitHub:
   - `RAILWAY_TOKEN` - Your Railway token
   - `RAILWAY_PROJECT_ID` - Your project ID
6. In Railway dashboard, add all environment variables from `.env.example`

**Alternative:** Enable Railway's GitHub integration in the Railway dashboard to deploy automatically without using the CLI.

---

## IPFS Pinning API

The serverless endpoint `/api/pin.js` provides a secure way to pin images and metadata to IPFS using NFT.Storage and optionally Pinata.

### Setup

**Required Dependencies:**
The API requires these npm packages (add if not present):
```bash
npm install nft.storage node-fetch form-data
```

**Required Environment Variables:**
```bash
NFT_STORAGE_API_KEY=your_nft_storage_api_key
# Optional - for Pinata support:
PINATA_JWT=your_pinata_jwt_token
# OR
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

**Getting API Keys:**

1. **NFT.Storage (Required):**
   - Sign up at [nft.storage](https://nft.storage)
   - Navigate to API Keys section
   - Create a new API key
   - Copy and add to environment variables

2. **Pinata (Optional):**
   - Sign up at [pinata.cloud](https://pinata.cloud)
   - Go to API Keys section
   - Create a new API key with pinning permissions
   - Either use JWT (recommended) or API Key + Secret

### Usage

**API Endpoint:** `POST /api/pin`

**Request Format:**
```json
{
  "name": "My NFT Name",
  "description": "Description of the NFT",
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "pinata": false
}
```

**Parameters:**
- `name` (string, optional): Name/title for the NFT metadata
- `description` (string, optional): Description for the NFT metadata
- `imageBase64` (string, required): Base64-encoded image as data URL (e.g., `data:image/png;base64,...`)
- `pinata` (boolean, optional): Set to `true` to also pin to Pinata (default: `false`)

**Response Format:**
```json
{
  "nftStorage": {
    "url": "ipfs://bafyrei...",
    "data": {
      "name": "My NFT Name",
      "description": "Description of the NFT",
      "image": "ipfs://bafkrei..."
    }
  },
  "pinata": {
    "IpfsHash": "Qm...",
    "PinSize": 12345,
    "Timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example Usage:**

See `examples/pin-client.js` for a complete working example.

```javascript
const fetch = require('node-fetch');
const fs = require('fs');

// Convert image to base64
const imageBuffer = fs.readFileSync('./my-image.png');
const base64 = imageBuffer.toString('base64');
const imageBase64 = `data:image/png;base64,${base64}`;

// Pin to IPFS
const response = await fetch('https://your-domain.com/api/pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Stamp Collection',
    description: 'A beautiful vintage stamp',
    imageBase64,
    pinata: false
  })
});

const result = await response.json();
console.log('Pinned to:', result.nftStorage.url);
```

**Using the Example Client:**
```bash
cd examples
node pin-client.js ../path/to/your/image.png
```

### Security

**Important Security Notes:**

1. **Environment Variables:** Never commit actual API keys to the repository. Always use environment variables.

2. **API Key Protection:** 
   - The `/api/pin.js` endpoint should be protected in production
   - Consider adding authentication/authorization middleware
   - Use API keys, JWT tokens, or session authentication
   - Implement rate limiting to prevent abuse

3. **File Size Limits:** 
   - Default max file size: 5 MB
   - Adjust `MAX_BYTES` in `api/pin.js` if needed
   - Consider implementing user-specific quotas

4. **CORS Configuration:**
   - For Vercel, create `vercel.json` with CORS settings if needed
   - Restrict origins in production

5. **Error Handling:**
   - The API returns detailed errors only in development
   - In production, consider masking sensitive error details

**Example Protection (add to api/pin.js):**
```javascript
// Add authentication check at the start of the handler
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.INTERNAL_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## Required Environment Variables

Copy `.env.example` to `.env` and fill in your values:

### IPFS Services
```bash
NFT_STORAGE_API_KEY=         # Required for /api/pin
PINATA_API_KEY=              # Optional
PINATA_SECRET_API_KEY=       # Optional
PINATA_JWT=                  # Optional (alternative to API Key + Secret)
```

### Deployment Platforms
```bash
# Vercel
VERCEL_TOKEN=                # Required for Vercel deployment
VERCEL_ORG_ID=               # Optional
VERCEL_PROJECT_ID=           # Optional

# Fly.io
FLY_API_TOKEN=               # Required for Fly deployment
FLY_APP_NAME=                # Required for Fly deployment

# Railway
RAILWAY_TOKEN=               # Required for Railway deployment
RAILWAY_PROJECT_ID=          # Optional if using GitHub integration
```

---

## Setup Instructions

### 1. Add GitHub Secrets

For **all deployment workflows**, add the required secrets:

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one:
   - `VERCEL_TOKEN`
   - `FLY_API_TOKEN`
   - `FLY_APP_NAME`
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`

### 2. Configure Platform Dashboards

**Vercel:**
1. Import your GitHub repository in Vercel dashboard
2. Add environment variables in Project Settings → Environment Variables
3. Deploy the project

**Fly.io:**
1. Run `flyctl launch --no-deploy` locally
2. Commit the generated `fly.toml` file
3. Set secrets: `flyctl secrets set KEY=value`

**Railway:**
1. Create a new project in Railway dashboard
2. Connect your GitHub repository
3. Add environment variables in the Variables section
4. Enable automatic deployments

### 3. Test the IPFS API Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your NFT_STORAGE_API_KEY

# Start the development server
npm run dev

# In another terminal, test the API
cd examples
node pin-client.js ./test-image.png
```

### 4. Deploy

Push to the `main` branch to trigger all deployment workflows:

```bash
git add .
git commit -m "Configure deployment"
git push origin main
```

Monitor the deployments:
- GitHub: Actions tab
- Vercel: [Dashboard](https://vercel.com/dashboard)
- Fly.io: `flyctl status`
- Railway: [Dashboard](https://railway.app/dashboard)

---

## Troubleshooting

### Workflow Fails: "npm ci" Error
- **Cause:** Lock file mismatch or missing dependencies
- **Solution:** Run `npm install` locally and commit the updated `package-lock.json`

### Workflow Fails: ".env.example not found"
- **Cause:** The file doesn't exist in the repository
- **Solution:** Ensure `.env.example` is committed to the repository

### Vercel Deployment: "Missing Required Secrets"
- **Cause:** `VERCEL_TOKEN` not set or invalid
- **Solution:** Generate a new token in Vercel dashboard and update the GitHub secret

### Fly.io Deployment: "fly.toml not found"
- **Cause:** Configuration file missing
- **Solution:** Run `flyctl launch --no-deploy` locally and commit `fly.toml`

### Railway Deployment: "Project not found"
- **Cause:** Invalid `RAILWAY_PROJECT_ID` or token
- **Solution:** Verify the project ID in Railway dashboard and regenerate token if needed

### IPFS API: "NFT_STORAGE_API_KEY is required"
- **Cause:** Environment variable not set
- **Solution:** Add `NFT_STORAGE_API_KEY` to your platform's environment variables

### IPFS API: "File too large"
- **Cause:** Image exceeds 5 MB limit
- **Solution:** 
  - Compress the image
  - Or increase `MAX_BYTES` in `api/pin.js`

### IPFS API: "Network error to Pinata"
- **Cause:** Invalid Pinata credentials or network issue
- **Solution:** Verify Pinata API keys and check their service status

---

## Next Steps

1. **Protect the API:** Add authentication to `/api/pin.js`
2. **Add Rate Limiting:** Implement rate limiting for the API endpoint
3. **Monitor Deployments:** Set up monitoring and alerts for your deployments
4. **Custom Domain:** Configure custom domains for your deployments
5. **CI/CD Enhancements:** Add testing and linting to the workflows
6. **Database Migration:** Add database migration steps if needed
7. **Environment-Specific Builds:** Configure different builds for staging/production

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [NFT.Storage Documentation](https://nft.storage/docs/)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review platform-specific documentation
3. Open an issue in this repository
4. Contact the platform support teams

---

**Note:** This setup provides the foundation for automated deployments. You may need to customize the workflows based on your specific build requirements, package manager (npm/yarn/pnpm), or deployment strategy.
