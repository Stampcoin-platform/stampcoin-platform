# Deployment Guide

This guide provides detailed instructions for deploying the StampCoin Platform using automated CI/CD workflows for Vercel, Fly.io, and Railway, as well as setting up the IPFS pinning endpoint.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Secrets Configuration](#github-secrets-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Fly.io Deployment](#flyio-deployment)
5. [Railway Deployment](#railway-deployment)
6. [IPFS Pinning Endpoint Setup](#ipfs-pinning-endpoint-setup)
7. [Testing the Deployment](#testing-the-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with access to this repository
2. Accounts on the platforms you want to deploy to:
   - [Vercel](https://vercel.com) (for serverless deployment)
   - [Fly.io](https://fly.io) (for containerized deployment)
   - [Railway](https://railway.app) (for container deployment)
3. IPFS storage provider accounts (for the pinning endpoint):
   - [nft.storage](https://nft.storage) (required)
   - [Pinata](https://pinata.cloud) (optional)

## GitHub Secrets Configuration

All deployment workflows use GitHub Secrets to securely store API tokens and credentials. Never commit these values to your repository.

### Adding GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

### Required Secrets

#### Vercel Deployment Secrets

- `VERCEL_TOKEN`: Your Vercel authentication token
  - Get it from: https://vercel.com/account/tokens
  - Click "Create" and give it a descriptive name
  
- `VERCEL_ORG_ID`: Your Vercel organization ID
  - Find it in your Vercel dashboard under **Settings** → **General**
  - Or run: `vercel --cwd . ls` (from project linked to Vercel)
  
- `VERCEL_PROJECT_ID`: Your Vercel project ID
  - Found in project **Settings** → **General** in Vercel dashboard
  - Or in `.vercel/project.json` after linking the project

#### Fly.io Deployment Secrets

- `FLY_API_TOKEN`: Your Fly.io API token
  - Get it by running: `fly auth token`
  - Or from: https://fly.io/user/personal_access_tokens

#### Railway Deployment Secrets

- `RAILWAY_TOKEN`: Your Railway API token
  - Get it from: https://railway.app/account/tokens
  - Click "Create token" and give it a descriptive name
  
- `RAILWAY_SERVICE_NAME` (optional): The service name in Railway
  - Default is `web` if not specified
  - Find it in your Railway project dashboard

#### IPFS Storage Secrets

These are used by the `/api/pin` endpoint:

- `NFT_STORAGE_API_KEY` (required): Your nft.storage API key
  - Sign up at: https://nft.storage
  - Go to **API Keys** section and create a new key
  
- `PINATA_API_KEY` (optional): Your Pinata API key
  - Sign up at: https://pinata.cloud
  - Go to **API Keys** → **New Key**
  
- `PINATA_SECRET_API_KEY` (optional): Your Pinata secret key
  - Provided when you create a Pinata API key
  
- `PINATA_JWT` (optional, alternative to API key/secret): Your Pinata JWT token
  - Alternative authentication method for Pinata
  - Use either JWT or API key/secret, not both

## Vercel Deployment

### Initial Setup

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm install -g vercel
   ```

2. **Link your project to Vercel**:
   ```bash
   vercel link
   ```
   - Select your scope (personal or team)
   - Link to existing project or create new one
   - This creates `.vercel/project.json` with your IDs

3. **Add Environment Variables in Vercel**:
   - Go to your project in Vercel dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add all required environment variables from `.env.example`
   - Make sure to add `NFT_STORAGE_API_KEY` and optional Pinata credentials

4. **Configure GitHub Secrets** (as described above):
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Automatic Deployment

Once configured, the workflow automatically triggers on every push to the `main` branch:

- Workflow file: `.github/workflows/deploy-vercel.yml`
- Builds the project using `pnpm run build`
- Deploys to Vercel production environment

### Manual Deployment

To deploy manually:

```bash
vercel --prod
```

## Fly.io Deployment

### Initial Setup

1. **Install Fly.io CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```

3. **Initialize your app** (if not already done):
   ```bash
   fly launch
   ```
   - Choose your app name and region
   - This creates `fly.toml` configuration file

4. **Set environment variables**:
   ```bash
   fly secrets set NFT_STORAGE_API_KEY=your_key
   fly secrets set PINATA_API_KEY=your_key
   fly secrets set PINATA_SECRET_API_KEY=your_secret
   # Add other required environment variables
   ```

5. **Configure GitHub Secret**:
   - `FLY_API_TOKEN` (get it with `fly auth token`)

### Automatic Deployment

The workflow automatically deploys on push to `main`:

- Workflow file: `.github/workflows/fly-deploy.yml`
- Uses `flyctl` to deploy
- Deploys with `--remote-only` flag (builds in Fly.io infrastructure)

### Manual Deployment

To deploy manually:

```bash
fly deploy
```

## Railway Deployment

### Initial Setup

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link your project**:
   ```bash
   railway link
   ```

4. **Add environment variables**:
   - Go to your Railway project dashboard
   - Click on your service → **Variables** tab
   - Add all required environment variables from `.env.example`
   - Or use CLI:
     ```bash
     railway variables set NFT_STORAGE_API_KEY=your_key
     ```

5. **Configure GitHub Secrets**:
   - `RAILWAY_TOKEN` (from https://railway.app/account/tokens)
   - `RAILWAY_SERVICE_NAME` (optional, defaults to `web`)

### Automatic Deployment

The workflow automatically deploys on push to `main`:

- Workflow file: `.github/workflows/deploy-railway.yml`
- Builds the project and deploys to Railway

### Manual Deployment

To deploy manually:

```bash
railway up
```

## IPFS Pinning Endpoint Setup

The `/api/pin` endpoint allows you to pin files to IPFS via nft.storage and Pinata.

### Environment Variables

Configure these in your deployment platform:

**Required:**
- `NFT_STORAGE_API_KEY`: Your nft.storage API key

**Optional (for Pinata):**
- Either `PINATA_JWT` (recommended)
- Or both `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`

### API Usage

**Endpoint:** `POST /api/pin`

**Request Body:**
```json
{
  "file": "base64_encoded_file_data",
  "fileName": "example.png",
  "metadata": {
    "description": "Optional metadata",
    "custom_field": "custom_value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "File pinned successfully",
  "results": {
    "nftStorage": {
      "success": true,
      "data": {
        "value": {
          "cid": "bafkreiabc123...",
          "size": 12345
        }
      }
    },
    "pinata": {
      "success": true,
      "data": {
        "IpfsHash": "Qm...",
        "PinSize": 12345
      }
    },
    "metadata": {
      "description": "Optional metadata"
    }
  }
}
```

### Client Example

See `examples/pin-client.js` for a complete client-side implementation.

Basic usage:

```javascript
// Convert file to base64
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  
  const response = await fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      fileName: file.name,
      metadata: { description: 'My image' }
    })
  });
  
  const result = await response.json();
  console.log('IPFS CID:', result.results.nftStorage.data.value.cid);
};

reader.readAsDataURL(file);
```

## Testing the Deployment

### 1. Test the Main Application

After deployment, verify your application is accessible:

- **Vercel**: `https://your-project.vercel.app`
- **Fly.io**: `https://your-app.fly.dev`
- **Railway**: `https://your-app.up.railway.app`

### 2. Test the IPFS Pinning Endpoint

Create a test file to verify the pinning endpoint:

```bash
# Create a small test image (1x1 pixel PNG in base64)
echo '{"file":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","fileName":"test.png"}' > test-payload.json

# Test the endpoint (replace URL with your deployment)
curl -X POST https://your-app.vercel.app/api/pin \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

Expected response should include IPFS CID from nft.storage.

### 3. Monitor GitHub Actions

- Go to your repository → **Actions** tab
- Check workflow runs for any errors
- Review logs if deployment fails

### 4. Security Check Workflow

The security check workflow runs automatically on every push and pull request:

- Verifies `.env.example` exists
- Scans for hardcoded secrets
- Checks git history for committed `.env` files

Review warnings in the Actions tab, but note they may include false positives.

## Troubleshooting

### Vercel Deployment Issues

**Problem:** Build fails with "Module not found"
- **Solution:** Ensure all dependencies are in `package.json`
- Run `pnpm install` locally to verify

**Problem:** Environment variables not available
- **Solution:** Add them in Vercel dashboard under Settings → Environment Variables
- Redeploy after adding variables

### Fly.io Deployment Issues

**Problem:** "Could not find App"
- **Solution:** Run `fly apps list` to verify app exists
- Initialize with `fly launch` if needed

**Problem:** Out of memory errors
- **Solution:** Increase VM size in `fly.toml`:
  ```toml
  [vm]
    memory = '512mb'
  ```

### Railway Deployment Issues

**Problem:** Build fails
- **Solution:** Check Railway build logs
- Verify `nixpacks.toml` or `Procfile` configuration

**Problem:** Service not starting
- **Solution:** Check that `PORT` environment variable is used
- Railway assigns dynamic ports

### IPFS Pinning Issues

**Problem:** "NFT_STORAGE_API_KEY not set"
- **Solution:** Add the environment variable in your deployment platform
- Verify it's not using a placeholder value

**Problem:** File size limit exceeded
- **Solution:** The endpoint has a 5MB limit
- Compress images or reduce size before uploading

**Problem:** Pinata authentication fails
- **Solution:** Verify credentials are correct
- Use either JWT or API key/secret (not both)
- Pinata is optional - the endpoint works with just nft.storage

### GitHub Actions Issues

**Problem:** Workflow fails with authentication error
- **Solution:** Verify secrets are correctly added to GitHub
- Check secret names match exactly (case-sensitive)

**Problem:** Workflows not triggering
- **Solution:** Ensure workflows are in `.github/workflows/`
- Check branch protection rules
- Verify YAML syntax

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs)
- [Railway Documentation](https://docs.railway.app)
- [nft.storage Documentation](https://nft.storage/docs)
- [Pinata Documentation](https://docs.pinata.cloud)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate tokens regularly** - especially if they may have been exposed
3. **Use minimal permissions** - create tokens with only necessary scopes
4. **Enable 2FA** on all deployment platforms
5. **Review workflow logs** for any exposed secrets (GitHub masks them automatically)
6. **Monitor usage** - check deployment dashboards for unexpected activity
7. **Use environment-specific secrets** - separate keys for staging vs production

## Support

If you encounter issues not covered in this guide:

1. Check the GitHub Actions logs for detailed error messages
2. Review platform-specific documentation
3. Open an issue in this repository with:
   - Deployment platform
   - Error messages (with secrets redacted)
   - Steps to reproduce

---

Last updated: January 2026
