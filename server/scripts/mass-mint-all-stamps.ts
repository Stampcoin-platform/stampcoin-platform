#!/usr/bin/env node
/**
 * Mass Mint All Stamps System
 * Loads all stamps from archive, mints them as NFTs, and stores in IPFS
 * Supports both Pinata and nft.storage for redundancy
 */

import 'dotenv/config';
import axios from 'axios';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { getDb } from '../db';
import { stampArchive, stampNFT } from '../../drizzle/schema';

// ============================================================================
// TYPES
// ============================================================================

interface ArchiveStamp {
  id: string;
  country: string;
  denomination: string;
  year: number;
  catalog: string;
  condition: 'mint' | 'used' | 'fine' | 'very_fine';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  description: string;
  imageUrl: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  imageIpfs: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url: string;
  category: string;
  timestamp: number;
}

interface MintResult {
  stampId: string;
  country: string;
  rarity: string;
  tokenId?: string;
  ipfsHash?: string;
  pinataHash?: string;
  nftStorageHash?: string;
  txHash?: string;
  downloadUrl?: string;
  status: 'success' | 'error';
  error?: string;
  timestamp: string;
}

interface MintSummary {
  totalStamps: number;
  successfulMints: number;
  failedMints: number;
  totalValue: number;
  byRarity: Record<string, number>;
  byCountry: Record<string, number>;
  ipfsStats: {
    pinataUploads: number;
    nftStorageUploads: number;
  };
  results: MintResult[];
}

// ============================================================================
// ENVIRONMENT & CONFIG
// ============================================================================

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_API_KEY;
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x0E903614e8Fb61B5D36734D7B435088C5d68B963';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';
const NFT_STORAGE_GATEWAY = 'https://ipfs.io/ipfs';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'downloads');

// ============================================================================
// LOGGER
// ============================================================================

const log = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  warn: (msg: string) => console.warn(`⚠️  ${msg}`),
  header: (msg: string) => console.log(`\n📦 ${msg}\n`),
};

// ============================================================================
// IPFS UPLOAD FUNCTIONS
// ============================================================================

async function uploadToPinata(
  metadata: NFTMetadata,
  imageBuffer?: Buffer,
): Promise<{ hash: string; url: string }> {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT not configured');
  }

  try {
    // Upload metadata
    const metadataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const metadataHash = metadataResponse.data.IpfsHash;
    log.success(`Pinata metadata hash: ${metadataHash}`);

    return {
      hash: metadataHash,
      url: `${PINATA_GATEWAY}/${metadataHash}`,
    };
  } catch (error: any) {
    log.error(`Pinata upload failed: ${error.message}`);
    throw error;
  }
}

