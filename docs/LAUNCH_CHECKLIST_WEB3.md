# Launch Checklist: Web3 + NFT + P2P

Date: 2026-03-12

## Secrets and Environment

- [ ] Set `DEPLOYER_PRIVATE_KEY` in secure secret store.
- [ ] Set `TREASURY_ADDRESS` for treasury ownership and fee routing.
- [ ] Set `WEB3_RPC_URL` to production-grade RPC provider.
- [ ] Set `WEB3_CHAIN_ID` and `WEB3_NETWORK` for target network.
- [ ] Set `WEB3_EXPLORER` for transaction links.
- [ ] Set `STP_CONTRACT_ADDRESS` and `STC_NFT_CONTRACT_ADDRESS` after deployment.
- [ ] Set `SYNC_TOKEN` for protected admin endpoints.

## Contract and ABI Pipeline

- [ ] Run `npm run web3:compile`.
- [ ] Deploy contracts to Sepolia: `npm run web3:deploy:sepolia`.
- [ ] Run `npm run web3:export-abis`.
- [ ] Confirm ABI files are generated under `public/abi`.
- [ ] Verify ownership and treasury settings on deployed contracts.

## API and Storage Hardening

- [ ] Replace JSON-file persistence with database storage.
- [ ] Move uploads from local disk to object storage (S3/Azure Blob/etc.).
- [ ] Add malware scanning pipeline for uploaded JPG files.
- [ ] Add upload rate limits and abuse protection.
- [ ] Add role-based auth for creator/admin/write routes.

## Web3 and Trading Operations

- [ ] Test MetaMask connect flow on desktop and mobile wallet browser.
- [ ] Validate chain mismatch handling in frontend.
- [ ] Validate mint fee behavior and treasury receipts on testnet.
- [ ] Add indexer/subgraph plan for NFT and token activity.
- [ ] Define on-chain fee policy and version it in docs.

## Product and Compliance

- [ ] Define KYC/AML scope for fiat gateway and custodial flows.
- [ ] Define P2P dispute policy and evidence retention rules.
- [ ] Publish Terms of Service and seller/buyer protection policy.
- [ ] Add privacy policy for user content and uploads.

## Observability and Release

- [ ] Add structured logs for upload, mint-draft, and p2p routes.
- [ ] Add uptime and API error alerting.
- [ ] Add canary smoke tests post-deploy.
- [ ] Run final regression suite before production rollout.
