#!/bin/bash
# Script to push all four deployment branches and create PRs
# This script requires GITHUB_TOKEN to be set or GitHub CLI (gh) to be authenticated

set -e

echo "Pushing four deployment workflow branches..."

# Push all four branches
git push origin add/vercel-deploy-workflow
git push origin add/fly-deploy-workflow  
git push origin add/railway-deploy-workflow
git push origin add/api-pin-endpoint

echo "✓ All branches pushed successfully"
echo ""
echo "Creating pull requests..."

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to create PRs..."
    
    # PR 1: Vercel
    gh pr create \
        --base main \
        --head add/vercel-deploy-workflow \
        --title "Add Vercel deploy workflow" \
        --body "- Adds a GitHub Actions workflow that builds the project and deploys to Vercel on pushes to \`main\`.
- Validates \`.env.example\` exists and that \`VERCEL_TOKEN\` secret is set before attempting deployment.
- Uses \`setup-node\` cache for faster installs and \`npx --yes vercel\` to avoid global installs."
    
    # PR 2: Fly
    gh pr create \
        --base main \
        --head add/fly-deploy-workflow \
        --title "Add Fly deploy workflow" \
        --body "- Adds a GitHub Actions workflow that builds the project and deploys to Fly on pushes to \`main\`.
- Validates \`.env.example\` exists and that \`FLY_API_TOKEN\` secret is set before attempting deployment.
- Requires a committed \`fly.toml\` and uses \`flyctl\` installed at runtime."
    
    # PR 3: Railway
    gh pr create \
        --base main \
        --head add/railway-deploy-workflow \
        --title "Add Railway deploy workflow" \
        --body "- Adds a GitHub Actions workflow that builds the project and triggers Railway on pushes to \`main\`.
- Validates \`.env.example\` exists and that \`RAILWAY_TOKEN\` secret is set before attempting deployment.
- Installs the Railway CLI and triggers \`railway up --ci\` when \`RAILWAY_PROJECT_ID\` is set; otherwise exits gracefully."
    
    # PR 4: API endpoint
    gh pr create \
        --base main \
        --head add/api-pin-endpoint \
        --title "Add API pin endpoint" \
        --body "- Adds serverless endpoint for pinning to nft.storage and optionally Pinata
- Compatible with Vercel Serverless (place in /api/pin.js)
- Expects POST with JSON: { name, description, imageBase64, pinata }
- Includes proper error handling and validation"
    
    echo "✓ All PRs created successfully"
else
    echo "GitHub CLI (gh) not found. Please create PRs manually or install gh CLI."
    echo ""
    echo "To create PRs manually, visit:"
    echo "  https://github.com/Stampcoin-platform/Stampcoin-platform/pull/new/add/vercel-deploy-workflow"
    echo "  https://github.com/Stampcoin-platform/Stampcoin-platform/pull/new/add/fly-deploy-workflow"
    echo "  https://github.com/Stampcoin-platform/Stampcoin-platform/pull/new/add/railway-deploy-workflow"
    echo "  https://github.com/Stampcoin-platform/Stampcoin-platform/pull/new/add/api-pin-endpoint"
fi
