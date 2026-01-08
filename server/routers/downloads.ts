/**
 * Downloads Router
 * API endpoints for downloading stamped NFTs and retrieving download history
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const DOWNLOAD_DIR = path.join(process.cwd(), 'public', 'downloads');

export const downloadsRouter = router({
  /**
   * Get all available stamp downloads
   */
  listStamps: publicProcedure.query(async () => {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      return {
        stamps: [],
        totalCount: 0,
      };
    }

    const files = fs.readdirSync(DOWNLOAD_DIR);
    const stamps = files
      .filter((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
      .map((file) => {
        const stat = fs.statSync(path.join(DOWNLOAD_DIR, file));
        const id = file.replace(/\.[^.]+$/, '');
        return {
          id,
          filename: file,
          downloadUrl: `/downloads/${file}`,
          fileSize: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return {
      stamps,
      totalCount: stamps.length,
    };
  }),

  /**
   * Get stamp details by ID
   */
  getStampDetails: publicProcedure
    .input(z.object({ stampId: z.string() }))
    .query(async ({ input }: { input: { stampId: string } }) => {
      const filename = `${input.stampId.replace(/\//g, '-')}.png`;
      const filepath = path.join(DOWNLOAD_DIR, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error(`Stamp not found: ${input.stampId}`);
      }

      const stat = fs.statSync(filepath);

      return {
        id: input.stampId,
        filename,
        downloadUrl: `/downloads/${filename}`,
        fileSize: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        mimeType: 'image/png',
      };
    }),

  /**
   * Download stamp by ID (with tracking)
   */
  downloadStamp: publicProcedure
    .input(z.object({ stampId: z.string() }))
    .mutation(async ({ input }: { input: { stampId: string } }) => {
      const filename = `${input.stampId.replace(/\//g, '-')}.png`;
      const filepath = path.join(DOWNLOAD_DIR, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error(`Stamp not found: ${input.stampId}`);
      }

      // Log download (optional - could track in database)
      console.log(`Download: ${input.stampId} at ${new Date().toISOString()}`);

      const fileSize = fs.statSync(filepath).size;
      const fileBuffer = fs.readFileSync(filepath);

      return {
        success: true,
        filename,
        fileSize,
        base64: fileBuffer.toString('base64'),
        mimeType: 'image/png',
      };
    }),

  /**
   * Get recent NFT minting activity
   */
  getMintingActivity: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }: { input: { limit?: number; offset?: number } }) => {
      const summaryPath = path.join(process.cwd(), 'MINTING_SUMMARY.md');

      if (!fs.existsSync(summaryPath)) {
        return {
          activity: [],
          total: 0,
        };
      }

      // Parse minting results
      const resultsPath = path.join(process.cwd(), 'minting-results-latest.json');
      if (!fs.existsSync(resultsPath)) {
        return {
          activity: [],
          total: 0,
        };
      }

      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      const results = data.results || [];

      return {
        activity: results
          .reverse()
          .slice(input.offset || 0, (input.offset || 0) + (input.limit || 20)),
        total: results.length,
      };
    }),

  /**
   * Get minting statistics
   */
  getMintingStats: publicProcedure.query(async () => {
    const summaryPath = path.join(process.cwd(), 'MINTING_SUMMARY.md');

    if (!fs.existsSync(summaryPath)) {
      return {
        totalStamps: 0,
        successfulMints: 0,
        failedMints: 0,
        successRate: 0,
        ipfsStorage: {
          pinata: 0,
          nftStorage: 0,
        },
        byRarity: {},
        byCountry: {},
      };
    }

    const resultsPath = path.join(process.cwd(), 'minting-results-latest.json');
    if (!fs.existsSync(resultsPath)) {
      return {
        totalStamps: 0,
        successfulMints: 0,
        failedMints: 0,
        successRate: 0,
        ipfsStorage: {
          pinata: 0,
          nftStorage: 0,
        },
        byRarity: {},
        byCountry: {},
      };
    }

    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

    return {
      totalStamps: data.totalStamps || 0,
      successfulMints: data.successfulMints || 0,
      failedMints: data.failedMints || 0,
      successRate: data.totalStamps
        ? ((data.successfulMints / data.totalStamps) * 100).toFixed(1)
        : 0,
      ipfsStorage: {
        pinata: data.ipfsStats?.pinataUploads || 0,
        nftStorage: data.ipfsStats?.nftStorageUploads || 0,
      },
      byRarity: data.byRarity || {},
      byCountry: data.byCountry || {},
    };
  }),

  /**
   * Batch download stamps as ZIP
   */
  batchDownload: publicProcedure
    .input(
      z.object({
        stampIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }: { input: { stampIds: string[] } }) => {
      const available = [];
      const missing = [];

      for (const stampId of input.stampIds) {
        const filename = `${stampId.replace(/\//g, '-')}.png`;
        const filepath = path.join(DOWNLOAD_DIR, filename);

        if (fs.existsSync(filepath)) {
          available.push(stampId);
        } else {
          missing.push(stampId);
        }
      }

      return {
        available,
        missing,
        totalRequested: input.stampIds.length,
        availableCount: available.length,
        missingCount: missing.length,
        downloadUrl: `/batch-download?ids=${available.join(',')}`,
      };
    }),

  /**
   * Search stamps by country or rarity
   */
  searchStamps: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        rarity: z.string().optional(),
        year: z.number().optional(),
      }),
    )
    .query(async ({ input }: { input: { country?: string; rarity?: string; year?: number } }) => {
      // This would search against minting results
      const resultsPath = path.join(process.cwd(), 'minting-results-latest.json');

      if (!fs.existsSync(resultsPath)) {
        return { stamps: [], total: 0 };
      }

      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      let stamps = data.results || [];

      if (input.country) {
        stamps = stamps.filter(
          (s: any) =>
            s.country.toLowerCase().includes(input.country!.toLowerCase()),
        );
      }

      if (input.rarity) {
        stamps = stamps.filter((s: any) =>
          s.rarity.toLowerCase().includes(input.rarity!.toLowerCase()),
        );
      }

      return {
        stamps: stamps.slice(0, 50),
        total: stamps.length,
      };
    }),
});
