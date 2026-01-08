/**
 * Stamp Archive System
 * Downloads stamps from Internet Archive and manages digital archive
 */

import { getDb } from './db';
import { stampArchive, stampNFT, stampPricing } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';

interface StampMetadata {
  archiveId: string;
  country: string;
  denomination: number;
  year: number;
  catalog: string;
  condition: 'mint' | 'used' | 'fine' | 'very_fine';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  description: string;
  imageUrl: string;
}

/**
 * Download stamp from Internet Archive
 */
export async function downloadStampFromArchive(
  archiveId: string,
  imageUrl: string,
): Promise<Buffer> {
  console.log(`Downloading stamp: ${archiveId}`);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Process stamp image to high resolution NFT quality (2400x3000 DPI)
 */
export async function processStampImage(
  imageBuffer: Buffer,
  quality: 'standard' | 'premium' | 'archive' = 'premium',
): Promise<Buffer> {
  const dimensions = {
    standard: { width: 1200, height: 1500 }, // 600 DPI
    premium: { width: 2400, height: 3000 },  // 1200 DPI
    archive: { width: 4800, height: 6000 },  // 2400 DPI (Master)
  };

  const dim = dimensions[quality];

  let image = sharp(imageBuffer);
  
  // Get metadata
  const metadata = await image.metadata();
  
  // Enhance image quality
  image = image
    .resize(dim.width, dim.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .normalize() // Auto contrast
    .sharpen({ sigma: 2 }) // Sharpen
    .modulate({
      saturation: 1.1, // Enhance colors
    });

  // Convert to PNG for lossless quality
  return image.png({ quality: 100 }).toBuffer();
}

/**
 * Calculate stamp value based on rarity, condition, year, and market data
 */
export function calculateStampValue(metadata: StampMetadata): {
  baseValue: number;
  condition_multiplier: number;
  rarity_multiplier: number;
  final_value: number;
  currency: number; // StampCoin equivalent
} {
  // Base value by denomination and year
  const baseValue = metadata.denomination * (2100 - metadata.year) * 0.1;

  // Condition multiplier
  const conditionMultipliers = {
    'mint': 2.5,
    'very_fine': 2.0,
    'fine': 1.5,
    'used': 0.8,
  };
  const condition_multiplier = conditionMultipliers[metadata.condition] || 1.0;

  // Rarity multiplier
  const rarityMultipliers = {
    'common': 1.0,
    'uncommon': 2.5,
    'rare': 5.0,
    'very_rare': 10.0,
    'legendary': 25.0,
  };
  const rarity_multiplier = rarityMultipliers[metadata.rarity] || 1.0;

  // Calculate final USD value
  const final_value = baseValue * condition_multiplier * rarity_multiplier;

  // 1 StampCoin = $0.10 (adjustable)
  const currency = Math.ceil(final_value / 0.1);

  return {
    baseValue: Math.round(baseValue * 100) / 100,
    condition_multiplier,
    rarity_multiplier,
    final_value: Math.round(final_value * 100) / 100,
    currency,
  };
}

/**
 * Create stamp archive entry in database
 */
export async function createStampArchiveEntry(
  metadata: StampMetadata,
  imageHash: string,
  processedImageUrl: string,
) {
  const pricing = calculateStampValue(metadata);
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(stampArchive).values({
    archiveId: metadata.archiveId,
    country: metadata.country,
    denomination: metadata.denomination.toString(),
    year: metadata.year,
    catalog: metadata.catalog,
    condition: metadata.condition,
    rarity: metadata.rarity,
    description: metadata.description,
    imageHash,
    imageUrl: processedImageUrl,
    originalImageUrl: metadata.imageUrl,
    usdValue: pricing.final_value.toString(),
    stampCoinValue: pricing.currency,
  });

  const [result] = await db
    .select()
    .from(stampArchive)
    .where(eq(stampArchive.archiveId, metadata.archiveId))
    .limit(1);

  return result;
}

/**
 * Generate serial number for NFT based on archive entry
 */
export function generateSerialNumber(
  archiveId: string,
  index: number,
): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `STAMP-${archiveId.substring(0, 4)}-${index.toString().padStart(6, '0')}-${timestamp}-${randomPart}`;
}

/**
 * Batch import stamps from Internet Archive collection
 */
export async function batchImportStamps(
  stamps: StampMetadata[],
): Promise<any[]> {
  const results = [];

  for (const stamp of stamps) {
    try {
      console.log(`Processing: ${stamp.country} ${stamp.denomination} (${stamp.year})`);

      // Skip image download for now - just store metadata and URLs
      // In production, we would download, process, and upload to IPFS
      const imageHash = `ipfs://QmStamp${stamp.archiveId.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Create archive entry
      const entry = await createStampArchiveEntry(
        stamp,
        imageHash,
        stamp.imageUrl, // Use original URL for now
      );

      results.push({
        success: true,
        archiveId: stamp.archiveId,
        entry,
        serialNumber: generateSerialNumber(stamp.archiveId, results.length + 1),
      });

      console.log(`✅ Imported: ${entry.archiveId}`);
    } catch (error) {
      console.error(`❌ Failed to import ${stamp.archiveId}:`, error);
      results.push({
        success: false,
        archiveId: stamp.archiveId,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Get total archive statistics
 */
export async function getArchiveStats() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(stampArchive);

  const totalValue = await db
    .select({ sum: sql<number>`sum("usdValue")` })
    .from(stampArchive);

  const totalCurrency = await db
    .select({ sum: sql<number>`sum("stampCoinValue")` })
    .from(stampArchive);

  const byRarity = await db
    .select({
      rarity: stampArchive.rarity,
      count: sql<number>`count(*)`,
      avgValue: sql<number>`avg("usdValue")`,
    })
    .from(stampArchive)
    .groupBy(stampArchive.rarity);

  const byCountry = await db
    .select({
      country: stampArchive.country,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum("usdValue")`,
    })
    .from(stampArchive)
    .groupBy(stampArchive.country);

  return {
    totalStamps: total[0]?.count || 0,
    totalUSDValue: totalValue[0]?.sum || 0,
    totalStampCoins: totalCurrency[0]?.sum || 0,
    byRarity,
    byCountry,
  };
}

/**
 * Create NFT from stamp archive entry
 */
export async function createNFTFromStamp(
  stampArchiveId: string,
  walletAddress: string,
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [stamp] = await db
    .select()
    .from(stampArchive)
    .where(eq(stampArchive.archiveId, stampArchiveId))
    .limit(1);

  if (!stamp) {
    throw new Error('Stamp not found');
  }

  const serialNumber = generateSerialNumber(stamp.archiveId, stamp.id);

  const nftMetadata = {
    name: `${stamp.country} ${stamp.denomination} - ${stamp.year}`,
    description: stamp.description,
    image: stamp.imageUrl,
    attributes: [
      { trait_type: 'Country', value: stamp.country },
      { trait_type: 'Denomination', value: stamp.denomination },
      { trait_type: 'Year', value: stamp.year },
      { trait_type: 'Condition', value: stamp.condition },
      { trait_type: 'Rarity', value: stamp.rarity },
      { trait_type: 'Catalog', value: stamp.catalog },
      { trait_type: 'Serial Number', value: serialNumber },
      { trait_type: 'USD Value', value: stamp.usdValue },
      { trait_type: 'StampCoin Value', value: stamp.stampCoinValue },
    ],
  };

  // In production, this would mint the NFT on chain
  return {
    serialNumber,
    metadata: nftMetadata,
    stampCoinValue: stamp.stampCoinValue,
    walletAddress,
  };
}

export default {
  downloadStampFromArchive,
  processStampImage,
  calculateStampValue,
  createStampArchiveEntry,
  generateSerialNumber,
  batchImportStamps,
  getArchiveStats,
  createNFTFromStamp,
};
