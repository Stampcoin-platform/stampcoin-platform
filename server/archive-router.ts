/**
 * Archive Stamp tRPC Routes
 * Handles stamp archive management, NFT minting, and currency distribution
 */

import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import * as archiveService from './stamp-archive';
import * as archiveDownloader from './archive-downloader';
import * as nftPipeline from './nft-pipeline';
import * as seedData from './seed-stamp-data';
import { getDb } from './db';
import {
  stampArchive,
  stampNFT,
  stampPricing,
  platformCurrency,
  currencyDistribution,
} from '../drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';

/**
 * Archive stamp router - manages digital stamp collection
 */
export const archiveRouter = router({
  /**
   * Get archive statistics
   */
  getStats: publicProcedure.query(async () => {
    try {
      const stats = await archiveService.getArchiveStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error getting archive stats:', error);
      return {
        success: false,
        error: 'Failed to fetch statistics',
      };
    }
  }),

  /**
   * List all stamps in archive with pagination
   */
  listStamps: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']).optional(),
        country: z.string().optional(),
        minYear: z.number().optional(),
        maxYear: z.number().optional(),
      }),
    )
    .query(async (opts) => {
      const { page, limit, rarity, country, minYear, maxYear } = opts.input;
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const safePage = Math.max(page, 1);
      const offset = (safePage - 1) * safeLimit;
      const countryTerm = country?.trim() || undefined;
      
      // Validate and swap year range if needed
      let minYearValue = minYear && minYear > 0 ? minYear : undefined;
      let maxYearValue = maxYear && maxYear > 0 ? maxYear : undefined;
      
      if (minYearValue && maxYearValue && minYearValue > maxYearValue) {
        [minYearValue, maxYearValue] = [maxYearValue, minYearValue];
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }
        const conditions: any[] = [];

        if (rarity) {
          conditions.push(eq(stampArchive.rarity, rarity));
        }
        if (countryTerm) {
          conditions.push(sql`country LIKE ${`%${countryTerm}%`}`);
        }
        if (minYearValue) {
          conditions.push(sql`year >= ${minYearValue}`);
        }
        if (maxYearValue) {
          conditions.push(sql`year <= ${maxYearValue}`);
        }

        let query: any = db.select().from(stampArchive);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const stamps = await query.limit(safeLimit).offset(offset);

        let countQuery: any = db.select({ count: sql<number>`count(*)` }).from(stampArchive);
        if (conditions.length > 0) {
          countQuery = countQuery.where(and(...conditions));
        }
        const countResult = await countQuery;
        const total = countResult[0]?.count || 0;

        return {
          success: true,
          data: stamps,
          pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
          },
        };
      } catch (error) {
        console.error('Error listing stamps:', error);
        return {
          success: false,
          error: 'Failed to list stamps',
        };
      }
    }),

  /**
   * Get single stamp details with pricing
   */
  getStamp: publicProcedure
    .input(z.object({ id: z.number().or(z.string()) }))
    .query(async (opts) => {
      const id = typeof opts.input.id === 'string' ? opts.input.id : String(opts.input.id);

      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }
        const [stamp] = await db
          .select()
          .from(stampArchive)
          .where(eq(stampArchive.archiveId, id))
          .limit(1);

        if (!stamp) {
          return {
            success: false,
            error: 'Stamp not found',
          };
        }

        const pricing = await db
          .select()
          .from(stampPricing)
          .where(eq(stampPricing.archiveId, id));

        const nfts = await db
          .select()
          .from(stampNFT)
          .where(eq(stampNFT.archiveId, id));

        return {
          success: true,
          data: {
            ...stamp,
            pricing,
            nft: nfts,
          },
        };
      } catch (error) {
        console.error('Error getting stamp:', error);
        return {
          success: false,
          error: 'Failed to fetch stamp',
        };
      }
    }),

  /**
   * Import stamps from sample archive (admin only)
   */
  importSampleStamps: protectedProcedure
    .input(
      z.object({
        count: z.number().default(20),
      }),
    )
    .mutation(async (opts) => {
      if (opts.ctx.user?.role !== 'admin') {
        throw new Error('Only admins can import stamps');
      }

      try {
        const samples = archiveDownloader.getSampleStamps(opts.input.count);
        const stampsWithArchiveId = samples.map((stamp, index) => ({
          ...stamp,
          archiveId: `stamp-${Date.now()}-${index}`,
          denomination: typeof stamp.denomination === 'string' ? parseFloat(stamp.denomination) : stamp.denomination,
        }));
        const results = await archiveService.batchImportStamps(stampsWithArchiveId);

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        return {
          success: true,
          imported: successCount,
          failed: failureCount,
          total: results.length,
          results,
        };
      } catch (error) {
        console.error('Error importing stamps:', error);
        throw error;
      }
    }),

  /**
   * Calculate pricing for a stamp
   */
  calculatePrice: publicProcedure
    .input(
      z.object({
        denomination: z.number(),
        year: z.number(),
        condition: z.enum(['mint', 'used', 'fine', 'very_fine']),
        rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']),
      }),
    )
    .query((opts) => {
      const metadata = {
        archiveId: 'temp',
        country: 'Unknown',
        denomination: opts.input.denomination,
        year: opts.input.year,
        catalog: '',
        condition: opts.input.condition,
        rarity: opts.input.rarity,
        description: '',
        imageUrl: '',
      };

      try {
        const pricing = archiveService.calculateStampValue(metadata);
        return {
          success: true,
          data: pricing,
        };
      } catch (error) {
        console.error('Error calculating price:', error);
        return {
          success: false,
          error: 'Failed to calculate price',
        };
      }
    }),

  /**
   * Mint NFT from stamp
   */
  mintNFT: protectedProcedure
    .input(
      z.object({
        stampArchiveId: z.string(),
        walletAddress: z.string().optional(),
      }),
    )
    .mutation(async (opts) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }
        const nftData = await archiveService.createNFTFromStamp(
          opts.input.stampArchiveId,
          opts.input.walletAddress || opts.ctx.user!.openId,
        );

        // Store NFT in database
        const nftResult = await db.insert(stampNFT).values({
          archiveId: opts.input.stampArchiveId,
          serialNumber: nftData.serialNumber,
          nftTokenId: '0', // Will be updated after actual minting
          contractAddress: process.env.NFT_CONTRACT_ADDRESS || '',
          blockchainNetwork: process.env.NFT_CHAIN_ID === '1' ? 'ethereum' : 'polygon',
          ownerId: opts.ctx.user!.id,
          ownerAddress: opts.input.walletAddress,
          metadataUri: 'ipfs://temp', // Will be updated with actual IPFS hash
          imageUri: 'ipfs://temp',
          nftType: 'collectible',
        });

        const nftId = (nftResult as any)?.insertId;
        const [insertedNft] = nftId
          ? await db.select().from(stampNFT).where(eq(stampNFT.id, nftId)).limit(1)
          : [];

        await db.insert(currencyDistribution).values({
          userId: opts.ctx.user!.id,
          archiveId: opts.input.stampArchiveId,
          nftId: nftId ?? null,
          distributionType: 'mint',
          amount: nftData.stampCoinValue,
          status: 'completed',
        });

        return {
          success: true,
          data: {
            nft: insertedNft ?? null,
            stampCoins: nftData.stampCoinValue,
            serialNumber: nftData.serialNumber,
          },
        };
      } catch (error) {
        console.error('Error minting NFT:', error);
        throw error;
      }
    }),

  /**
   * Get platform currency stats
   */
  getCurrencyStats: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }
      const [currency] = await db.select().from(platformCurrency).limit(1);

      if (!currency) {
        // Create initial currency record
        const initial = await db.insert(platformCurrency).values({
          currencyName: 'StampCoin',
          currencySymbol: 'STMP',
          totalSupply: 0,
          circulatingSupply: 0,
          maxSupply: 1000000,
          burnedSupply: 0,
          priceUSD: '0.1000',
        });

        return {
          success: true,
          data: {
            id: (initial as any)?.insertId ?? 0,
            currencyName: 'StampCoin',
            currencySymbol: 'STMP',
            totalSupply: 0,
            circulatingSupply: 0,
            maxSupply: 1000000,
            burnedSupply: 0,
            priceUSD: '0.1000',
          },
        };
      }

      return {
        success: true,
        data: currency,
      };
    } catch (error) {
      console.error('Error getting currency stats:', error);
      return {
        success: false,
        error: 'Failed to fetch currency stats',
      };
    }
  }),

  /**
   * Get currency distribution breakdown
   */
  getCurrencyDistribution: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }
      const distribution = await db
        .select({
          type: currencyDistribution.distributionType,
          count: sql<number>`count(*)`,
          total: sql<number>`sum(amount)`,
        })
        .from(currencyDistribution)
        .groupBy(currencyDistribution.distributionType);

      const byStatus = await db
        .select({
          status: currencyDistribution.status,
          count: sql<number>`count(*)`,
          total: sql<number>`sum(amount)`,
        })
        .from(currencyDistribution)
        .groupBy(currencyDistribution.status);

      return {
        success: true,
        data: {
          byType: distribution,
          byStatus,
        },
      };
    } catch (error) {
      console.error('Error getting distribution:', error);
      return {
        success: false,
        error: 'Failed to fetch distribution',
      };
    }
  }),

  /**
   * Get user's NFTs and StampCoin balance
   */
  getUserAssets: protectedProcedure.query(async (opts) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }
      const nfts = await db.select().from(stampNFT).where(eq(stampNFT.ownerId, opts.ctx.user!.id));

      const coinBalance = await db
        .select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(currencyDistribution)
        .where(eq(currencyDistribution.userId, opts.ctx.user!.id));

      return {
        success: true,
        data: {
          nfts,
          stampCoinBalance: coinBalance[0]?.total || 0,
        }
      };
    } catch (error) {
      console.error('Error getting user assets:', error);
      throw error;
    }
  }),

  /**
   * Search stamps by criteria
   */
  searchStamps: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        filters: z
          .object({
            country: z.string().optional(),
            rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']).optional(),
            minYear: z.number().optional(),
            maxYear: z.number().optional(),
            minPrice: z.number().optional(),
            maxPrice: z.number().optional(),
          })
          .optional(),
      }),
    )
    .query(async (opts) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }
        // This would typically use full-text search
        // For now, simple filter-based search
        const { query, filters } = opts.input;

        let dbQuery: any = db.select().from(stampArchive);

        if (query) {
          dbQuery = dbQuery.where(
            sql`description LIKE ${`%${query}%`} OR country LIKE ${`%${query}%`}`,
          );
        }

        if (filters?.country) {
          dbQuery = dbQuery.where(
            sql`country LIKE ${`%${filters.country}%`}`,
          );
        }

        if (filters?.rarity) {
          dbQuery = dbQuery.where(eq(stampArchive.rarity, filters.rarity));
        }

        if (filters?.minYear) {
          dbQuery = dbQuery.where(sql`year >= ${filters.minYear}`);
        }

        if (filters?.maxYear) {
          dbQuery = dbQuery.where(sql`year <= ${filters.maxYear}`);
        }

        if (filters?.minPrice) {
          dbQuery = dbQuery.where(sql`usdValue >= ${filters.minPrice}`);
        }

        if (filters?.maxPrice) {
          dbQuery = dbQuery.where(sql`usdValue <= ${filters.maxPrice}`);
        }

        const results = await dbQuery.limit(100);

        return {
          success: true,
          data: results,
          count: results.length,
        };
      } catch (error) {
        console.error('Error searching stamps:', error);
        return {
          success: false,
          error: 'Search failed',
        };
      }
    }),

  /**
   * Run NFT generation pipeline from UPU
   */
  runNFTPipeline: protectedProcedure
    .input(
      z.object({
        countries: z.array(z.string()).default(['USA', 'GBR', 'FRA']),
        years: z.array(z.number()).optional(),
        enrichWithCatalogs: z.boolean().default(true),
        autoMint: z.boolean().default(false),
        blockchain: z.enum(['ethereum', 'polygon']).default('polygon'),
      }),
    )
    .mutation(async (opts) => {
      if (opts.ctx.user?.role !== 'admin') {
        throw new Error('Only admins can run the NFT pipeline');
      }

      try {
        const config: nftPipeline.PipelineConfig = {
          sources: {
            upu: {
              countries: opts.input.countries,
              years: opts.input.years || [new Date().getFullYear()],
            },
          },
          processing: {
            enrichWithCatalogs: opts.input.enrichWithCatalogs,
            performAIAnalysis: false,
            checkDuplicates: true,
            downloadImages: true,
            uploadToS3: true,
          },
          nft: {
            autoMint: opts.input.autoMint,
            blockchain: opts.input.blockchain,
            batchSize: 10,
          },
          organization: {
            categories: ['country', 'year'],
            autoTag: true,
          },
        };

        const result = await nftPipeline.runNFTGenerationPipeline(config);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error running NFT pipeline:', error);
        throw error;
      }
    }),

  /**
   * Quick start pipeline
   */
  quickStartPipeline: protectedProcedure.mutation(async (opts) => {
    if (opts.ctx.user?.role !== 'admin') {
      throw new Error('Only admins can run the pipeline');
    }

    try {
      const result = await nftPipeline.quickStartPipeline();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error running quick start:', error);
      throw error;
    }
  }),

  /**
   * Get stamps organized by category
   */
  getStampsByCategory: publicProcedure
    .input(
      z.object({
        category: z.enum(['country', 'year', 'rarity', 'theme']),
        value: z.string().optional(),
      }),
    )
    .query(async (opts) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        let query: any = db.select().from(stampArchive);

        if (opts.input.category === 'country' && opts.input.value) {
          query = query.where(eq(stampArchive.country, opts.input.value));
        } else if (opts.input.category === 'year' && opts.input.value) {
          query = query.where(eq(stampArchive.year, parseInt(opts.input.value)));
        } else if (opts.input.category === 'rarity' && opts.input.value) {
          query = query.where(eq(stampArchive.rarity, opts.input.value as any));
        }

        const results = await query.limit(100);

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error('Error getting stamps by category:', error);
        return {
          success: false,
          error: 'Failed to fetch stamps',
        };
      }
    }),

  /**
   * Get available categories with counts
   */
  getCategories: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [countries, years, rarities] = await Promise.all([
        db
          .select({
            category: stampArchive.country,
            count: sql<number>`count(*)`,
          })
          .from(stampArchive)
          .groupBy(stampArchive.country),
        db
          .select({
            category: stampArchive.year,
            count: sql<number>`count(*)`,
          })
          .from(stampArchive)
          .groupBy(stampArchive.year),
        db
          .select({
            category: stampArchive.rarity,
            count: sql<number>`count(*)`,
          })
          .from(stampArchive)
          .groupBy(stampArchive.rarity),
      ]);

      return {
        success: true,
        data: {
          countries,
          years,
          rarities,
        },
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        error: 'Failed to fetch categories',
      };
    }
  }),

  /**
   * Admin: Populate database with seed stamp data
   */
  seedDatabase: protectedProcedure.mutation(async (opts) => {
    if (opts.ctx.user?.role !== 'admin') {
      throw new Error('Only admins can seed the database');
    }

    try {
      console.log('Starting database seeding...');
      const result = await seedData.seedStampDatabase();
      
      return {
        success: true,
        data: result,
        message: `Successfully imported ${result.success} stamps into database`,
      };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }),

  /**
   * Get database population status
   */
  getDatabaseStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [stampCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stampArchive);

      const [priceCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stampPricing);

      const [nftCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stampNFT);

      const [currency] = await db
        .select()
        .from(platformCurrency)
        .limit(1);

      return {
        success: true,
        data: {
          stampsInArchive: stampCount?.count || 0,
          priceRecords: priceCount?.count || 0,
          nftsMinted: nftCount?.count || 0,
          currency: currency || null,
          populated: (stampCount?.count || 0) > 0,
        },
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return {
        success: false,
        error: 'Failed to fetch database status',
      };
    }
  }),
});
