#!/usr/bin/env bash
# scripts/restructure-repo.sh
# Usage: ./scripts/restructure-repo.sh
# Safe reorganization script:
# - creates branch refactor/restructure-repo
# - moves files into client/, server/, infra/, scripts/, docs/
# - archives versioned/duplicate files to docs/archive/
# - commits changes and (optionally) pushes + opens a PR via gh
set -euo pipefail

BRANCH="refactor/restructure-repo"
COMMIT_MSG="refactor: reorganize repository structure (client/server/docs/infra/scripts/archive)"
PR_TITLE="refactor: reorganize repository structure"
PR_BODY="This PR moves frontend components/pages/styles into client/src, server API code into server/src, infra files into infra/, and groups documentation into docs/. Versioned/duplicate files have been archived under docs/archive for review.\\n\\nIMPORTANT: Review docs/archive immediately for any sensitive data (recovery codes, tokens) and rotate/revoke as necessary.\\n\\nHow to review locally: git checkout ${BRANCH} && git show --name-only HEAD && run your build/tests."

# Ensure we are in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this from the repository root (inside a git repo)."
  exit 1
fi

# Ensure working tree clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash changes before running this script."
  git status --porcelain
  exit 1
fi

# Create and switch to branch
git checkout -b "${BRANCH}"

# Create target folders
mkdir -p client/src/{components,pages,styles,assets}
mkdir -p server/src/api server/src/{controllers,utils}
mkdir -p shared libs tests
mkdir -p scripts/deploy scripts/db
mkdir -p docs archive docs/archive infra config contracts assets

echo "Directories created."

# Helper: git mv if exists
move_if_exists() {
  src="$1"
  dst="$2"
  if [ -e "$src" ]; then
    echo "Moving: $src -> $dst"
    mkdir -p "$(dirname "$dst")"
    git mv "$src" "$dst"
  else
    echo "Skip (not found): $src"
  fi
}

# Move frontend components and pages (common names found)
shopt -s nullglob
for file in components_*.jsx components_*.js components_*.tsx; do
  [ -e "$file" ] || continue
  base="$(basename "$file" | sed -e 's/^components_//' -e 's/Version[0-9._ ()-]*//g')"
  move_if_exists "$file" "client/src/components/${base}"
done

# Move explicit component files
move_if_exists "components_Footer_Version2.jsx" "client/src/components/Footer.jsx"
move_if_exists "components_Header_Version3.jsx" "client/src/components/Header.jsx"
move_if_exists "components_StampCard_Version2.jsx" "client/src/components/StampCard.jsx"

# Move styles
move_if_exists "styles_globals_Version2.css" "client/src/styles/globals.css"
move_if_exists "styles_globals_Version2 (1).css" "docs/archive/styles_globals_Version2_1.css"

# Move main / entry
move_if_exists "main.tsx.txt" "client/src/main.tsx"

# Move API route files (pages_api_*) to server/src/api
for file in pages_api_*; do
  [ -e "$file" ] || continue
  move_if_exists "$file" "server/src/api/$(basename "$file" | sed 's/pages_api_//')"
done

# Move page files (pages_*) to client/src/pages
for file in pages_*; do
  [ -e "$file" ] || continue
  # skip API files already moved
  if [[ "$file" == pages_api_* ]]; then
    continue
  fi
  move_if_exists "$file" "client/src/pages/$(basename "$file" | sed 's/^pages_//')"
done

# Move deploy scripts to scripts/deploy
for file in deploy-*.sh deploy-*.ps1 deploy-railway*.sh deploy-vercel.sh deploy-render.sh deploy-flyio.sh deploy-polygon.sh configure-production.sh start-*.sh; do
  [ -e "$file" ] || continue
  move_if_exists "$file" "scripts/deploy/$(basename "$file")"
done

# Move other scripts into scripts/
for file in setup-*.sh setup-*.ps1 mass-mint-stamps.sh test-contract.sh start-nft-system.sh setup-dev.sh; do
  [ -e "$file" ] || continue
  move_if_exists "$file" "scripts/$(basename "$file")"
done

