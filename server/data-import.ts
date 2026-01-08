/**
 * Data Collection and Import Tools
 * Handles bulk stamp imports, CSV parsing, image processing
 */

import * as csv from 'csv-parse/sync';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getDb } from './db';
import { stampArchive, partners } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Initialize S3 client
const s3 = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null;

export interface StampImportData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  country: string;
  issueYear: number;
  catalogNumber?: string;
  denomination?: string;
  color?: string;
  perforation?: string;
  watermark?: string;
  printingMethod?: string;
  designer?: string;
  quantity?: number;
  condition?: string;
  estimatedValue?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

export interface BulkImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row: number;
    stamp: string;
    error: string;
  }>;
  imported: Array<{
    id: number;
    name: string;
    imageHash: string;
  }>;
}

/**
 * Parse CSV file containing stamp data
 */
export async function parseStampCSV(csvContent: string): Promise<{
  stamps: StampImportData[];
  errors: string[];
}> {
  console.log('[Data Import] Parsing CSV...');

  const errors: string[] = [];
  let stamps: StampImportData[] = [];

  try {
    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    stamps = records.map((record: any, index: number) => {
      // Validate required fields
      if (!record.name) {
        errors.push(`Row ${index + 1}: Missing stamp name`);
      }
      if (!record.country) {
        errors.push(`Row ${index + 1}: Missing country`);
      }
      if (!record.issueYear || isNaN(parseInt(record.issueYear))) {
        errors.push(`Row ${index + 1}: Invalid issue year`);
      }

      return {
        name: record.name || '',
        nameAr: record.nameAr || record.name_ar,
        description: record.description,
        descriptionAr: record.descriptionAr || record.description_ar,
        country: record.country || '',
        issueYear: parseInt(record.issueYear || record.issue_year) || 0,
        catalogNumber: record.catalogNumber || record.catalog_number,
        denomination: record.denomination,
        color: record.color,
        perforation: record.perforation,
        watermark: record.watermark,
        printingMethod: record.printingMethod || record.printing_method,
        designer: record.designer,
        quantity: record.quantity ? parseInt(record.quantity) : undefined,
        condition: record.condition,
        estimatedValue: record.estimatedValue || record.estimated_value,
        imageUrl: record.imageUrl || record.image_url,
        category: record.category,
        tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
      };
    });
  } catch (error: any) {
    errors.push(`CSV parsing error: ${error.message}`);
  }

  return { stamps, errors };
}

/**
 * Parse JSON file containing stamp data
 */
export async function parseStampJSON(jsonContent: string): Promise<{
  stamps: StampImportData[];
  errors: string[];
}> {
  console.log('[Data Import] Parsing JSON...');

  const errors: string[] = [];
  let stamps: StampImportData[] = [];

  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      stamps = data;
    } else if (data.stamps && Array.isArray(data.stamps)) {
      stamps = data.stamps;
    } else {
      errors.push('Invalid JSON format: expected array or {stamps: []}');
    }

    // Validate each stamp
    stamps.forEach((stamp, index) => {
      if (!stamp.name) errors.push(`Stamp ${index}: Missing name`);
      if (!stamp.country) errors.push(`Stamp ${index}: Missing country`);
      if (!stamp.issueYear) errors.push(`Stamp ${index}: Missing issue year`);
    });
  } catch (error: any) {
    errors.push(`JSON parsing error: ${error.message}`);
  }

  return { stamps, errors };
}

/**
 * Download and process image from URL
 */
