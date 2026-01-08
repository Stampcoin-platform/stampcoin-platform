/**
 * Automated NFT Generation Pipeline
 * Orchestrates the complete workflow from stamp scraping to NFT minting
 */

import * as upuScraper from './upu-scraper';
import * as catalogIntegration from './catalog-integration';
import * as dataImport from './data-import';
import * as nftMinting from './nft-minting';
import * as aiAnalysis from './ai-analysis';
import { getDb } from './db';
import { stampArchive, stampNFT } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface PipelineConfig {
  sources: {
    upu?: {
      countries: string[];
      years?: number[];
    };
    manual?: {
      csvFile?: string;
      imageUrls?: string[];
    };
  };
  processing: {
    enrichWithCatalogs: boolean;
    performAIAnalysis: boolean;
    checkDuplicates: boolean;
    downloadImages: boolean;
    uploadToS3: boolean;
  };
  nft: {
    autoMint: boolean;
    blockchain: 'ethereum' | 'polygon';
    batchSize: number;
  };
  organization: {
    categories: string[];
    autoTag: boolean;
  };
}

export interface PipelineResult {
  totalProcessed: number;
  stampsImported: number;
  nftsMinted: number;
  errors: Array<{
    step: string;
    stamp: string;
    error: string;
  }>;
  categories: Record<string, number>;
}

/**
 * Run the complete pipeline
 */
export async function runNFTGenerationPipeline(
  config: PipelineConfig
): Promise<PipelineResult> {
  console.log('[Pipeline] Starting NFT generation pipeline');
  console.log('[Pipeline] Config:', JSON.stringify(config, null, 2));
  
  const result: PipelineResult = {
    totalProcessed: 0,
    stampsImported: 0,
    nftsMinted: 0,
    errors: [],
    categories: {},
  };
  
  try {
    // Step 1: Collect stamps from sources
    console.log('[Pipeline] Step 1: Collecting stamps from sources');
    const stamps = await collectStamps(config.sources);
    result.totalProcessed = stamps.length;
    console.log(`[Pipeline] Collected ${stamps.length} stamps`);
    
    // Step 2: Enrich with catalog data
    if (config.processing.enrichWithCatalogs) {
      console.log('[Pipeline] Step 2: Enriching with catalog data');
      const enriched = await catalogIntegration.batchEnrichStamps(stamps);
      stamps.splice(0, stamps.length, ...enriched);
      console.log(`[Pipeline] Enriched ${enriched.length} stamps`);
    }
    
    // Step 3: Import to database
    console.log('[Pipeline] Step 3: Importing stamps to database');
    const importResult = await dataImport.bulkImportStamps(stamps, {
      downloadImages: config.processing.downloadImages,
      checkDuplicates: config.processing.checkDuplicates,
      autoEnrich: true,
    });
    result.stampsImported = importResult.success;
    result.errors.push(...importResult.errors.map(e => ({
      step: 'import',
      stamp: e.stamp,
      error: e.error,
    })));
    console.log(`[Pipeline] Imported ${importResult.success} stamps`);
    
    // Step 4: AI Analysis (optional)
    if (config.processing.performAIAnalysis) {
      console.log('[Pipeline] Step 4: Running AI analysis');
      await performBatchAIAnalysis(importResult.imported);
    }
    
    // Step 5: Auto-mint NFTs
    if (config.nft.autoMint) {
      console.log('[Pipeline] Step 5: Minting NFTs');
      const mintResult = await batchMintNFTs(
        importResult.imported,
        config.nft.blockchain,
        config.nft.batchSize
      );
      result.nftsMinted = mintResult.success;
      result.errors.push(...mintResult.errors);
      console.log(`[Pipeline] Minted ${mintResult.success} NFTs`);
    }
    
    // Step 6: Organize into categories
    console.log('[Pipeline] Step 6: Organizing stamps');
    result.categories = await organizeStamps(importResult.imported, config.organization);
    
    console.log('[Pipeline] Pipeline completed successfully');
    console.log('[Pipeline] Results:', result);
    
    return result;
  } catch (error: any) {
    console.error('[Pipeline] Pipeline failed:', error);
    result.errors.push({
      step: 'pipeline',
      stamp: 'all',
      error: error.message,
    });
    return result;
  }
}

/**
 * Collect stamps from all configured sources
 */
async function collectStamps(sources: PipelineConfig['sources']): Promise<dataImport.StampImportData[]> {
  const stamps: dataImport.StampImportData[] = [];
  
  // Collect from UPU
  if (sources.upu) {
    console.log('[Pipeline] Collecting from UPU');
    for (const country of sources.upu.countries) {
      const years = sources.upu.years || [new Date().getFullYear()];
      for (const year of years) {
        const upuStamps = await upuScraper.scrapeUPUStamps({
          country,
          year,
          limit: 20,
        });
        stamps.push(...upuStamps.map(s => upuScraper.convertUPUToImport(s)));
      }
    }
  }
  
  // Collect from manual sources
  if (sources.manual?.csvFile) {
    console.log('[Pipeline] Collecting from CSV file');
    // Would parse CSV here
  }
  
  return stamps;
}

/**
 * Perform AI analysis on batch of stamps
 */
