# Deployment Guide for Stampcoin Platform

This guide describes the CI/CD deployment workflows and IPFS pinning API added to the Stampcoin platform.

## Table of Contents

- [Overview](#overview)
- [Files Added](#files-added)
- [GitHub Actions Workflows](#github-actions-workflows)
- [IPFS Pinning API](#ipfs-pinning-api)
- [Setup Instructions](#setup-instructions)
- [Security Recommendations](#security-recommendations)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Overview

This PR adds automated deployment workflows for three popular hosting platforms:
- **Vercel**: Serverless and edge functions with global CDN
- **Fly.io**: Full-stack apps with regional deployment
- **Railway**: Simple deployment with built-in database support

Additionally, it provides a secure serverless API endpoint (`/api/pin`) for pinning images and metadata to IPFS using nft.storage and optionally Pinata.

## Files Added

### Workflow Files
- `.github/workflows/deploy-vercel.yml` - Automated deployment to Vercel
- `.github/workflows/deploy-fly.yml` - Automated deployment to Fly.io
- `.github/workflows/deploy-railway.yml` - Automated deployment to Railway

### API Endpoint
- `api/pin.js` - Serverless IPFS pinning endpoint
  - Accepts POST requests with image data (base64)
  - Pins to nft.storage (required)
  - Optionally pins to Pinata (if configured)
  - Validates file size (max 5MB)
  - Returns IPFS URLs and metadata

### Documentation & Examples
- `README_DEPLOY.md` - This file
- `examples/pin-client.js` - Browser example for using the pin API
- `.env.example` - Updated with deployment platform variables

## GitHub Actions Workflows

All workflows trigger on push to the `main` branch.

### Common Steps (All Workflows)
1. Checkout repository
2. Validate `.env.example` exists
3. Setup Node.js 18
4. Install dependencies (`npm ci`)
5. Build application (`npm run build`)

### Deploy to Vercel

**File**: `.github/workflows/deploy-vercel.yml`

**Required Secrets**:
- `VERCEL_TOKEN` - Your Vercel deployment token

**How it works**:
- Installs Vercel CLI
- Deploys using `vercel --prod`
- Automatically uses Vercel project linked to the repo

### Deploy to Fly.io

**File**: `.github/workflows/deploy-fly.yml`

**Required Secrets**:
- `FLY_API_TOKEN` - Your Fly.io API token
- `FLY_APP_NAME` - Your Fly.io app name

**Prerequisites**:
- `fly.toml` must exist in repository (create with `flyctl launch` locally)

**How it works**:
- Installs flyctl CLI
- Authenticates with Fly.io
- Deploys using `flyctl deploy`

### Deploy to Railway

**File**: `.github/workflows/deploy-railway.yml`

**Required Secrets**:
- `RAILWAY_TOKEN` - Your Railway API token
- `RAILWAY_PROJECT_ID` - (Optional) Your Railway project ID

**How it works**:
- Installs Railway CLI
- Authenticates with Railway token
- Triggers deployment via `railway up`
- Note: Railway GitHub integration is recommended for easier setup

## IPFS Pinning API

### Endpoint: `/api/pin`

A serverless function that pins images and metadata to IPFS.

### Request Format

**Method**: POST  
**Content-Type**: application/json

```json
{
  "name": "My Stamp NFT",
  "description": "A beautiful vintage stamp from 1920",
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "pinata": true
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Name for the NFT metadata |
| `description` | string | No | Description for the NFT metadata |
| `imageBase64` | string | Yes | Base64-encoded image data URL |
| `pinata` | boolean | No | Whether to also pin to Pinata (default: false) |

### Response Format

**Success (200)**:
```json
{
  "nftStorage": {
    "url": "ipfs://bafyreib...",
    "data": {
      "image": "ipfs://bafkreic...",
      "name": "My Stamp NFT",
      "description": "A beautiful vintage stamp from 1920"
    }
  },
  "pinata": {
    "IpfsHash": "QmXxxx...",
    "PinSize": 123456,
    "Timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400` - Bad request (invalid data URL, missing imageBase64)
- `405` - Method not allowed (must be POST)
- `413` - Payload too large (max 5MB)
- `500` - Server error

### Environment Variables

The API requires these environment variables:

**Required**:
- `NFT_STORAGE_API_KEY` - Your nft.storage API key

**Optional (for Pinata)**:
- `PINATA_JWT` - Pinata JWT token (recommended)
  
  OR
  
- `PINATA_API_KEY` - Pinata API key
- `PINATA_SECRET_API_KEY` - Pinata secret API key

### Security Features

- File size validation (max 5MB)
- Data URL format validation
- MIME type detection and validation
- Error handling with descriptive messages
- No secrets exposed in responses

### Client Example

See `examples/pin-client.js` for a complete browser implementation.

Quick example:
```javascript
const result = await pinImageToIPFS(file, {
  name: 'My Stamp',
  description: 'Vintage stamp',
  pinata: true
});
console.log('IPFS URL:', result.nftStorage.url);
```

## Setup Instructions

### 1. Create API Keys

#### nft.storage (Required)
1. Visit https://nft.storage
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `eyJ...`)

#### Pinata (Optional)
1. Visit https://pinata.cloud
2. Sign up or log in
3. Go to API Keys
4. Create new key with pin permissions
5. Copy the JWT or API Key + Secret

#### Vercel
1. Visit https://vercel.com
2. Go to Settings → Tokens
3. Create new token with deployment permissions
4. Copy the token

#### Fly.io
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run: `flyctl auth token`
3. Copy the token

#### Railway
1. Visit https://railway.app
2. Go to Account → Tokens
3. Create new token
4. Copy the token

### 2. Add Secrets to GitHub

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

**For IPFS Pinning** (api/pin.js):
- `NFT_STORAGE_API_KEY` (required)
- `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_SECRET_API_KEY` (optional)

**For Vercel Deployment**:
- `VERCEL_TOKEN`

**For Fly.io Deployment**:
- `FLY_API_TOKEN`
- `FLY_APP_NAME`

**For Railway Deployment**:
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID` (optional, recommended)

### 3. Configure Platform Dashboards

#### Vercel
1. Link your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Add the same env vars from `.env.example`
4. Note your Project ID and Org ID (optional, for CLI)

#### Fly.io
1. Run `flyctl launch` in your project directory
2. Follow prompts to create app
3. Commit the generated `fly.toml` file
4. Add environment variables: `flyctl secrets set KEY=value`

#### Railway
1. Create new project from GitHub repo
2. Configure environment variables in Railway dashboard
3. Add GitHub integration (recommended) or use CLI deployment
4. Copy Project ID if using CLI deployment

### 4. Deploy

Push to `main` branch to trigger deployments:

```bash
git add .
git commit -m "feat: add CI/CD workflows and IPFS pinning"
git push origin main
```

Monitor deployment progress in:
- GitHub Actions tab
- Platform-specific dashboards (Vercel/Fly/Railway)

## Security Recommendations

### Secrets Management
- ✅ **DO**: Store all secrets in GitHub Secrets or platform env vars
- ❌ **DON'T**: Commit secrets to `.env` files
- ✅ **DO**: Use `.env.example` as a template only
- ❌ **DON'T**: Share API keys in issues, PRs, or documentation

### API Endpoint Security
- ✅ **DO**: Implement rate limiting in production
- ✅ **DO**: Add authentication/authorization if needed
- ✅ **DO**: Monitor usage and costs
- ❌ **DON'T**: Expose endpoint publicly without protection
- ✅ **DO**: Set up CORS policies appropriately

### Environment Variables
- Review `.env.example` for all required variables
- Never commit real values to version control
- Rotate API keys periodically
- Use different keys for development/staging/production

### File Upload Validation
The API includes:
- Max file size: 5MB (configurable in `api/pin.js`)
- Data URL format validation
- MIME type detection
- Error handling

Consider adding:
- Rate limiting per IP/user
- Authentication middleware
- Additional file type restrictions
- Virus/malware scanning

## Troubleshooting

### Workflow Fails: ".env.example not found"
**Solution**: Ensure `.env.example` exists in repository root

### Workflow Fails: "npm ci" error
**Solution**: Verify `package-lock.json` is committed and up to date
```bash
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

### Workflow Fails: "npm run build" error
**Solution**: Test build locally first
```bash
npm run build
```
Fix any build errors before pushing

### Vercel Deployment: "Project not found"
**Solution**: 
1. Link repo to Vercel: `npx vercel link`
2. Commit `.vercel/project.json` if needed
3. Or ensure Vercel GitHub integration is active

### Fly.io Deployment: "fly.toml not found"
**Solution**: Create and commit fly.toml
```bash
flyctl launch
git add fly.toml
git commit -m "chore: add fly.toml config"
```

### Railway Deployment: "railway up failed"
**Solution**: 
- Use Railway GitHub integration (recommended)
- Or ensure `RAILWAY_PROJECT_ID` is set correctly
- Verify `RAILWAY_TOKEN` has correct permissions

### API Endpoint: "NFT_STORAGE_API_KEY not found"
**Solution**: Add secret to platform environment variables
- Vercel: Dashboard → Project → Settings → Environment Variables
- Fly: `flyctl secrets set NFT_STORAGE_API_KEY=your_key`
- Railway: Dashboard → Project → Variables

### API Endpoint: "File too large"
**Solution**: 
- Reduce image size before upload
- Or increase `MAX_BYTES` in `api/pin.js` (not recommended for free tiers)

### API Endpoint: CORS errors
**Solution**: Add CORS headers to `api/pin.js`
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## Next Steps

### For Next.js Projects
If your project uses Next.js, move `api/pin.js` to:
- Next.js 13+ (App Router): `app/api/pin/route.js`
- Next.js 12 (Pages Router): `pages/api/pin.js`

Update the file to use Next.js API route format if needed.

### Additional Configuration

1. **Custom Domain**: Configure custom domains in platform dashboards
2. **SSL Certificates**: Platforms handle this automatically
3. **Environment-specific builds**: Add staging branches and workflows
4. **Monitoring**: Set up logging and error tracking (Sentry, LogRocket, etc.)
5. **Database**: Configure database URLs in environment variables
6. **CDN**: Leverage platform CDN features for static assets

### Production Readiness Checklist

- [ ] All secrets configured in GitHub Actions
- [ ] All secrets configured in platform dashboards  
- [ ] `.env.example` is up to date
- [ ] Build succeeds locally
- [ ] Tests pass (if applicable)
- [ ] API endpoint tested with real images
- [ ] Rate limiting implemented
- [ ] Error monitoring configured
- [ ] Backup strategy for IPFS pins
- [ ] Documentation updated for team
- [ ] Domain names configured
- [ ] SSL certificates active

### Optimization Tips

1. **Reduce Image Size**: Compress images before pinning
2. **Batch Operations**: Pin multiple files in one request if possible
3. **Caching**: Cache IPFS URLs to avoid re-pinning
4. **CDN**: Use platform CDN for frequently accessed images
5. **Database**: Store IPFS hashes in database for quick lookup

## Support

- GitHub Issues: Report bugs or request features
- Platform Documentation:
  - Vercel: https://vercel.com/docs
  - Fly.io: https://fly.io/docs
  - Railway: https://docs.railway.app
- IPFS Resources:
  - nft.storage: https://nft.storage/docs
  - Pinata: https://docs.pinata.cloud

## License

See main repository LICENSE file.
