# Deployment & IPFS Pinning Guide

This guide covers the deployment workflows and IPFS pinning functionality added to the Stampcoin Platform.

## Table of Contents

- [Overview](#overview)
- [Files Added](#files-added)
- [Deployment Workflows](#deployment-workflows)
  - [Vercel Deployment](#vercel-deployment)
  - [Fly.io Deployment](#flyio-deployment)
  - [Railway Deployment](#railway-deployment)
- [IPFS Pinning API](#ipfs-pinning-api)
  - [API Endpoint](#api-endpoint)
  - [Usage Examples](#usage-examples)
- [Required Secrets & Configuration](#required-secrets--configuration)
  - [GitHub Secrets](#github-secrets)
  - [Platform Dashboard Configuration](#platform-dashboard-configuration)
- [Security Recommendations](#security-recommendations)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

## Overview

This implementation adds:

1. **GitHub Actions workflows** for automated CI/CD deployment to Vercel, Fly.io, and Railway
2. **Serverless IPFS pinning endpoint** (`/api/pin`) supporting both nft.storage and Pinata
3. **Client example code** for interacting with the pinning API
4. **Environment configuration** templates for all deployment platforms

## Files Added

### Workflow Files

- `.github/workflows/deploy-vercel.yml` - Vercel deployment workflow
- `.github/workflows/deploy-fly.yml` - Fly.io deployment workflow
- `.github/workflows/deploy-railway.yml` - Railway deployment workflow

### API & Examples

- `api/pin.js` - Serverless endpoint for IPFS pinning
- `examples/pin-client.js` - Browser-based client example

### Documentation & Configuration

- `README_DEPLOY.md` - This comprehensive deployment guide
- `.env.example` - Updated with deployment platform variables

## Deployment Workflows

All three workflows trigger on push to the `main` branch. Each workflow:

1. Validates that `.env.example` exists in the repository
2. Checks out the code
3. Sets up Node.js 18
4. Installs dependencies with `npm ci`
5. Builds the project with `npm run build`
6. Deploys to the respective platform

### Vercel Deployment

**Workflow:** `.github/workflows/deploy-vercel.yml`

**Prerequisites:**
- Vercel account with a project created
- Vercel CLI token

**Configuration Steps:**

1. **Generate Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it (e.g., "GitHub Actions")
   - Copy the token (you won't see it again)

2. **Get Project Details (Optional):**
   ```bash
   npx vercel link
   # This creates .vercel/project.json with org and project IDs
   ```

3. **Add GitHub Secrets:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add: `VERCEL_TOKEN` (required)
   - Optional: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

4. **Configure Vercel Dashboard:**
   - In your Vercel project settings, add environment variables:
     - `NFT_STORAGE_API_KEY`
     - `PINATA_JWT` or `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`
     - Other required environment variables from `.env.example`

**Note:** For Next.js projects, move `api/pin.js` to `pages/api/pin.js` or `app/api/pin/route.js` depending on your Next.js version.

### Fly.io Deployment

**Workflow:** `.github/workflows/deploy-fly.yml`

**Prerequisites:**
- Fly.io account
- `fly.toml` configuration file in repository (already exists in this repo)
- Fly app created

**Configuration Steps:**

1. **Install Fly CLI locally:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and create app (if not done):**
   ```bash
   flyctl auth login
   flyctl launch
   # This creates/updates fly.toml
   ```

3. **Get API Token:**
   ```bash
   flyctl auth token
   ```

4. **Add GitHub Secrets:**
   - `FLY_API_TOKEN` (required)
   - `FLY_APP_NAME` (your fly app name, e.g., "stampcoin-platform")

5. **Set Environment Variables in Fly:**
   ```bash
   flyctl secrets set NFT_STORAGE_API_KEY="your_key_here"
   flyctl secrets set PINATA_JWT="your_jwt_here"
   # Add all other required secrets from .env.example
   ```

### Railway Deployment

**Workflow:** `.github/workflows/deploy-railway.yml`

**Prerequisites:**
- Railway account
- Railway project created
- Railway CLI token

**Configuration Steps:**

1. **Create Railway Project:**
   - Go to https://railway.app/dashboard
   - Create a new project
   - Connect your GitHub repository (recommended) OR use CLI deployment

2. **Get Service ID & Token:**
   
   Using Railway Dashboard:
   - Go to your Project
   - Select your Service
   - In Settings, copy the Service ID
   - In Account Settings, generate a deployment token

   Using Railway CLI:
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   # View service details
   railway status
   ```

3. **Add GitHub Secrets:**
   - `RAILWAY_TOKEN` (required)
   - `RAILWAY_SERVICE_ID` (required for CLI deployment)

4. **Configure Railway Environment Variables:**
   - In Railway dashboard, go to your service
   - Add Variables:
     - `NFT_STORAGE_API_KEY`
     - `PINATA_JWT` or `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`
     - All other required variables from `.env.example`

**Note:** Railway's GitHub integration (recommended) automatically deploys on push and doesn't require `RAILWAY_TOKEN` or `RAILWAY_SERVICE_ID` secrets. The workflow above is for CLI-based deployment.

## IPFS Pinning API

### API Endpoint

**Endpoint:** `POST /api/pin`

**Purpose:** Pins image files to IPFS using nft.storage and optionally Pinata.

**Request Format:**

```json
{
  "name": "My NFT",
  "description": "Description of the NFT",
  "imageBase64": "data:image/png;base64,iVBORw0KGg...",
  "pinata": false
}
```

**Parameters:**

- `name` (string, optional): Name/title for the NFT metadata
- `description` (string, optional): Description for the NFT metadata
- `imageBase64` (string, required): Base64-encoded image data URL (must start with `data:image/...;base64,`)
- `pinata` (boolean, optional): If `true`, also pins to Pinata in addition to nft.storage

**Response Format:**

```json
{
  "nftStorage": {
    "ipnft": "bafyreia...",
    "url": "ipfs://bafyreia.../metadata.json"
  },
  "pinata": {
    "IpfsHash": "Qm...",
    "PinSize": 12345,
    "Timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Constraints:**

- Maximum file size: 5 MB
- Supported content types: Images (detected from data URL)
- Method: POST only

**Error Responses:**

- `400`: Invalid request (missing imageBase64, invalid data URL, wrong content type)
- `405`: Method not allowed (non-POST requests)
- `413`: Payload too large (file exceeds 5 MB)
- `500`: Server error (pinning failure, API errors)

### Usage Examples

See `examples/pin-client.js` for a complete browser-based example.

**Basic Usage:**

```javascript
async function pinImage(imageDataUrl) {
  const response = await fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'My Stamp',
      description: 'Rare stamp from 1920',
      imageBase64: imageDataUrl,
      pinata: false  // Set to true to also pin to Pinata
    })
  });

  if (!response.ok) {
    throw new Error('Failed to pin: ' + await response.text());
  }

  return await response.json();
}
```

**With File Input:**

```html
<input type="file" id="fileInput" accept="image/*">

<script>
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    try {
      const result = await pinImage(event.target.result);
      console.log('Pinned successfully:', result);
      console.log('IPFS URL:', result.nftStorage.url);
    } catch (error) {
      console.error('Pin failed:', error);
    }
  };
  
  reader.readAsDataURL(file);
});
</script>
```

## Required Secrets & Configuration

### GitHub Secrets

Add these secrets to your GitHub repository at Settings → Secrets and variables → Actions:

#### IPFS/NFT Storage (Required for /api/pin)

- **`NFT_STORAGE_API_KEY`** (required)
  - Get from: https://nft.storage/
  - Sign up and generate an API token
  
- **`PINATA_JWT`** (optional, for dual pinning)
  - Get from: https://pinata.cloud/
  - Alternative: Use `PINATA_API_KEY` + `PINATA_SECRET_API_KEY`

#### Vercel Deployment (Optional)

- **`VERCEL_TOKEN`** (required for Vercel deploy)
  - Get from: https://vercel.com/account/tokens

- `VERCEL_ORG_ID` (optional)
- `VERCEL_PROJECT_ID` (optional)

#### Fly.io Deployment (Optional)

- **`FLY_API_TOKEN`** (required for Fly deploy)
  - Generate with: `flyctl auth token`

- **`FLY_APP_NAME`** (required)
  - Your Fly.io app name

#### Railway Deployment (Optional)

- **`RAILWAY_TOKEN`** (required for Railway deploy)
  - Get from Railway project settings

- **`RAILWAY_SERVICE_ID`** (required for CLI deployment)
  - Get from Railway service settings or `railway status`
  - Not needed if using Railway GitHub integration

### Platform Dashboard Configuration

For each deployment platform, configure environment variables in their dashboards:

#### All Platforms - Common Variables

```bash
NODE_ENV=production
DATABASE_URL=<your-database-url>
JWT_SECRET=<random-secret>

# IPFS
NFT_STORAGE_API_KEY=<your-key>
PINATA_JWT=<your-jwt>

# Or alternatively:
PINATA_API_KEY=<your-key>
PINATA_SECRET_API_KEY=<your-secret>
```

#### Platform-Specific Notes

**Vercel:**
- Add all env vars in Project Settings → Environment Variables
- Set environment: Production, Preview, Development as needed
- For Next.js serverless functions, ensure `api/` directory is at root or in `pages/`

**Fly.io:**
- Use `flyctl secrets set KEY=value` for sensitive values
- Use `fly.toml` for non-sensitive configuration
- Secrets are encrypted at rest

**Railway:**
- Add variables in dashboard under "Variables" tab
- Railway automatically redeploys when variables change
- Can use Railway CLI: `railway variables set KEY=value`

## Security Recommendations

### ⚠️ Critical Security Practices

1. **Never commit secrets to source control**
   - All secrets should be in GitHub Secrets or platform environment variables
   - `.env.example` should contain only placeholder values
   - Add `.env` to `.gitignore` (already done)

2. **Rotate API keys regularly**
   - Especially if they may have been exposed
   - Update in all environments (GitHub Secrets + platform dashboards)

3. **Use least-privilege tokens**
   - Vercel: Use project-specific tokens if available
   - Fly.io: Use app-specific tokens
   - Railway: Use deploy tokens (not personal access tokens)

4. **Implement rate limiting**
   - The `/api/pin` endpoint has a 5MB file size limit
   - Consider adding IP-based rate limiting for production
   - Use Vercel's rate limiting or implement custom middleware

5. **Validate inputs**
   - The API validates data URLs and file sizes
   - Consider adding additional content validation (image verification)
   - Implement authentication/authorization for production use

6. **Monitor API usage**
   - nft.storage has storage limits on free tier
   - Pinata has upload/storage limits based on plan
   - Monitor logs for suspicious activity

7. **Secure environment variables**
   - Use platform-provided secrets management
   - Don't log environment variables
   - Don't expose them in error messages

### API Security Enhancements (Recommended)

For production deployment, consider adding:

```javascript
// Add to api/pin.js

// 1. Authentication
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.INTERNAL_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// 2. Rate limiting (example with Vercel)
// Install: npm install @vercel/rate-limit
import rateLimit from '@vercel/rate-limit';
const limiter = rateLimit({ interval: 60000, max: 10 });
await limiter.check(req);

// 3. Content validation
// Install: npm install file-type
import { fileTypeFromBuffer } from 'file-type';
const fileType = await fileTypeFromBuffer(buffer);
if (!fileType || !fileType.mime.startsWith('image/')) {
  return res.status(400).json({ error: 'Invalid image file' });
}
```

## Next Steps

### Immediate Actions

1. **Add required secrets to GitHub:**
   - [ ] `NFT_STORAGE_API_KEY`
   - [ ] `VERCEL_TOKEN` (if using Vercel)
   - [ ] `FLY_API_TOKEN` and `FLY_APP_NAME` (if using Fly.io)
   - [ ] `RAILWAY_TOKEN` (if using Railway)

2. **Configure platform dashboards:**
   - [ ] Add environment variables to Vercel/Fly/Railway
   - [ ] Test deployment manually before relying on GitHub Actions

3. **Test the API endpoint:**
   - [ ] Deploy to a platform
   - [ ] Test `/api/pin` with the example client code
   - [ ] Verify files are pinned to IPFS correctly

4. **Adjust for your framework:**
   - [ ] If using Next.js, move `api/pin.js` to `pages/api/` or `app/api/`
   - [ ] Update import statements if needed (ESM vs CommonJS)

### Optional Enhancements

1. **Add authentication** to `/api/pin` endpoint
2. **Implement rate limiting** to prevent abuse
3. **Add monitoring** and alerting for deployments
4. **Set up preview deployments** (Vercel does this automatically)
5. **Configure custom domains** in platform dashboards
6. **Enable CORS** if needed for cross-origin requests
7. **Add file type validation** for uploaded images
8. **Implement webhook handlers** for platform deployment notifications

### Framework-Specific Adjustments

**Next.js (App Router):**
```bash
# Move and adapt the API route
mv api/pin.js app/api/pin/route.js
# Update to use Next.js 13+ API route format
```

**Next.js (Pages Router):**
```bash
# Move the API route
mv api/pin.js pages/api/pin.js
# No changes needed, should work as-is
```

**Express/Node.js:**
- The API function can be adapted to Express middleware
- Import and mount as a route handler

**Other Serverless Platforms:**
- The function is compatible with most serverless platforms
- May need platform-specific adapters (e.g., AWS Lambda)

## Troubleshooting

### Workflow Fails: ".env.example not found"

**Solution:** Ensure `.env.example` exists in the repository root.

```bash
git add .env.example
git commit -m "Add .env.example"
git push
```

### Workflow Fails: "npm run build" error

**Solutions:**

1. Verify build script exists in `package.json`
2. Check if build requires environment variables (add to platform secrets)
3. Test build locally: `npm ci && npm run build`
4. Update workflow to use correct build command if different

### Vercel Deploy Fails: "Token authentication failed"

**Solutions:**

1. Verify `VERCEL_TOKEN` secret is set correctly in GitHub
2. Token may have expired - generate a new one
3. Check token has correct permissions

### Fly.io Deploy Fails: "fly.toml not found"

**Solution:** Ensure `fly.toml` is committed to the repository:

```bash
flyctl launch  # Creates fly.toml
git add fly.toml
git commit -m "Add Fly.io configuration"
git push
```

### Railway Deploy Fails: "RAILWAY_TOKEN secret is missing"

**Solutions:**

1. Add `RAILWAY_TOKEN` to GitHub Secrets
2. Alternative: Enable Railway GitHub integration in Railway dashboard (then token not needed)

### API Returns 500: "Cannot find module 'nft.storage'"

**Solution:** Install required dependencies:

```bash
npm install nft.storage node-fetch form-data
```

Add to `package.json` if not present:

```json
{
  "dependencies": {
    "nft.storage": "^7.0.0",
    "node-fetch": "^2.6.7",
    "form-data": "^4.0.0"
  }
}
```

### API Returns 400: "imageBase64 must be a data URL"

**Solution:** Ensure you're sending the image as a base64 data URL:

```javascript
// Correct format:
"data:image/png;base64,iVBORw0KGgoAAAANS..."

// Incorrect (missing data URL prefix):
"iVBORw0KGgoAAAANS..."
```

### IPFS Pinning Succeeds but Can't Access Content

**Solutions:**

1. Use an IPFS gateway: `https://ipfs.io/ipfs/{hash}` or `https://nftstorage.link/ipfs/{hash}`
2. nft.storage returns a full `ipfs://` URL in metadata - extract the hash
3. Wait a few moments for propagation across IPFS network

### Different Build Commands

If your project uses a different build command or package manager:

**Using pnpm:**
```yaml
# In workflow files, replace:
- name: Install dependencies
  run: npm ci

# With:
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**Using yarn:**
```yaml
- name: Install dependencies
  run: yarn install --frozen-lockfile
```

**Different build command:**
```yaml
# Replace npm run build with your command:
- name: Build
  run: npm run build:prod
```

## Support

For issues specific to:

- **GitHub Actions**: Check workflow logs in Actions tab
- **Vercel**: Check deployment logs in Vercel dashboard
- **Fly.io**: Use `flyctl logs` or dashboard
- **Railway**: Check deployment logs in Railway dashboard
- **nft.storage**: Check https://nft.storage/docs/
- **Pinata**: Check https://docs.pinata.cloud/

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Fly.io Documentation](https://fly.io/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [nft.storage Documentation](https://nft.storage/docs/)
- [Pinata Documentation](https://docs.pinata.cloud/)

---

**Last Updated:** 2026-01-11

**Related Files:**
- `.github/workflows/deploy-vercel.yml`
- `.github/workflows/deploy-fly.yml`
- `.github/workflows/deploy-railway.yml`
- `api/pin.js`
- `examples/pin-client.js`
- `.env.example`
