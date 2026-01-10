# Deployment and Secrets Setup Guide

This guide provides comprehensive instructions for deploying the StampCoin Platform to various hosting providers and configuring the required secrets for CI/CD and IPFS pinning functionality.

## Table of Contents

1. [Overview](#overview)
2. [Required Secrets and Environment Variables](#required-secrets-and-environment-variables)
3. [GitHub Actions Setup](#github-actions-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Fly.io Deployment](#flyio-deployment)
6. [Railway Deployment](#railway-deployment)
7. [IPFS Pinning Service Setup](#ipfs-pinning-service-setup)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The StampCoin Platform includes automated CI/CD workflows for deploying to multiple hosting providers:

- **Vercel**: Optimized for serverless deployments with edge functions
- **Fly.io**: Full-stack deployments with persistent storage options
- **Railway**: Simplified deployments with automatic SSL and databases

Additionally, the platform provides a secure serverless endpoint (`/api/pin`) for pinning NFT metadata and images to IPFS using NFT.Storage and Pinata.

## Required Secrets and Environment Variables

### Core Application Secrets

These secrets are required for the application to function properly:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Authentication
JWT_SECRET=random-secret-key-min-32-chars
OWNER_OPEN_ID=owner-identifier
```

### IPFS Pinning Secrets

Required for the `/api/pin` serverless endpoint:

```bash
# NFT.Storage (Required)
NFT_STORAGE_API_KEY=eyJhbGc...

# Pinata (Optional - for redundancy)
PINATA_JWT=eyJhbGc...
# OR
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...
```

**How to obtain:**

- **NFT.Storage**: Sign up at https://nft.storage and create an API key
- **Pinata**: Sign up at https://pinata.cloud and create an API key or JWT

### CI/CD Deployment Secrets

Required for automated deployments via GitHub Actions:

```bash
# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=team_...
VERCEL_PROJECT_ID=prj_...

# Fly.io
FLY_API_TOKEN=...

# Railway
RAILWAY_TOKEN=...
```

## GitHub Actions Setup

### Step 1: Fork/Clone the Repository

Ensure you have the repository cloned or forked to your GitHub account.

### Step 2: Configure GitHub Secrets

Navigate to your repository on GitHub:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret one by one

**Required secrets for CI/CD:**

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel authentication token | Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization/team ID | Found in .vercel/project.json after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Found in .vercel/project.json after `vercel link` |
| `FLY_API_TOKEN` | Fly.io authentication token | Run `flyctl auth token` |
| `RAILWAY_TOKEN` | Railway authentication token | Railway Account Settings → Tokens |
| `NFT_STORAGE_API_KEY` | NFT.Storage API key | https://nft.storage → Account → API Keys |
| `PINATA_JWT` | Pinata JWT token (optional) | https://pinata.cloud → API Keys |

### Step 3: Enable Workflows

The following workflows are available:

1. **`.github/workflows/deploy-vercel.yml`** - Automatic deployment to Vercel
2. **`.github/workflows/fly-deploy.yml`** - Automatic deployment to Fly.io
3. **`.github/workflows/deploy-railway.yml`** - Automatic deployment to Railway

All workflows trigger on:
- Push to `main` branch
- Manual trigger via workflow_dispatch

### Step 4: Test Workflows

1. Make a small change to your code
2. Commit and push to the `main` branch
3. Navigate to **Actions** tab in GitHub
4. Watch the workflows execute

## Vercel Deployment

### Prerequisites

- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

### Manual Setup

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link your project:**
   ```bash
   vercel link
   ```
   This creates a `.vercel/project.json` file with your ORG_ID and PROJECT_ID.

3. **Set environment variables in Vercel:**
   ```bash
   # Core application secrets
   vercel env add DATABASE_URL production
   vercel env add STRIPE_SECRET_KEY production
   vercel env add JWT_SECRET production
   
   # IPFS secrets
   vercel env add NFT_STORAGE_API_KEY production
   vercel env add PINATA_JWT production
   ```

4. **Deploy manually:**
   ```bash
   vercel --prod
   ```

### GitHub Actions Setup

1. Get your Vercel token:
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Save it as `VERCEL_TOKEN` in GitHub Secrets

2. Get your ORG_ID and PROJECT_ID:
   - After running `vercel link`, check `.vercel/project.json`
   - Save `orgId` as `VERCEL_ORG_ID` in GitHub Secrets
   - Save `projectId` as `VERCEL_PROJECT_ID` in GitHub Secrets

3. Push to `main` branch to trigger automatic deployment

### Environment Variables in Vercel Dashboard

Add all required environment variables in the Vercel dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development**

## Fly.io Deployment

### Prerequisites

- Fly.io account (https://fly.io)
- Fly CLI installed: `curl -L https://fly.io/install.sh | sh`

### Manual Setup

1. **Login to Fly.io:**
   ```bash
   flyctl auth login
   ```

2. **Create app (if not exists):**
   ```bash
   flyctl apps create stampcoin-platform
   ```

3. **Set secrets:**
   ```bash
   flyctl secrets set \
     DATABASE_URL="mysql://..." \
     STRIPE_SECRET_KEY="sk_live_..." \
     JWT_SECRET="..." \
     NFT_STORAGE_API_KEY="..." \
     PINATA_JWT="..."
   ```

4. **Deploy:**
   ```bash
   flyctl deploy
   ```

### GitHub Actions Setup

1. Get your Fly.io API token:
   ```bash
   flyctl auth token
   ```

2. Save the token as `FLY_API_TOKEN` in GitHub Secrets

3. Ensure `fly.toml` is configured properly (already included in repo)

4. Push to `main` branch to trigger automatic deployment

### Configuration in fly.toml

The `fly.toml` file should be configured with:

```toml
app = "stampcoin-platform"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
```

## Railway Deployment

### Prerequisites

- Railway account (https://railway.app)
- Railway CLI: `npm install -g @railway/cli`

### Manual Setup

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Initialize project:**
   ```bash
   railway init
   ```

3. **Link to your Railway project:**
   ```bash
   railway link
   ```

4. **Add environment variables:**
   ```bash
   railway variables set DATABASE_URL="mysql://..."
   railway variables set STRIPE_SECRET_KEY="sk_live_..."
   railway variables set JWT_SECRET="..."
   railway variables set NFT_STORAGE_API_KEY="..."
   railway variables set PINATA_JWT="..."
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

### GitHub Actions Setup

1. Get your Railway token:
   - Go to https://railway.app/account/tokens
   - Create a new token
   - Save it as `RAILWAY_TOKEN` in GitHub Secrets

2. Push to `main` branch to trigger automatic deployment

### Environment Variables in Railway Dashboard

1. Go to your project in Railway dashboard
2. Navigate to **Variables** tab
3. Add all required environment variables

## IPFS Pinning Service Setup

The `/api/pin` endpoint requires configuration of IPFS pinning services.

### NFT.Storage Setup (Required)

1. **Sign up:**
   - Go to https://nft.storage
   - Create an account

2. **Create API Key:**
   - Navigate to **Account** → **API Keys**
   - Click **+ New Key**
   - Copy the key (starts with `eyJhbGc...`)

3. **Add to environment:**
   - Add `NFT_STORAGE_API_KEY` to your hosting platform's environment variables
   - Add to GitHub Secrets for CI/CD

### Pinata Setup (Optional - for redundancy)

1. **Sign up:**
   - Go to https://pinata.cloud
   - Create an account

2. **Create API Key:**
   - Navigate to **Developers** → **API Keys**
   - Click **+ New Key**
   - Select permissions (pinFileToIPFS, pinJSONToIPFS)
   - Copy the API Key, API Secret, and JWT

3. **Add to environment:**
   - Option 1: Use JWT (recommended)
     - Add `PINATA_JWT` to environment variables
   - Option 2: Use API Key/Secret
     - Add `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`

### Testing the Endpoint

Test locally:

```bash
curl -X POST http://localhost:3000/api/pin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test NFT",
    "description": "Test description",
    "imageBase64": "data:image/png;base64,iVBORw0KG...",
    "pinata": true
  }'
```

Expected response:

```json
{
  "success": true,
  "nftStorage": {
    "success": true,
    "cid": "bafybeib...",
    "ipfsUrl": "ipfs://bafybeib...",
    "gatewayUrl": "https://nftstorage.link/ipfs/bafybeib...",
    "name": "Test NFT",
    "description": "Test description"
  },
  "pinata": {
    "success": true,
    "cid": "QmX...",
    "ipfsUrl": "ipfs://QmX...",
    "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmX...",
    "pinSize": 12345,
    "timestamp": "2024-01-10T12:00:00.000Z"
  }
}
```

## Security Best Practices

### 1. Never Commit Secrets

- Always use `.env` files locally (added to `.gitignore`)
- Never hardcode secrets in source code
- Use environment variables for all sensitive data

### 2. Use Different Secrets for Different Environments

- Development: Use test/sandbox credentials
- Production: Use live credentials
- Keep them separate to prevent accidents

### 3. Rotate Secrets Regularly

- Change API keys every 90 days
- Immediately rotate if compromised
- Update in all platforms (GitHub, Vercel, Fly, Railway)

### 4. Limit Secret Permissions

- Use least privilege principle
- Create separate API keys for different services
- Limit scope of permissions where possible

### 5. Monitor Usage

- Enable logging on all platforms
- Monitor for unusual API usage
- Set up alerts for suspicious activity

### 6. Secrets Verification

The repository includes a verification step in CI to ensure no secrets are committed:

```bash
# Check for common secret patterns
npm run verify-secrets
```

## Troubleshooting

### Deployment Fails with "Environment variable not set"

**Solution:** Ensure all required environment variables are set in the hosting platform's dashboard or via CLI.

### IPFS Pin Endpoint Returns 500 Error

**Possible causes:**
1. Missing `NFT_STORAGE_API_KEY`
2. Invalid API key
3. File size exceeds limit (10MB)
4. Invalid image format

**Solution:** Check logs and verify API keys are correct.

### GitHub Actions Workflow Fails

**Common issues:**
1. Secrets not configured in GitHub
2. Incorrect secret names (must match exactly)
3. Token expired or invalid

**Solution:** 
- Verify secrets in GitHub Settings → Secrets and variables → Actions
- Regenerate tokens if expired
- Check workflow logs for specific errors

### Build Fails on Deployment

**Solution:**
1. Ensure dependencies are correctly specified in `package.json`
2. Check Node.js version compatibility (requires Node 20+)
3. Verify build commands in `package.json` scripts
4. Check for platform-specific build issues in logs

### Database Connection Issues

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Ensure database is accessible from deployment platform
3. Check firewall rules and IP whitelisting
4. Verify SSL/TLS settings if required

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs)
- [Railway Documentation](https://docs.railway.app)
- [NFT.Storage Documentation](https://nft.storage/docs)
- [Pinata Documentation](https://docs.pinata.cloud)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues specific to this platform:
- GitHub Issues: https://github.com/Stampcoin-platform/Stampcoin-platform/issues
- Email: support@stampcoin.platform

For platform-specific issues, refer to their respective support channels.

---

**Last Updated:** January 2026  
**Version:** 1.0.0
