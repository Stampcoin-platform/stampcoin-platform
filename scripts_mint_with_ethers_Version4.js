/**
 * مثال بسيط لصك NFT باستخدام ethers.js على عقد موجود (NFT_CONTRACT_ADDRESS)
 * يتطلب:
 * - DEPLOYER_PRIVATE_KEY
 * - RPC_URL
 * - NFT_CONTRACT_ADDRESS (العقد المنشور)
 * - ملف metadata URL (ipfs://CID أو https URL)
 *
 * تشغيل:
 * node scripts/mint_with_ethers.js <recipient_address> <tokenURI>
 */
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs-extra');
const path = require('path');

const RPC = process.env.RPC_URL;
const PK = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT = process.env.NFT_CONTRACT_ADDRESS;

if (!RPC || !PK || !CONTRACT) {
  console.error('تأكد من وجود RPC_URL و DEPLOYER_PRIVATE_KEY و NFT_CONTRACT_ADDRESS في .env');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/mint_with_ethers.js <to> <tokenURI>');
    process.exit(1);
  }
  const [to, tokenURI] = args;
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const abi = [
    "function mintTo(address to, string memory tokenURI) public returns (uint256)"
  ];
  const contract = new ethers.Contract(CONTRACT, abi, wallet);
  console.log('Sending mint tx to', CONTRACT, 'for', to);
  const tx = await contract.mintTo(to, tokenURI);
  console.log('tx submitted:', tx.hash);
  const receipt = await tx.wait();
  console.log('tx mined. receipt:', receipt.transactionHash);
}

main().catch(e => { console.error(e); process.exit(1); });