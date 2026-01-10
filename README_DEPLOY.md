# Deployment and IPFS Pinning Guide

This guide explains how to set up CI/CD workflows for Vercel, Fly.io, and Railway, and how to use the secure serverless IPFS pinning endpoint.

## Table of Contents

1. [Overview](#overview)
2. [Files Added](#files-added)
3. [Prerequisites](#prerequisites)
4. [Setting Up GitHub Secrets](#setting-up-github-secrets)
5. [Platform-Specific Setup](#platform-specific-setup)
   - [Vercel](#vercel-deployment)
   - [Fly.io](#flyio-deployment)
   - [Railway](#railway-deployment)
6. [IPFS Pinning Endpoint](#ipfs-pinning-endpoint)
7. [Security Recommendations](#security-recommendations)
8. [Troubleshooting](#troubleshooting)

## Overview

This repository now includes:
- **CI/CD Workflows**: Automated deployment pipelines for Vercel, Fly.io, and Railway
- **IPFS Pinning Endpoint**: A secure serverless function (`/api/pin`) for pinning files to IPFS via Pinata
- **Example Client**: A JavaScript example showing how to use the pinning endpoint

**Note**: This implementation uses Pinata for IPFS pinning. nft.storage has been decommissioned and no longer accepts uploads.

## Files Added

### CI/CD Workflows
- `.github/workflows/deploy-vercel.yml` - Vercel deployment workflow
- `.github/workflows/deploy-fly.yml` - Fly.io deployment workflow
- `.github/workflows/deploy-railway.yml` - Railway deployment workflow

### IPFS Pinning
- `api/pin.js` - Serverless IPFS pinning endpoint
- `examples/pin-client.js` - Example client code for using the pinning API

### Configuration
- `.env.example` - Updated with all required environment variables
- `README_DEPLOY.md` - This deployment guide

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: This repository with proper access
2. **Platform Accounts**: 
   - [Vercel Account](https://vercel.com) (for Vercel deployment)
   - [Fly.io Account](https://fly.io) (for Fly.io deployment)
   - [Railway Account](https://railway.app) (for Railway deployment)
3. **IPFS Storage Account**:
   - [Pinata](https://pinata.cloud) API credentials (required)

## Setting Up GitHub Secrets

All workflows require secrets to be configured in your GitHub repository. Follow these steps:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets based on which platforms you're using:

### Required for IPFS Pinning

```
PINATA_JWT                 # Your Pinata JWT token (recommended)
# OR
PINATA_API_KEY             # Your Pinata API key
PINATA_SECRET_API_KEY      # Your Pinata secret key
```

**Note**: nft.storage has been decommissioned and is no longer accepting uploads. Pinata is now the only supported IPFS provider.

### Platform-Specific Secrets

#### For Vercel
```
VERCEL_TOKEN               # Generate at https://vercel.com/account/tokens
```

#### For Fly.io
```
FLY_API_TOKEN              # Run: flyctl auth token
FLY_APP_NAME               # Your Fly.io app name
```

#### For Railway
```
RAILWAY_TOKEN              # Generate in Railway dashboard → Account → Tokens
RAILWAY_PROJECT_ID         # Your Railway project ID (optional if using GitHub integration)
```

## Platform-Specific Setup

### Vercel Deployment

1. **Install Vercel CLI locally** (for initial setup):
   ```bash
   npm i -g vercel
   ```

2. **Initialize Vercel project**:
   ```bash
   vercel
   ```
   Follow the prompts to link your repository.

3. **Get your Vercel token**:
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Add it as `VERCEL_TOKEN` in GitHub Secrets

4. **Configure environment variables in Vercel**:
   - Go to your project in Vercel dashboard
   - Settings → Environment Variables
   - Add all variables from `.env.example` that your app needs

5. **Deploy**:
   - Push to `main` branch
   - The workflow will automatically deploy to Vercel

### Fly.io Deployment

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Launch your app** (if not already done):
   ```bash
   flyctl launch
   ```
   This creates a `fly.toml` configuration file.

4. **Get your Fly.io API token**:
   ```bash
   flyctl auth token
   ```
   Add this as `FLY_API_TOKEN` in GitHub Secrets.

5. **Set your app name**:
   Add your Fly.io app name as `FLY_APP_NAME` in GitHub Secrets.

6. **Configure secrets in Fly.io**:
   ```bash
   flyctl secrets set NFT_STORAGE_API_KEY=your_key
   flyctl secrets set PINATA_JWT=your_jwt
   # Add other secrets as needed
   ```

7. **Deploy**:
   - Commit and push the `fly.toml` file
   - Push to `main` branch
   - The workflow will automatically deploy to Fly.io

### Railway Deployment

1. **Create a project in Railway**:
   - Go to https://railway.app/dashboard
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select this repository

2. **Get your Railway token**:
   - Go to Account Settings → Tokens
   - Generate a new token
   - Add it as `RAILWAY_TOKEN` in GitHub Secrets

3. **Get your project ID**:
   - Open your project in Railway
   - The project ID is in the URL: `railway.app/project/{PROJECT_ID}`
   - Add it as `RAILWAY_PROJECT_ID` in GitHub Secrets

4. **Configure environment variables in Railway**:
   - In your Railway project, go to Variables
   - Add all variables from `.env.example` that your app needs

5. **Deploy**:
   - Push to `main` branch
   - The workflow will automatically deploy to Railway

**Alternative**: Enable Railway's GitHub integration in the dashboard, which can automatically deploy without needing the CLI workflow.

## IPFS Pinning Endpoint

The `/api/pin` endpoint allows you to pin files to IPFS via Pinata.

**Important**: nft.storage has been decommissioned and is no longer accepting uploads. This endpoint now uses Pinata exclusively for IPFS pinning.

### Endpoint Details

- **URL**: `/api/pin`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body

```json
{
  "name": "My NFT",
  "description": "Description of the NFT",
  "imageBase64": "data:image/png;base64,iVBORw0KG..."
}
```

**Parameters**:
- `name` (string, optional): Name for the NFT metadata
- `description` (string, optional): Description for the NFT metadata
- `imageBase64` (string, required): Base64-encoded data URL (e.g., `data:image/png;base64,...`)

### Response

**Success (200)**:
```json
{
  "success": true,
  "ipfsHash": "Qm...",
  "pinSize": 12345,
  "timestamp": "2024-01-10T12:00:00.000Z",
  "ipfsUrl": "ipfs://Qm...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
  "metadata": {
    "name": "My NFT",
    "description": "Description of the NFT"
  }
}
```

**Error (400/413/500)**:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Size Limits

- Maximum file size: **5 MB**
- Increase by modifying `MAX_BYTES` in `api/pin.js`

### Usage Example

See `examples/pin-client.js` for a complete example. Basic usage:

```javascript
// Convert file to base64 data URL
const reader = new FileReader();
reader.onload = async (e) => {
  const imageBase64 = e.target.result;
  
  // Pin to IPFS via Pinata
  const response = await fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'My NFT',
      description: 'A cool NFT',
      imageBase64: imageBase64
    })
  });
  
  const result = await response.json();
  console.log('Pinned to IPFS:', result);
  console.log('IPFS URL:', result.ipfsUrl);
  console.log('Gateway URL:', result.gatewayUrl);
};
reader.readAsDataURL(file);
```

### Required Environment Variables

For the pinning endpoint to work, you must set one of the following:

```bash
# Use JWT (recommended)
PINATA_JWT=your_pinata_jwt

# OR use API key/secret
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```

### Getting API Keys

**Pinata**:
- Go to https://pinata.cloud
- Sign up/login
- Go to "API Keys" section
- Create a new API key (JWT recommended)

**Note**: nft.storage has been decommissioned and is no longer accepting uploads as of 2023.

## Security Recommendations

### 1. Never Commit Secrets
- ✅ Use `.env.example` as a template (no real values)
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit `.env` files with real secrets

### 2. Use GitHub Secrets for CI/CD
- Store all deployment tokens in GitHub Secrets
- Secrets are encrypted and only exposed during workflow runs
- Regularly rotate tokens and API keys

### 3. Environment Variables per Platform
- Set environment variables in each platform's dashboard
- Don't rely solely on GitHub Secrets for runtime configuration
- Each platform (Vercel, Fly.io, Railway) has its own secrets management

### 4. Rate Limiting & Validation
The `/api/pin` endpoint includes:
- File size validation (5 MB limit)
- Content type validation
- Base64 format validation

Consider adding:
- Authentication/authorization
- Rate limiting per IP/user
- Input sanitization
- CORS configuration

### 5. Monitoring
- Monitor your IPFS storage usage on nft.storage and Pinata dashboards
- Set up alerts for failed deployments
- Review workflow logs regularly

### 6. Dependencies
Keep dependencies updated:
```bash
npm audit
npm update
```

Check for vulnerabilities in:
- `node-fetch`
- `form-data`

## Troubleshooting

### Workflow Fails: "VERCEL_TOKEN secret is missing"
- Ensure you've added `VERCEL_TOKEN` in GitHub Secrets
- Check the token hasn't expired
- Verify you have deployment permissions in Vercel

### Workflow Fails: ".env.example not found"
- Ensure `.env.example` exists in the repository root
- Check it's committed and pushed to the repository

### Fly.io Deploy Fails: "No fly.toml found"
- Run `flyctl launch` locally
- Commit and push the generated `fly.toml` file

### Railway Deploy: "RAILWAY_PROJECT_ID not set"
- Either set `RAILWAY_PROJECT_ID` in GitHub Secrets
- Or enable Railway's GitHub integration in the dashboard

### API Returns 500: "IPFS pinning not configured"
- Ensure either `PINATA_JWT` or both `PINATA_API_KEY` and `PINATA_SECRET_API_KEY` are set in environment variables
- Check that your Pinata API credentials are valid

### Pinata Returns "Unauthorized"
- Check your Pinata JWT or API key/secret
- Ensure secrets are correctly set in environment variables
- Verify the Pinata API key has upload permissions

### Build Fails: Module Not Found
- Run `npm install` to ensure all dependencies are installed
- Check `package.json` has all required packages
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues related to:
- **Deployment**: Check the platform's documentation and status page
- **IPFS Pinning**: Review nft.storage and Pinata documentation
- **Workflows**: Check GitHub Actions logs in the "Actions" tab

## Notes

- **Project Structure**: This project uses Vite + React + Express (not Next.js). The `/api/pin.js` endpoint is compatible with Vercel Serverless Functions. If deploying to other platforms, you may need to integrate it into your Express server routes.

- **Testing Locally**: To test the pinning endpoint locally, you can use the Vercel CLI:
  ```bash
  vercel dev
  ```
  This will run your serverless functions locally.

- **Workflow Triggers**: All workflows are triggered on push to the `main` branch. To disable auto-deployment, comment out the workflow or change the branch filter.
