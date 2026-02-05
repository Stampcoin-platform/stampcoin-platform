# Four Deployment Branches Created

This document describes the four deployment workflow branches that have been created locally and are ready to be pushed to create pull requests.

## Summary

Four branches have been created from the base commit `548c5f1` with the following files:

| Branch | File | Purpose |
|--------|------|---------|
| `add/vercel-deploy-workflow` | `.github/workflows/deploy-to-vercel.yml` | Vercel deployment workflow |
| `add/fly-deploy-workflow` | `.github/workflows/deploy-to-fly.yml` | Fly.io deployment workflow |
| `add/railway-deploy-workflow` | `.github/workflows/deploy-to-railway.yml` | Railway deployment workflow |
| `add/api-pin-endpoint` | `api/pin.js` | NFT pinning API endpoint |

## How to Push and Create PRs

### Option 1: GitHub Actions Workflow (Recommended)

The easiest way is to use the GitHub Actions workflow:

1. Go to the Actions tab in the repository
2. Select "Push Deployment Branches" workflow
3. Click "Run workflow"
4. The workflow will automatically push all four branches and create the PRs

**Workflow file**: `.github/workflows/push-deployment-branches.yml`

### Option 2: Automated Script

Run the provided script locally (requires GitHub credentials):
```bash
./push-deployment-branches.sh
```

This script will:
1. Push all four branches to origin
2. Create PRs using GitHub CLI if available
3. Provide manual links if GH CLI is not available

### Option 3: Manual Push and PR Creation

#### Step 1: Push all branches
```bash
git push origin add/vercel-deploy-workflow add/fly-deploy-workflow add/railway-deploy-workflow add/api-pin-endpoint
```

#### Step 2: Create PRs manually

Visit these URLs to create PRs:
- https://github.com/Stampcoin-platform/Stampcoin-platform/compare/main...add/vercel-deploy-workflow
- https://github.com/Stampcoin-platform/Stampcoin-platform/compare/main...add/fly-deploy-workflow
- https://github.com/Stampcoin-platform/Stampcoin-platform/compare/main...add/railway-deploy-workflow
- https://github.com/Stampcoin-platform/Stampcoin-platform/compare/main...add/api-pin-endpoint

## PR Details

### PR 1: Add Vercel deploy workflow
**Branch**: `add/vercel-deploy-workflow`  
**Title**: Add Vercel deploy workflow  
**Description**:
```
- Adds a GitHub Actions workflow that builds the project and deploys to Vercel on pushes to `main`.
- Validates `.env.example` exists and that `VERCEL_TOKEN` secret is set before attempting deployment.
- Uses `setup-node` cache for faster installs and `npx --yes vercel` to avoid global installs.
```

### PR 2: Add Fly deploy workflow
**Branch**: `add/fly-deploy-workflow`  
**Title**: Add Fly deploy workflow  
**Description**:
```
- Adds a GitHub Actions workflow that builds the project and deploys to Fly on pushes to `main`.
- Validates `.env.example` exists and that `FLY_API_TOKEN` secret is set before attempting deployment.
- Requires a committed `fly.toml` and uses `flyctl` installed at runtime.
```

### PR 3: Add Railway deploy workflow
**Branch**: `add/railway-deploy-workflow`  
**Title**: Add Railway deploy workflow  
**Description**:
```
- Adds a GitHub Actions workflow that builds the project and triggers Railway on pushes to `main`.
- Validates `.env.example` exists and that `RAILWAY_TOKEN` secret is set before attempting deployment.
- Installs the Railway CLI and triggers `railway up --ci` when `RAILWAY_PROJECT_ID` is set; otherwise exits gracefully.
```

### PR 4: Add API pin endpoint
**Branch**: `add/api-pin-endpoint`  
**Title**: Add API pin endpoint  
**Description**:
```
- Adds serverless endpoint for pinning to nft.storage and optionally Pinata
- Compatible with Vercel Serverless (place in /api/pin.js)
- Expects POST with JSON: { name, description, imageBase64, pinata }
- Includes proper error handling and validation
```

## Branch Status

To verify branches are ready:
```bash
git branch --list "add/*" -v
```

Expected output:
```
add/api-pin-endpoint         0ce4d55 Add API pin endpoint
add/fly-deploy-workflow      9df2a16 Add Fly deploy workflow
add/railway-deploy-workflow  0bd3984 Add Railway deploy workflow
add/vercel-deploy-workflow   31b0722 Add Vercel deploy workflow
```

## Files Created

### 1. `.github/workflows/deploy-to-vercel.yml`
GitHub Actions workflow for deploying to Vercel. Validates environment, builds project, and deploys using Vercel CLI.

### 2. `.github/workflows/deploy-to-fly.yml`
GitHub Actions workflow for deploying to Fly.io. Installs flyctl, validates environment, and deploys application.

### 3. `.github/workflows/deploy-to-railway.yml`
GitHub Actions workflow for deploying to Railway. Installs Railway CLI and triggers deployment.

### 4. `api/pin.js`
Serverless API endpoint for pinning content to IPFS via nft.storage and optionally Pinata. Handles image uploads up to 5MB with proper validation and error handling.