export async function downloadAndProcessImage(
  imageUrl: string,
  targetSize: { width: number; height: number } = { width: 2000, height: 2000 }
): Promise<{
  success: boolean;
  buffer?: Buffer;
  format?: string;
  dimensions?: { width: number; height: number };
  size?: number;
  error?: string;
}> {
  try {
    console.log('[Image Processing] Downloading:', imageUrl);

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if needed (maintain aspect ratio)
    let processedBuffer: Buffer = buffer;
    if (metadata.width && metadata.height) {
      if (metadata.width > targetSize.width || metadata.height > targetSize.height) {
        processedBuffer = Buffer.from(await image
          .resize(targetSize.width, targetSize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 95 })
          .toBuffer());
      }
    }

    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      success: true,
      buffer: processedBuffer,
      format: finalMetadata.format,
      dimensions: {
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      },
      size: processedBuffer.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate perceptual hash for duplicate detection
 */
export async function calculateImageHash(imageBuffer: Buffer): Promise<string> {
  try {
    // Resize to 8x8 and convert to grayscale for pHash
    const smallImage = await sharp(imageBuffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Calculate average pixel value
    let sum = 0;
    for (let i = 0; i < smallImage.length; i++) {
      sum += smallImage[i];
    }
    const average = sum / smallImage.length;

    // Generate hash: 1 if pixel > average, 0 otherwise
    let hash = '';
    for (let i = 0; i < smallImage.length; i++) {
      hash += smallImage[i] > average ? '1' : '0';
    }

    // Convert binary to hex
    return BigInt('0b' + hash).toString(16).padStart(16, '0');
  } catch (error) {
    // Fallback to simple MD5 hash
    return createHash('md5').update(imageBuffer).digest('hex');
  }
}

/**
 * Check if stamp is duplicate (by image hash or catalog number)
 */
export async function checkDuplicate(stamp: StampImportData, imageHash?: string): Promise<{
  isDuplicate: boolean;
  matchType?: 'exact_image' | 'similar_image' | 'catalog_number';
  existingStampId?: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn('[Duplicate Check] Database unavailable, skipping');
    return { isDuplicate: false };
  }

  // Check catalog number match
  if (stamp.catalogNumber) {
    const [existing] = await db
      .select()
      .from(stampArchive)
      .where(eq(stampArchive.catalog, stamp.catalogNumber))
      .limit(1);
    
    if (existing) {
      return {
        isDuplicate: true,
        matchType: 'catalog_number',
        existingStampId: existing.id,
      };
    }
  }

  // Check exact image hash match
  if (imageHash) {
    const [existing] = await db
      .select()
      .from(stampArchive)
      .where(eq(stampArchive.imageHash, imageHash))
      .limit(1);
    
    if (existing) {
      return {
        isDuplicate: true,
        matchType: 'exact_image',
        existingStampId: existing.id,
      };
    }
  }

  return {
    isDuplicate: false,
  };
}

/**
 * Auto-categorize stamp based on metadata
 */
export function categorizeStamp(stamp: StampImportData): string {
  const { name, description, issueYear, country, tags } = stamp;
  const text = `${name} ${description} ${tags?.join(' ')}`.toLowerCase();

  // Check for special categories
  if (text.includes('airmail') || text.includes('aviation')) return 'airmail';
  if (text.includes('postage due')) return 'postage_due';
  if (text.includes('commemorative') || text.includes('anniversary')) return 'commemorative';
  if (text.includes('definitive') || text.includes('regular')) return 'definitive';
  if (text.includes('charity') || text.includes('semi-postal')) return 'charity';
  if (text.includes('express') || text.includes('special delivery')) return 'express';
  if (text.includes('official') || text.includes('service')) return 'official';
  if (text.includes('revenue') || text.includes('fiscal')) return 'revenue';
  if (text.includes('military') || text.includes('field post')) return 'military';

  // Categorize by era
  if (issueYear < 1900) return 'classic';
  if (issueYear < 1950) return 'early_modern';
  if (issueYear < 2000) return 'modern';
  return 'contemporary';
}

/**
 * Enrich stamp data with geographic information
 */
export function enrichGeographicData(stamp: StampImportData): {
  continent: string;
  region: string;
  latitude?: number;
  longitude?: number;
} {
  // Country to continent mapping (simplified)
  const continentMap: Record<string, { continent: string; region: string; coords?: [number, number] }> = {
    'UK': { continent: 'Europe', region: 'Western Europe', coords: [51.5074, -0.1278] },
    'USA': { continent: 'North America', region: 'Northern America', coords: [38.8977, -77.0365] },
    'France': { continent: 'Europe', region: 'Western Europe', coords: [48.8566, 2.3522] },
    'Germany': { continent: 'Europe', region: 'Central Europe', coords: [52.5200, 13.4050] },
    'China': { continent: 'Asia', region: 'Eastern Asia', coords: [39.9042, 116.4074] },
    'Japan': { continent: 'Asia', region: 'Eastern Asia', coords: [35.6762, 139.6503] },
    'India': { continent: 'Asia', region: 'Southern Asia', coords: [28.6139, 77.2090] },
    'Brazil': { continent: 'South America', region: 'South America', coords: [-15.8267, -47.9218] },
    'Australia': { continent: 'Oceania', region: 'Australia and New Zealand', coords: [-35.2809, 149.1300] },
    'Egypt': { continent: 'Africa', region: 'Northern Africa', coords: [30.0444, 31.2357] },
  };

  const countryData = continentMap[stamp.country] || {
    continent: 'Unknown',
    region: 'Unknown',
  };

  return {
    continent: countryData.continent,
    region: countryData.region,
    latitude: countryData.coords?.[0],
    longitude: countryData.coords?.[1],
  };
}

/**
 * Bulk import stamps from parsed data
 */
export async function bulkImportStamps(
  stamps: StampImportData[],
  options: {
    downloadImages: boolean;
    checkDuplicates: boolean;
    autoEnrich: boolean;
    partnerId?: number;
  }
): Promise<BulkImportResult> {
  console.log('[Bulk Import] Starting import of', stamps.length, 'stamps');

  const result: BulkImportResult = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    imported: [],
  };

  for (let i = 0; i < stamps.length; i++) {
    const stamp = stamps[i];
    console.log(`[Bulk Import] Processing ${i + 1}/${stamps.length}: ${stamp.name}`);

    try {
      // Auto-enrich data
      if (options.autoEnrich) {
        const geoData = enrichGeographicData(stamp);
        const category = categorizeStamp(stamp);
        // Merge enriched data
      }

      // Download and process image
      let imageBuffer: Buffer | undefined;
      let imageHash: string | undefined;

      if (options.downloadImages && stamp.imageUrl) {
        const imageResult = await downloadAndProcessImage(stamp.imageUrl);
        
        if (imageResult.success && imageResult.buffer) {
          imageBuffer = imageResult.buffer;
          imageHash = await calculateImageHash(imageBuffer);

          // Check for duplicates
          if (options.checkDuplicates) {
            const dupCheck = await checkDuplicate(stamp, imageHash);
            if (dupCheck.isDuplicate) {
              console.log(`[Bulk Import] Duplicate found: ${stamp.name}`);
              result.duplicates++;
              result.errors.push({
                row: i + 1,
                stamp: stamp.name,
                error: `Duplicate of stamp #${dupCheck.existingStampId} (${dupCheck.matchType})`,
              });
              continue;
            }
          }
        } else {
          console.warn(`[Bulk Import] Failed to download image: ${imageResult.error}`);
        }
      }

      // Upload image to S3
      let s3ImageUrl: string | undefined;
      if (imageBuffer && s3 && process.env.AWS_S3_BUCKET) {
        try {
          const imageKey = `stamps/${Date.now()}-${imageHash || Math.random()}.webp`;
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: imageKey,
              Body: imageBuffer,
              ContentType: 'image/webp',
            })
          );
          s3ImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${imageKey}`;
          console.log(`[Bulk Import] Uploaded image to S3: ${s3ImageUrl}`);
        } catch (error) {
          console.error('[Bulk Import] S3 upload failed:', error);
        }
      }

      // Create stamp record in database
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const archiveId = `import-${Date.now()}-${i}`;
      const [insertResult] = await db.insert(stampArchive).values({
        archiveId,
        country: stamp.country,
        denomination: stamp.denomination || '0',
        year: stamp.issueYear,
        catalog: stamp.catalogNumber || '',
        condition: (stamp.condition?.toLowerCase() || 'used') as any,
        rarity: 'common',
        description: stamp.description || stamp.name,
        imageHash: imageHash || '',
        imageUrl: s3ImageUrl || stamp.imageUrl || '',
        usdValue: stamp.estimatedValue || '0',
        stampCoinValue: 10,
      });

      const stampId = (insertResult as any)?.insertId;

      // Link to partner if provided (would need partner stamps junction table)
      if (options.partnerId && stampId) {
        console.log(`[Bulk Import] Partner linking would happen here for #${options.partnerId}`);
        // Note: stampPartner table doesn't exist in schema
      }

      result.success++;
      result.imported.push({
        id: stampId || 0,
        name: stamp.name,
        imageHash: imageHash || '',
      });
    } catch (error: any) {
      console.error(`[Bulk Import] Failed to import ${stamp.name}:`, error);
      result.failed++;
      result.errors.push({
        row: i + 1,
        stamp: stamp.name,
        error: error.message,
      });
    }
  }

  console.log('[Bulk Import] Complete:', result.success, 'success,', result.failed, 'failed,', result.duplicates, 'duplicates');
  return result;
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  return `name,name_ar,description,country,issue_year,catalog_number,denomination,color,perforation,watermark,printing_method,designer,condition,estimated_value,image_url,category,tags
"1840 Penny Black","","First adhesive postage stamp in the world","UK",1840,"SG2","1d","Black","Imperforate","Small Crown","Line engraving","Rowland Hill","Used","500.00","https://example.com/penny-black.jpg","classic","historic,victorian,rare"
"1847 Mauritius Post Office Blue","","One of the rarest stamps","Mauritius",1847,"SG4","2d","Blue","Imperforate","","Copper plate","Joseph Osmond Barnard","Unused","1000000.00","https://example.com/mauritius.jpg","classic","rare,error"
"1918 Inverted Jenny","","Famous US airmail error","USA",1918,"C3a","24c","Blue and Red","Perf 11","","Flat plate","","Mint","2000000.00","https://example.com/jenny.jpg","airmail","error,rare"`;
}

/**
 * Validate image quality (resolution, format, file size)
 */
export async function validateImageQuality(imageBuffer: Buffer): Promise<{
  valid: boolean;
  warnings: string[];
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    dpi?: number;
  };
}> {
  const warnings: string[] = [];
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const format = metadata.format || 'unknown';
  const size = imageBuffer.length;

  // Check minimum resolution
  if (width < 1200 || height < 1200) {
    warnings.push(`Low resolution: ${width}x${height}. Recommended minimum: 1200x1200`);
  }

  // Check format
  if (!['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
    warnings.push(`Unusual format: ${format}. Recommended: JPEG, PNG, or WebP`);
  }

  // Check file size
  const sizeMB = size / (1024 * 1024);
  if (sizeMB > 20) {
    warnings.push(`Large file size: ${sizeMB.toFixed(2)}MB. Consider compressing.`);
  }
  if (sizeMB < 0.1) {
    warnings.push(`Very small file size: ${sizeMB.toFixed(2)}MB. May indicate low quality.`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    metadata: {
      width,
      height,
      format,
      size,
      dpi: metadata.density,
    },
  };
}