# Move infra files
move_if_exists "Dockerfile" "infra/Dockerfile"
move_if_exists "docker-compose.yml" "infra/docker-compose.yml"
move_if_exists "docker-compose.override.yml" "infra/docker-compose.override.yml"
move_if_exists "fly.toml" "infra/fly.toml"
move_if_exists "render.yaml" "infra/render.yaml"
move_if_exists "railway.json" "infra/railway.json"
move_if_exists "nixpacks.toml" "infra/nixpacks.toml"
move_if_exists "vercel-backend.json" "infra/vercel-backend.json"

# Move contracts
for file in contracts_*.sol; do
  [ -e "$file" ] || continue
  move_if_exists "$file" "contracts/$(basename "$file" | sed 's/^contracts_//')"
done

# Move prisma / drizzle / infra config to infra/ or config/
move_if_exists "drizzle.config.ts" "infra/drizzle.config.ts"
move_if_exists "prisma_schema_Version3.prisma" "infra/prisma_schema.prisma"
move_if_exists "prisma_seed_Version3.js" "infra/prisma_seed.js"
move_if_exists "vite.config.ts" "infra/vite.config.ts"
move_if_exists "tsconfig.json" "infra/tsconfig.json"

# Move docs: most .md to docs/, but keep README.md and SECURITY.md at root
for md in *.md; do
  if [ "$md" = "README.md" ] || [ "$md" = "SECURITY.md" ]; then
    echo "Keeping at root: $md"
    continue
  fi
  [ -e "$md" ] || continue
  move_if_exists "$md" "docs/$(basename "$md")"
done

# Archive versioned files and backups into docs/archive
mkdir -p docs/archive
for pat in *Version* "* (1).*" "*_Version*; do
  for file in $pat; do
    [ -e "$file" ] || continue
    # only move if still tracked at root
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
      move_if_exists "$file" "docs/archive/$(basename "$file")"
    fi
  done
done

# Move env/examples to config/
move_if_exists ".env.example" "config/.env.example"
move_if_exists ".env.local.example" "config/.env.local.example"
move_if_exists ".env.production.example" "config/.env.production.example"
move_if_exists ".env.deployment.example" "config/.env.deployment.example"
move_if_exists ".env.docker" "config/.env.docker"
move_if_exists "env.placeholder" "config/env.placeholder"
move_if_exists "env_Version2.example" "config/env_Version2.example"
move_if_exists "env_Version3.example" "config/env_Version3.example"

# Move package versioned JSONs to docs/archive
for pj in package_Version*.json package_*.json todo-app_package_*.json; do
  for file in $pj; do
    [ -e "$file" ] || continue
    move_if_exists "$file" "docs/archive/$(basename "$file")"
  done
done

# Move suspicious/temporary files into docs/archive for inspection
for tmp in "ddddddddddddd" "cp .env.placeholder .env" "github-recovery-codes*" "* (1).txt"; do
  for file in $tmp; do
    [ -e "$file" ] || continue
    move_if_exists "$file" "docs/archive/$(basename "$file")"
    echo "Warning: moved '$file' to docs/archive. Inspect for sensitive data and delete if needed."
  done
done

# Final git add/commit
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "${COMMIT_MSG}"
fi

echo "Refactor commit created on branch ${BRANCH}."

# Ask user before push / PR
read -p "Ready to push branch '${BRANCH}' and open a PR? (requires gh CLI and push permission) [y/N]: " CONFIRM
CONFIRM=${CONFIRM:-N}
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborting push/PR creation. You can push manually later:"
  echo "  git push -u origin ${BRANCH}"
  echo "  gh pr create --base main --head ${BRANCH} --title \"${PR_TITLE}\" --body \"${PR_BODY}\""
  exit 0
fi

# Check gh CLI
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found. Install GitHub CLI and authenticate (gh auth login)."
  exit 1
fi

# Check gh auth status
if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

# Push branch
git push -u origin "${BRANCH}"

# Create PR
gh pr create --base main --head "${BRANCH}" --title "${PR_TITLE}" --body "${PR_BODY}"

echo "Pull request created. Review it on GitHub."