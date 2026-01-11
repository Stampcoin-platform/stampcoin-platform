# Deployment & IPFS Pinning — Setup Guide

This document explains how to enable CI/CD and IPFS pinning for the Stampcoin-platform frontend.

## Overview
Files added:
- `.github/workflows/deploy-vercel.yml` — Build & deploy to Vercel on push to `main`.
- `.github/workflows/deploy-fly.yml` — Build & deploy to Fly on push to `main`.
- `.github/workflows/deploy-railway.yml` — Build & trigger Railway deployment on push to `main`.
- `api/pin.js` — Serverless endpoint to pin images & metadata to nft.storage and optionally Pinata.
- `examples/pin-client.js` — Client example to call the serverless endpoint.
- `.env.example` — Environment variable names required.

## Required environment variables / secrets
Set the following as repository secrets (GitHub) and also in the target platforms (Vercel/Fly/Railway):

- NFT_STORAGE_API_KEY
- PINATA_API_KEY
- PINATA_SECRET_API_KEY (or use PINATA_JWT)
- VERCEL_TOKEN (for CLI-based deploy; optional if using Vercel GitHub integration)
- FLY_API_TOKEN
- FLY_APP_NAME (optional)
- RAILWAY_TOKEN
- RAILWAY_PROJECT_ID (or enable Railway GitHub integration)

## Adding secrets to GitHub
Go to: Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
Add keys above and their values.

## Platforms
- Vercel: recommended for serverless API routes (place `api/pin.js` in project root under `/api` if using Next.js; Vercel will serve it).
- Fly / Railway: if you prefer a container/long-running service, deploy the backend there and expose an authenticated endpoint. Add secrets in the platform dashboard.

## Usage
- Client uploads an image as base64 to `/api/pin` (POST JSON).
- Server pins via nft.storage and returns metadata with CID.
- If `pinata: true` is sent, server will also pin to Pinata.

## Security recommendations
- Never put API keys in client-side code.
- Protect the pin endpoint (authentication, rate limiting, file type/size checks).
- For production, add virus scanning and stricter validation.

## Next steps
1. Add the secrets listed above to GitHub and platform dashboards.
2. Commit files into a branch and open a PR.
3. Merge to `main`. On push to `main` the workflows will build and attempt deploys (depending on secrets & platform config).
