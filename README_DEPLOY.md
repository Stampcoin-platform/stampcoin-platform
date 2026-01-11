# Deployment and IPFS Pinning Guide

This guide explains how to set up CI/CD deployments to Vercel, Fly.io, and Railway, and how to use the secure IPFS pinning endpoint.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Setting Up GitHub Secrets](#setting-up-github-secrets)
- [Platform-Specific Setup](#platform-specific-setup)
  - [Vercel Setup](#vercel-setup)
  - [Fly.io Setup](#flyio-setup)
  - [Railway Setup](#railway-setup)
- [IPFS Pinning API](#ipfs-pinning-api)
- [Security Recommendations](#security-recommendations)

## Overview

This repository includes:

1. **Three GitHub Actions workflows** for automated deployment to:
   - Vercel (`.github/workflows/deploy-vercel.yml`)
   - Fly.io (`.github/workflows/deploy-fly.yml`)
   - Railway (`.github/workflows/deploy-railway.yml`)

2. **Serverless IPFS pinning endpoint** (`api/pin.js`) that:
   - Accepts POST requests with NFT metadata and base64-encoded images
   - Validates data URLs and enforces a 5MB size limit
   - Pins to nft.storage (required)
   - Optionally pins to Pinata
   - Returns JSON with IPFS URLs and metadata

3. **Example client** (`examples/pin-client.js`) demonstrating API usage

## GitHub Actions Workflows

All workflows trigger on push to the `main` branch and follow these steps:

1. Checkout code
2. Setup Node.js environment
3. Validate required configuration files (`.env.example`, `fly.toml`)
4. Install dependencies (`npm ci`)
5. Build the project (`npm run build`)
6. Deploy to the target platform

**Note:** Workflows assume npm is used. If you use yarn or pnpm, update the workflow files accordingly.

## Setting Up GitHub Secrets

Navigate to your repository settings: **Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets for NFT/IPFS Functionality

| Secret Name | Description | Required For |
|------------|-------------|--------------|
| `NFT_STORAGE_API_KEY` | API key from [nft.storage](https://nft.storage) | api/pin.js |
| `PINATA_API_KEY` | Pinata API key (optional) | api/pin.js (Pinata) |
| `PINATA_SECRET_API_KEY` | Pinata API secret (optional) | api/pin.js (Pinata) |
| `PINATA_JWT` | Pinata JWT token (alternative to API key/secret) | api/pin.js (Pinata) |

### Required Secrets for Deployments

#### Vercel

| Secret Name | Description |
|------------|-------------|
| `VERCEL_TOKEN` | Vercel authentication token |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |

#### Fly.io

| Secret Name | Description |
|------------|-------------|
| `FLY_API_TOKEN` | Fly.io API token |
| `FLY_APP_NAME` | (Optional) Fly.io app name |

#### Railway

| Secret Name | Description |
|------------|-------------|
| `RAILWAY_TOKEN` | Railway API token |
| `RAILWAY_PROJECT_ID` | (Optional) Railway project ID |

## Platform-Specific Setup

### Vercel Setup

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Create a new project:**
   - Link your GitHub repository
   - Configure build settings (Framework Preset should auto-detect)

3. **Get your credentials:**
   - **VERCEL_TOKEN:** Settings → Tokens → Create Token
   - **VERCEL_ORG_ID & VERCEL_PROJECT_ID:** Project Settings → General
     - Org ID: Your account/team slug
     - Project ID: Found in project settings

4. **Add environment variables in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add: `NFT_STORAGE_API_KEY`, `PINATA_API_KEY`, `PINATA_SECRET_API_KEY` or `PINATA_JWT`

5. **Add secrets to GitHub** (see [Setting Up GitHub Secrets](#setting-up-github-secrets))

6. **Important for Next.js projects:**
   - If using Next.js, move `api/pin.js` to `pages/api/pin.js` or `app/api/pin/route.js` depending on your Next.js version

### Fly.io Setup

1. **Create a Fly.io account** at [fly.io](https://fly.io)

2. **Install Fly CLI locally:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

3. **Initialize your app:**
   ```bash
   fly auth login
   fly launch
   ```
   - Follow prompts to create app
   - This creates `fly.toml` (already exists in repo)

4. **Get your API token:**
   ```bash
   fly auth token
   ```

5. **Set secrets on Fly.io:**
   ```bash
   fly secrets set NFT_STORAGE_API_KEY=your_key_here
   fly secrets set PINATA_API_KEY=your_key_here
   fly secrets set PINATA_SECRET_API_KEY=your_secret_here
   # OR
   fly secrets set PINATA_JWT=your_jwt_here
   ```

6. **Add secrets to GitHub:**
   - `FLY_API_TOKEN`: Use the token from step 4
   - `FLY_APP_NAME`: (Optional) Your app name from `fly.toml`

### Railway Setup

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Get your API token:**
   - Settings → Tokens → Create Token

4. **Set environment variables in Railway:**
   - Go to your project → Variables
   - Add: `NFT_STORAGE_API_KEY`, `PINATA_API_KEY`, `PINATA_SECRET_API_KEY` or `PINATA_JWT`

5. **Add secrets to GitHub:**
   - `RAILWAY_TOKEN`: Use the token from step 3
   - `RAILWAY_PROJECT_ID`: (Optional) Found in project settings

## IPFS Pinning API

### Endpoint: `POST /api/pin`

### Request Format

```json
{
  "name": "My NFT",
  "description": "Description of my NFT",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "pinata": true
}
```

### Request Fields

- `name` (required): Name of the NFT
- `description` (required): Description of the NFT
- `imageBase64` (required): Base64-encoded image data URL (max 5MB)
- `pinata` (optional): Set to `true` to also pin to Pinata

### Response Format

```json
{
  "success": true,
  "nftStorage": {
    "success": true,
    "ipfsUrl": "ipfs://bafybeig...",
    "cid": "bafybeig...",
    "data": { ... }
  },
  "pinata": {
    "success": true,
    "ipfsUrl": "ipfs://QmX...",
    "hash": "QmX...",
    "data": { ... }
  }
}
```

### Error Responses

- `400 Bad Request`: Missing required fields or invalid data
- `405 Method Not Allowed`: Non-POST request
- `500 Internal Server Error`: Server-side error

### Size Limits

- Maximum image size: **5MB**
- Images larger than 5MB will be rejected

### Usage Example

See `examples/pin-client.js` for a complete browser-based example.

## Security Recommendations

### API Keys

- **Never commit API keys** to your repository
- Always use environment variables for sensitive data
- Use `.env.example` to document required variables (without values)
- Rotate API keys regularly

### Environment Variables

Required environment variables for `api/pin.js`:

```bash
NFT_STORAGE_API_KEY=your_nft_storage_key

# For Pinata (choose one method):
# Method 1: API Key + Secret
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret

# Method 2: JWT (alternative to above)
PINATA_JWT=your_pinata_jwt
```

### Rate Limiting

Consider implementing rate limiting on the `/api/pin` endpoint to prevent abuse:

- Use Vercel's built-in rate limiting
- Implement middleware for Express-based backends
- Use API gateway rate limiting features

### Input Validation

The endpoint validates:
- Image size (max 5MB)
- Data URL format
- MIME type (must be image/*)

Additional validations you may want to add:
- Authentication/authorization
- CORS restrictions
- Specific image format requirements

### CORS Configuration

If deploying on Vercel, you may need to configure CORS in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "your-domain.com" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

### Monitoring

- Monitor API usage and costs on nft.storage and Pinata dashboards
- Set up alerts for unusual activity
- Review deployment logs regularly

## Troubleshooting

### Workflow Failures

1. **"Permission denied" errors:**
   - Ensure GitHub Actions has write permissions: Settings → Actions → General → Workflow permissions

2. **".env.example not found":**
   - Ensure `.env.example` exists in repository root
   - Check file is not in `.gitignore`

3. **Build failures:**
   - Verify `npm run build` works locally
   - Check Node.js version compatibility
   - Review workflow logs for specific errors

### API Errors

1. **"NFT_STORAGE_API_KEY not configured":**
   - Verify environment variable is set on your platform
   - Check variable name is exactly `NFT_STORAGE_API_KEY`

2. **"Image size exceeds maximum":**
   - Reduce image size or compress before uploading
   - Maximum size is 5MB

3. **CORS errors:**
   - Configure CORS headers for your domain
   - Check browser console for specific CORS issues

## Additional Resources

- [nft.storage Documentation](https://nft.storage/docs/)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues related to:
- **Deployment workflows:** Check GitHub Actions logs
- **IPFS pinning:** Review nft.storage/Pinata API status
- **Platform-specific issues:** Consult platform documentation

---

**Remember:** Never commit secrets or API keys to your repository. Always use environment variables and GitHub Secrets for sensitive data.