async function performBatchAIAnalysis(
  stamps: Array<{ id: number; name: string; imageHash: string }>
): Promise<void> {
  console.log(`[Pipeline] Analyzing ${stamps.length} stamps with AI`);
  
  const db = await getDb();
  if (!db) {
    console.warn('[Pipeline] Database unavailable, skipping AI analysis');
    return;
  }
  
  for (const stamp of stamps) {
    try {
      // Get stamp details from database
      const [stampData] = await db
        .select()
        .from(stampArchive)
        .where(eq(stampArchive.id, stamp.id))
        .limit(1);
      
      if (stampData?.imageUrl) {
        const analysis = await aiAnalysis.analyzeStampImage(stampData.imageUrl);
        console.log(`[Pipeline] AI analysis for ${stamp.name}: ${analysis.confidenceScore}% confidence`);
        
        // Store analysis results (could create a new table for this)
        // For now, just log
      }
    } catch (error: any) {
      console.error(`[Pipeline] AI analysis failed for ${stamp.name}:`, error.message);
    }
  }
}

/**
 * Batch mint NFTs from stamps
 */
async function batchMintNFTs(
  stamps: Array<{ id: number; name: string; imageHash: string }>,
  blockchain: 'ethereum' | 'polygon',
  batchSize: number
): Promise<{ success: number; errors: Array<{ step: string; stamp: string; error: string }> }> {
  console.log(`[Pipeline] Minting ${stamps.length} NFTs in batches of ${batchSize}`);
  
  const result = {
    success: 0,
    errors: [] as Array<{ step: string; stamp: string; error: string }>,
  };
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }
  
  for (let i = 0; i < stamps.length; i += batchSize) {
    const batch = stamps.slice(i, i + batchSize);
    
    for (const stamp of batch) {
      try {
        // Get full stamp data
        const [stampData] = await db
          .select()
          .from(stampArchive)
          .where(eq(stampArchive.id, stamp.id))
          .limit(1);
        
        if (!stampData) {
          continue;
        }
        
        // Mint NFT
        const mintResult = await nftMinting.mintNft({
          stampId: stamp.id,
          userId: 1, // System user
          blockchainNetwork: blockchain,
          imageUrl: stampData.imageUrl,
          title: `${stampData.country} ${stampData.year} - ${stampData.catalog}`,
          description: stampData.description || '',
          attributes: {
            country: stampData.country,
            year: stampData.year,
            rarity: stampData.rarity,
            condition: stampData.condition,
            denomination: stampData.denomination,
          },
        });
        
        if (mintResult.success) {
          // Store NFT in database
          await db.insert(stampNFT).values({
            archiveId: stampData.archiveId,
            serialNumber: `${stampData.country}-${stampData.year}-${String(i + 1).padStart(5, '0')}`,
            nftTokenId: mintResult.tokenId || '0',
            contractAddress: mintResult.contractAddress || '',
            blockchainNetwork: blockchain,
            ownerId: 1, // System user
            metadataUri: mintResult.metadataUri || '',
            imageUri: stampData.imageUrl,
            nftType: 'collectible',
          });
          
          result.success++;
          console.log(`[Pipeline] Minted NFT for ${stamp.name}: ${mintResult.tokenId}`);
        }
      } catch (error: any) {
        console.error(`[Pipeline] Minting failed for ${stamp.name}:`, error.message);
        result.errors.push({
          step: 'mint',
          stamp: stamp.name,
          error: error.message,
        });
      }
    }
    
    // Rate limiting between batches
    if (i + batchSize < stamps.length) {
      console.log('[Pipeline] Waiting between batches...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return result;
}

/**
 * Organize stamps into categories
 */
async function organizeStamps(
  stamps: Array<{ id: number; name: string; imageHash: string }>,
  organization: PipelineConfig['organization']
): Promise<Record<string, number>> {
  console.log('[Pipeline] Organizing stamps into categories');
  
  const categories: Record<string, number> = {};
  
  const db = await getDb();
  if (!db) {
    return categories;
  }
  
  // Count stamps by country
  for (const stamp of stamps) {
    const [stampData] = await db
      .select()
      .from(stampArchive)
      .where(eq(stampArchive.id, stamp.id))
      .limit(1);
    
    if (stampData) {
      const country = stampData.country;
      categories[country] = (categories[country] || 0) + 1;
    }
  }
  
  return categories;
}

/**
 * Quick start: Generate NFTs from popular countries
 */
export async function quickStartPipeline(): Promise<PipelineResult> {
  console.log('[Pipeline] Running quick start pipeline');
  
  const config: PipelineConfig = {
    sources: {
      upu: {
        countries: ['USA', 'GBR', 'FRA', 'DEU', 'JPN'],
        years: [new Date().getFullYear()],
      },
    },
    processing: {
      enrichWithCatalogs: true,
      performAIAnalysis: false, // Disable for speed
      checkDuplicates: true,
      downloadImages: true,
      uploadToS3: true,
    },
    nft: {
      autoMint: true,
      blockchain: 'polygon', // Cheaper gas fees
      batchSize: 10,
    },
    organization: {
      categories: ['country', 'year', 'theme'],
      autoTag: true,
    },
  };
  
  return runNFTGenerationPipeline(config);
}
