#!/usr/bin/env node
import 'dotenv/config';
import axios from 'axios';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface Stamp {
  id: string;
  country: string;
  year: number;
  name: string;
  denomination: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  description?: string;
  imageUrl?: string;
}

interface MintResult {
  stampId: string;
  country: string;
  category: string;
  tokenId: string;
  ipfsHash: string;
  txHash: string;
  timestamp: string;
}

// Get environment variables
const PINATA_JWT = process.env.PINATA_JWT;
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;

if (!PINATA_JWT || !NFT_CONTRACT_ADDRESS || !DEPLOYER_PRIVATE_KEY || !POLYGON_RPC_URL) {
  console.error('❌ Missing required environment variables');
  console.error('Required: PINATA_JWT, NFT_CONTRACT_ADDRESS, DEPLOYER_PRIVATE_KEY, POLYGON_RPC_URL');
  process.exit(1);
}

// Smart contract ABI (minimal)
const CONTRACT_ABI = [
  'function mint(address to, string memory uri) public returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256)',
];

// Sample stamps data (from database would be fetched here)
const SAMPLE_STAMPS: Stamp[] = [
  {
    id: 'GB-1840-001',
    country: 'Great Britain',
    year: 1840,
    name: 'Penny Black',
    denomination: 1,
    rarity: 'legendary',
    description: 'World\'s first adhesive postage stamp',
  },
  {
    id: 'USA-1918-001',
    country: 'USA',
    year: 1918,
    name: 'Inverted Jenny',
    denomination: 24,
    rarity: 'legendary',
    description: 'Famous printing error from 1918',
  },
  {
    id: 'GB-1856-001',
    country: 'Great Britain',
    year: 1856,
    name: 'British Guiana 1c Magenta',
    denomination: 1,
    rarity: 'legendary',
    description: 'One of the most valuable stamps ever',
  },
  {
    id: 'FR-1849-001',
    country: 'France',
    year: 1849,
    name: 'Cérès 20c Blue',
    denomination: 20,
    rarity: 'rare',
    description: 'Early French postage stamp',
  },
  {
    id: 'DE-1847-001',
    country: 'Germany',
    year: 1847,
    name: 'Thurn and Taxis',
    denomination: 1,
    rarity: 'rare',
    description: 'Early German postal stamp',
  },
  {
    id: 'IT-1851-001',
    country: 'Italy',
    year: 1851,
    name: 'Sardinia King Victor',
    denomination: 5,
    rarity: 'uncommon',
    description: 'Pre-unified Italy stamp',
  },
  {
    id: 'CH-1843-001',
    country: 'Switzerland',
    year: 1843,
    name: 'Zurich 4 Rappen',
    denomination: 4,
    rarity: 'rare',
    description: 'One of the earliest Swiss stamps',
  },
  {
    id: 'NL-1852-001',
    country: 'Netherlands',
    year: 1852,
    name: 'King William III',
    denomination: 5,
    rarity: 'uncommon',
    description: 'Early Netherlands stamp',
  },
];

// Upload metadata to IPFS
async function uploadToIPFS(metadata: any): Promise<string> {
  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      pinataMetadata: {
        name: `stampcoin-${metadata.name}`,
        keyvalues: {
          app: 'stampcoin',
          country: metadata.country,
          year: metadata.year.toString(),
          rarity: metadata.rarity,
        },
      },
      pinataOptions: { cidVersion: 1 },
      pinataContent: metadata,
    }, {
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      timeout: 20000,
    });
    return res.data.IpfsHash;
  } catch (error: any) {
    console.error(`❌ IPFS upload failed for ${metadata.name}:`, error.response?.data || error.message);
    throw error;
  }
}

// Create NFT metadata
function createMetadata(stamp: Stamp): any {
  return {
    name: `${stamp.name} (${stamp.year})`,
    description: stamp.description || `${stamp.country} stamp from ${stamp.year}`,
    image: stamp.imageUrl || `https://via.placeholder.com/200?text=${encodeURIComponent(stamp.name)}`,
    attributes: [
      { trait_type: 'Country', value: stamp.country },
      { trait_type: 'Year', value: stamp.year.toString() },
      { trait_type: 'Denomination', value: stamp.denomination.toString() },
      { trait_type: 'Rarity', value: stamp.rarity },
      { trait_type: 'StampID', value: stamp.id },
    ],
    external_url: `https://stampcoin.io/stamp/${stamp.id}`,
  };
}

// Get category from stamp
function getCategory(stamp: Stamp): string {
  const decade = Math.floor(stamp.year / 10) * 10;
  if (decade < 1850) return '1800s-Early';
  if (decade < 1900) return '1850-1900';
  if (decade < 1950) return '1900-1950';
  return '1950+';
}

// Mint NFTs
async function mintStamps(): Promise<void> {
  console.log('🚀 Starting NFT minting process...\n');

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  const signer = new ethers.Wallet(`0x${DEPLOYER_PRIVATE_KEY}`, provider);
  const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS || '', CONTRACT_ABI, signer);

  const results: MintResult[] = [];
  const resultsByCategory: Record<string, MintResult[]> = {};

  // Mint each stamp
  for (let i = 0; i < SAMPLE_STAMPS.length; i++) {
    const stamp = SAMPLE_STAMPS[i];
    const category = getCategory(stamp);

    console.log(`\n📮 [${i + 1}/${SAMPLE_STAMPS.length}] Minting: ${stamp.name} (${stamp.country}, ${stamp.year})`);

    try {
      // Create metadata
      const metadata = createMetadata(stamp);
      console.log('  → Creating metadata...');

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(metadata);
      const tokenUri = `ipfs://${ipfsHash}`;
      console.log(`  ✅ Uploaded to IPFS: ${ipfsHash}`);

      // Mint on blockchain
      console.log('  → Minting on Polygon...');
      const tx = await contract.mint(signer.address, tokenUri);
      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx.hash;
      
      // Extract token ID from receipt (event parsing would be better)
      const tokenId = `${i + 1}`;
      
      const result: MintResult = {
        stampId: stamp.id,
        country: stamp.country,
        category,
        tokenId,
        ipfsHash,
        txHash,
        timestamp: new Date().toISOString(),
      };

      results.push(result);
      if (!resultsByCategory[category]) resultsByCategory[category] = [];
      resultsByCategory[category].push(result);

      console.log(`  ✅ Minted! Token ID: ${tokenId} | TX: ${txHash.slice(0, 10)}...`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  // Save results
  console.log('\n\n📊 Saving results...');
  const resultsPath = path.join(process.cwd(), 'minting-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`✅ Results saved to: ${resultsPath}`);

  // Print summary by category
  console.log('\n\n📈 MINTING SUMMARY BY CATEGORY:\n');
  for (const [category, items] of Object.entries(resultsByCategory)) {
    console.log(`\n🏷️  ${category}`);
    console.log(`   Count: ${items.length}`);
    items.forEach(item => {
      console.log(`   • ${item.country}: ${item.stampId}`);
    });
  }

  console.log('\n\n✅ Minting complete!');
  console.log(`Total stamps minted: ${results.length}`);
  console.log(`\nNext steps:`);
  console.log(`1. Update database with token IDs and IPFS hashes`);
  console.log(`2. Create API endpoints for category display`);
  console.log(`3. Test category views on website`);
}

// Run
mintStamps().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
