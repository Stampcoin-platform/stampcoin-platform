# PR Summary: Web3 + Platform Expansion

Date: 2026-03-12

## Overview

This change delivers two major tracks:

1. Full frontend/backend expansion for advanced marketplace features.
2. Web3 smart contract foundation with Hardhat deployment workflow.

## Included Features

- Modernized frontend UX with user dropdown, cultural hub, NFT studio, trade hub, P2P escrow section, and AI support assistant.
- Backend APIs for community posts, JPG-to-NFT draft creation, P2P listings, and Web3 config.
- MetaMask connection flow in frontend using `ethers.js`.
- Solidity smart contracts:
  - `StampCoinToken.sol` (ERC-20, 42M initial supply)
  - `StampNFT.sol` (ERC-721 minting with treasury fee handling)
- Hardhat setup and scripts:
  - `hardhat.config.js`
  - `scripts/web3/deploy-sepolia.js`
  - `scripts/web3/export-abis.js`
  - `public/abi/StampCoinToken.abi.json`
  - `public/abi/StampNFT.abi.json`

## Deployment Notes

- Pushed to `origin/main` and verified live deployment sections and API endpoints on Fly.io.
- Web3 deployment to Sepolia requires setting `.env` values:
  - `DEPLOYER_PRIVATE_KEY`
  - `TREASURY_ADDRESS`
  - `WEB3_RPC_URL`
  - `STAMP_NFT_MINT_FEE_WEI`
- Deploy script is aligned with Hardhat `ethers v5` (`deployed()` and `.address`).

## Validated Commands

- `npm test`
- `npm run web3:compile`
- `npm run web3:export-abis`

## Launch Checklist

- [ ] Set production RPC and signer key in secure secrets store.
- [ ] Deploy STC and StampNFT to Sepolia using `npm run web3:deploy:sepolia`.
- [ ] Export ABIs with `npm run web3:export-abis`.
- [ ] Configure `STP_CONTRACT_ADDRESS` and `STC_NFT_CONTRACT_ADDRESS` env vars.
- [ ] Run smoke tests for wallet connect and NFT draft API.
- [ ] Enable monitoring and alerting for upload and mint endpoints.

## Risk Notes

- Current contracts are a foundational baseline and should undergo security review before mainnet.
- Upload validation currently allows JPG only; malware scanning can be added as a next hardening step.
