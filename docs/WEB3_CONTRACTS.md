# Web3 Contracts Foundation

This folder introduces the first smart-contract foundation for the platform.

## Contracts

- `contracts/StampCoinToken.sol`
  - ERC-20 token (`STC`)
  - Initial mint: `42,000,000 STC` to treasury address
  - Owner mint function for controlled emissions

- `contracts/StampNFT.sol`
  - ERC-721 (`SNFT`) for stamp NFTs
  - Configurable mint fee
  - Treasury fee forwarding on mint
  - Platform fee basis points state (`platformFeeBps`)

## Suggested Next Steps

1. Add Foundry or Hardhat project setup and OpenZeppelin dependency.
2. Add deploy scripts for Sepolia and Mainnet.
3. Add role-based access for marketplace backend signer.
4. Add royalty support (ERC-2981) for creator payouts.
5. Add security test suite and audit checklist.

## Environment Variables

Use these in production:

- `WEB3_CHAIN_ID`
- `WEB3_NETWORK`
- `WEB3_RPC_URL`
- `STP_CONTRACT_ADDRESS`
- `STC_NFT_CONTRACT_ADDRESS`
- `WEB3_EXPLORER`