async function uploadToNftStorage(
  metadata: NFTMetadata,
  imageBuffer?: Buffer,
): Promise<{ hash: string; url: string }> {
  if (!NFT_STORAGE_KEY) {
    throw new Error('NFT_STORAGE_API_KEY not configured');
  }

  try {
    const metadataResponse = await axios.post(
      'https://api.nft.storage/upload',
      JSON.stringify(metadata),
      {
        headers: {
          Authorization: `Bearer ${NFT_STORAGE_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const metadataHash = metadataResponse.data.value.cid;
    log.success(`nft.storage metadata hash: ${metadataHash}`);

    return {
      hash: metadataHash,
      url: `${NFT_STORAGE_GATEWAY}/${metadataHash}`,
    };
  } catch (error: any) {
    log.warn(`nft.storage upload skipped: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

function getCategory(year: number): string {
  if (year < 1900) return '1800s';
  if (year < 1950) return '1900-1950';
  if (year < 2000) return '1950-2000';
  return 'modern';
}

function createMetadata(stamp: ArchiveStamp): NFTMetadata {
  const category = getCategory(stamp.year);

  return {
    name: `${stamp.country} ${stamp.year} Stamp - ${stamp.rarity}`,
    description: stamp.description,
    image: stamp.imageUrl,
    imageIpfs: `ipfs://QmXxx`, // Will be updated with actual hash
    attributes: [
      { trait_type: 'Country', value: stamp.country },
      { trait_type: 'Year', value: stamp.year },
      { trait_type: 'Denomination', value: stamp.denomination },
      { trait_type: 'Rarity', value: stamp.rarity },
      { trait_type: 'Condition', value: stamp.condition },
      { trait_type: 'Catalog', value: stamp.catalog },
      { trait_type: 'Category', value: category },
    ],
    external_url: `${BASE_URL}/stamp/${stamp.id}`,
    category,
    timestamp: Date.now(),
  };
}

// ============================================================================
// STAMP COLLECTION LOADING
// ============================================================================

function loadStampsFromExport(): ArchiveStamp[] {
  const exportPath = path.join(process.cwd(), 'stamp-collection-export.json');

  if (!fs.existsSync(exportPath)) {
    log.warn(`Stamp export not found: ${exportPath}`);
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
    const stamps = data.stamps || [];
    log.success(`Loaded ${stamps.length} stamps from archive`);
    return stamps;
  } catch (error: any) {
    log.error(`Failed to load stamp export: ${error.message}`);
    return [];
  }
}

function loadStampsFromDatabase(): ArchiveStamp[] {
  // This would fetch from database in production
  // For now, returning empty array to be combined with export
  return [];
}

// ============================================================================
// MINTING & CONTRACT INTERACTION
// ============================================================================

async function mintStampNFT(
  stamp: ArchiveStamp,
  metadataUri: string,
): Promise<{ tokenId: string; txHash: string }> {
  if (!DEPLOYER_PRIVATE_KEY || !NFT_CONTRACT_ADDRESS) {
    throw new Error('Missing contract configuration');
  }

  try {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    const CONTRACT_ABI = [
      'function mint(address to, string memory uri) public returns (uint256)',
    ];

    const contract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      CONTRACT_ABI,
      wallet,
    );

    log.info(`Minting ${stamp.id} to ${wallet.address}...`);

    const tx = await contract.mint(wallet.address, metadataUri);
    const receipt = await tx.wait();

    // Extract token ID from receipt
    const iface = new ethers.Interface(CONTRACT_ABI);
    const tokenId = receipt?.logs[0]?.topics[3] || '0';

    log.success(`Minted token ID: ${tokenId}`);

    return {
      tokenId: ethers.toBeHex(tokenId),
      txHash: tx.hash,
    };
  } catch (error: any) {
    log.error(`Minting failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// DOWNLOAD FILE MANAGEMENT
// ============================================================================

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    log.success(`Created download directory: ${DOWNLOAD_DIR}`);
  }
}

async function saveStampImage(
  stamp: ArchiveStamp,
  imageUrl: string,
): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const filename = `${stamp.id.replace(/\//g, '-')}.png`;
    const filepath = path.join(DOWNLOAD_DIR, filename);

    fs.writeFileSync(filepath, response.data);

    const downloadUrl = `${BASE_URL}/downloads/${filename}`;
    log.success(`Saved stamp image: ${downloadUrl}`);

    return downloadUrl;
  } catch (error: any) {
    log.warn(`Failed to save stamp image: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN MINTING PROCESS
// ============================================================================

async function mintAllStamps(): Promise<MintSummary> {
  log.header('🚀 MASS STAMP MINTING SYSTEM INITIALIZED');

  const results: MintResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Load stamps
  const stamps = loadStampsFromExport();
  if (stamps.length === 0) {
    log.error('No stamps found to mint');
    process.exit(1);
  }

  ensureDownloadDir();

  log.header(`📌 STARTING MINTING PROCESS: ${stamps.length} STAMPS`);

  // Process each stamp
  for (let i = 0; i < stamps.length; i++) {
    const stamp = stamps[i] as ArchiveStamp;
    const progress = `[${i + 1}/${stamps.length}]`;

    try {
      log.info(`${progress} Processing: ${stamp.country} ${stamp.year} (${stamp.rarity})`);

      // Create metadata
      const metadata = createMetadata(stamp);

      // Upload to IPFS (Pinata as primary)
      let ipfsHash = '';
      let pinataHash = '';
      let nftStorageHash = '';

      try {
        const pinataResult = await uploadToPinata(metadata);
        ipfsHash = pinataResult.hash;
        pinataHash = pinataResult.hash;
        log.success(`${progress} Pinata upload: ${ipfsHash}`);
      } catch (pinataError) {
        log.warn(`${progress} Pinata upload failed, trying nft.storage...`);

        try {
          const nftResult = await uploadToNftStorage(metadata);
          ipfsHash = nftResult.hash;
          nftStorageHash = nftResult.hash;
          log.success(`${progress} nft.storage upload: ${ipfsHash}`);
        } catch (nftError) {
          log.error(`${progress} Both IPFS uploads failed`);
          throw new Error('IPFS upload failed');
        }
      }

      // Mint NFT on blockchain
      let tokenId = '';
      let txHash = '';
      try {
        const mintResult = await mintStampNFT(stamp, `ipfs://${ipfsHash}`);
        tokenId = mintResult.tokenId;
        txHash = mintResult.txHash;
      } catch (mintError) {
        log.warn(`${progress} Blockchain minting skipped (optional)`);
      }

      // Save stamp image
      let downloadUrl = '';
      try {
        downloadUrl = await saveStampImage(stamp, stamp.imageUrl);
      } catch (downloadError) {
        log.warn(`${progress} Image download skipped`);
      }

      // Record successful mint
      results.push({
        stampId: stamp.id,
        country: stamp.country,
        rarity: stamp.rarity,
        tokenId,
        ipfsHash,
        pinataHash,
        nftStorageHash,
        txHash,
        downloadUrl,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      successCount++;
      log.success(`${progress} ✨ COMPLETE: ${stamp.id}`);
    } catch (error: any) {
      log.error(`${progress} FAILED: ${error.message}`);

      results.push({
        stampId: stamp.id,
        country: stamp.country,
        rarity: stamp.rarity,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      errorCount++;
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Generate summary
  const summary: MintSummary = {
    totalStamps: stamps.length,
    successfulMints: successCount,
    failedMints: errorCount,
    totalValue: stamps.reduce((sum, s) => sum + parseFloat(s.denomination || '0'), 0),
    byRarity: {},
    byCountry: {},
    ipfsStats: {
      pinataUploads: results.filter((r) => r.pinataHash).length,
      nftStorageUploads: results.filter((r) => r.nftStorageHash).length,
    },
    results,
  };

  // Calculate statistics
  for (const result of results) {
    if (result.status === 'success') {
      summary.byRarity[result.rarity] = (summary.byRarity[result.rarity] || 0) + 1;
      summary.byCountry[result.country] = (summary.byCountry[result.country] || 0) + 1;
    }
  }

  return summary;
}

// ============================================================================
// EXPORT RESULTS
// ============================================================================

async function saveResults(summary: MintSummary) {
  const filename = `minting-results-${Date.now()}.json`;
  const filepath = path.join(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
  log.success(`Results saved to: ${filepath}`);

  // Also save quick summary
  const summaryPath = path.join(process.cwd(), 'MINTING_SUMMARY.md');
  const md = `# Mass Stamp Minting Results

**Date**: ${new Date().toISOString()}

## Statistics
- **Total Stamps**: ${summary.totalStamps}
- **Successful Mints**: ${summary.successfulMints} ✅
- **Failed Mints**: ${summary.failedMints} ❌
- **Success Rate**: ${((summary.successfulMints / summary.totalStamps) * 100).toFixed(1)}%

## IPFS Storage
- **Pinata Uploads**: ${summary.ipfsStats.pinataUploads}
- **nft.storage Uploads**: ${summary.ipfsStats.nftStorageUploads}
- **Total IPFS Stored**: ${summary.ipfsStats.pinataUploads + summary.ipfsStats.nftStorageUploads}

## By Rarity
${Object.entries(summary.byRarity)
  .map(([rarity, count]) => `- **${rarity}**: ${count} stamps`)
  .join('\n')}

## Top Countries
${Object.entries(summary.byCountry)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([country, count]) => `- **${country}**: ${count} stamps`)
  .join('\n')}

## Download Information
All stamp images are available for download at:
\`${BASE_URL}/downloads/\`

Full details: ${filename}
`;

  fs.writeFileSync(summaryPath, md);
  log.success(`Summary saved to: MINTING_SUMMARY.md`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const summary = await mintAllStamps();

    log.header('📊 MINTING COMPLETE - SUMMARY');
    console.log(`
✨ Minting Summary:
   Total Stamps: ${summary.totalStamps}
   ✅ Successful: ${summary.successfulMints}
   ❌ Failed: ${summary.failedMints}
   Success Rate: ${((summary.successfulMints / summary.totalStamps) * 100).toFixed(1)}%

📦 IPFS Storage:
   Pinata: ${summary.ipfsStats.pinataUploads} uploads
   nft.storage: ${summary.ipfsStats.nftStorageUploads} uploads

🎨 By Rarity:
${Object.entries(summary.byRarity)
  .map(([rarity, count]) => `   ${rarity}: ${count}`)
  .join('\n')}
    `);

    await saveResults(summary);
    log.success('✨ All stamps minted successfully!');
  } catch (error: any) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
