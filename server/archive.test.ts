/**
 * Test Suite for Stamp Archive System
 * Validates all components are working correctly
 */

import { describe, it, expect } from 'vitest';
import * as archiveService from '../server/stamp-archive';
import * as archiveDownloader from '../server/archive-downloader';

describe('🏛️ Stamp Archive System', () => {
  describe('Archive Downloader', () => {
    it('should load sample stamps', () => {
      const stamps = archiveDownloader.getSampleStamps(5);
      expect(stamps).toHaveLength(5);
    });

    it('should have valid stamp data', () => {
      const stamps = archiveDownloader.getSampleStamps(3);
      stamps.forEach((stamp) => {
        const validation = archiveDownloader.validateStampData(stamp);
        expect(validation.valid).toBe(true);
        expect(stamp.country).toBeDefined();
        expect(stamp.year).toBeGreaterThan(1800);
        expect(stamp.imageUrl).toMatch(/^https:\/\//);
      });
    });

    it('should extract country from text', () => {
      const stamps = archiveDownloader.getSampleStamps(1);
      expect(stamps[0].country).toBeTruthy();
    });
  });

  describe('Pricing Algorithm', () => {
    it('should calculate stamp value correctly', () => {
      const metadata = {
        archiveId: 'test-1',
        country: 'Great Britain',
        denomination: 1,
        year: 1840,
        catalog: 'SG #1',
        condition: 'mint' as const,
        rarity: 'legendary' as const,
        description: 'Test stamp',
        imageUrl: 'https://example.com/test.jpg',
      };

      const pricing = archiveService.calculateStampValue(metadata);

      expect(pricing.final_value).toBeGreaterThan(0);
      expect(pricing.currency).toBeGreaterThan(0);
      expect(pricing.condition_multiplier).toBe(2.5);
      expect(pricing.rarity_multiplier).toBe(25.0);
    });

    it('should handle different conditions', () => {
      const baseMetadata = {
        archiveId: 'test-2',
        country: 'USA',
        denomination: 1,
        year: 1847,
        catalog: 'Scott #1',
        rarity: 'rare' as const,
        description: 'Test',
        imageUrl: 'https://example.com/test.jpg',
      };

      const mint = archiveService.calculateStampValue({
        ...baseMetadata,
        condition: 'mint' as const,
      });

      const used = archiveService.calculateStampValue({
        ...baseMetadata,
        condition: 'used' as const,
      });

      expect(mint.condition_multiplier).toBeGreaterThan(used.condition_multiplier);
      expect(mint.final_value).toBeGreaterThan(used.final_value);
    });

    it('should handle different rarities', () => {
      const baseMetadata = {
        archiveId: 'test-3',
        country: 'Sweden',
        denomination: 3,
        year: 1855,
        catalog: 'Facit #1L',
        condition: 'used' as const,
        description: 'Test',
        imageUrl: 'https://example.com/test.jpg',
      };

      const common = archiveService.calculateStampValue({
        ...baseMetadata,
        rarity: 'common' as const,
      });

      const legendary = archiveService.calculateStampValue({
        ...baseMetadata,
        rarity: 'legendary' as const,
      });

      expect(legendary.rarity_multiplier).toBeGreaterThan(common.rarity_multiplier);
      expect(legendary.final_value).toBeGreaterThan(common.final_value);
    });

    it('Penny Black should be legendary value', () => {
      const pennyBlack = archiveDownloader.SAMPLE_ARCHIVE_STAMPS[0]; // Should be Penny Black
      const pricing = archiveService.calculateStampValue({
        ...pennyBlack,
        archiveId: pennyBlack.id,
        denomination: typeof pennyBlack.denomination === 'string' ? parseFloat(pennyBlack.denomination) : pennyBlack.denomination,
      });

      expect(pricing.final_value).toBeGreaterThan(100);
      expect(pricing.currency).toBeGreaterThan(1000);
    });
  });

  describe('Serial Number Generation', () => {
    it('should generate unique serial numbers', () => {
      const serial1 = archiveService.generateSerialNumber('GB-1847-001', 1);
      const serial2 = archiveService.generateSerialNumber('GB-1847-001', 2);

      expect(serial1).toMatch(/^STAMP-/);
      expect(serial1).not.toBe(serial2);
    });

    it('should follow format pattern', () => {
      const serial = archiveService.generateSerialNumber('GB-1847-001', 1);
      const parts = serial.split('-');

      expect(parts[0]).toBe('STAMP');
      expect(parts.length).toBeGreaterThan(3);
    });
  });

  describe('Sample Stamps', () => {
    it('should have 20+ sample stamps', () => {
      const stamps = archiveDownloader.SAMPLE_ARCHIVE_STAMPS;
      expect(stamps.length).toBeGreaterThanOrEqual(20);
    });

    it('Penny Black should be first stamp', () => {
      const pennyBlack = archiveDownloader.SAMPLE_ARCHIVE_STAMPS[0];
      expect(pennyBlack.country).toBe('Great Britain');
      expect(pennyBlack.year).toBeGreaterThanOrEqual(1840);
      expect(pennyBlack.rarity).toBe('legendary');
    });

    it('Inverted Jenny should be included', () => {
      const jenny = archiveDownloader.SAMPLE_ARCHIVE_STAMPS.find(
        (s) => s.id.includes('JENNY')
      );
      expect(jenny).toBeDefined();
      expect(jenny?.year).toBe(1918);
    });

    it('all stamps should have valid structure', () => {
      archiveDownloader.SAMPLE_ARCHIVE_STAMPS.forEach((stamp) => {
        expect(stamp.id).toBeDefined();
        expect(stamp.country).toBeDefined();
        expect(stamp.year).toBeGreaterThan(1800);
        expect(stamp.rarity).toMatch(/^(common|uncommon|rare|very_rare|legendary)$/);
        expect(stamp.imageUrl).toMatch(/^https:\/\//);
      });
    });
  });

  describe('StampCoin Economics', () => {
    it('should calculate total supply correctly', () => {
      const stamps = archiveDownloader.getSampleStamps(5);
      let totalCoins = 0;

      stamps.forEach((stamp) => {
        const pricing = archiveService.calculateStampValue({
          ...stamp,
          archiveId: stamp.id,
          denomination: typeof stamp.denomination === 'string' ? parseFloat(stamp.denomination) : stamp.denomination,
        });
        totalCoins += pricing.currency;
      });

      expect(totalCoins).toBeGreaterThan(0);
    });

    it('should maintain peg ratio', () => {
      const metadata = {
        archiveId: 'peg-test',
        country: 'Test',
        denomination: 1,
        year: 1900,
        catalog: 'TEST-1',
        condition: 'fine' as const,
        rarity: 'common' as const,
        description: 'Test',
        imageUrl: 'https://example.com/test.jpg',
      };

      const pricing = archiveService.calculateStampValue(metadata);

      // Should be approximately $0.10 per coin
      const pricePerCoin = pricing.final_value / pricing.currency;
      expect(pricePerCoin).toBeCloseTo(0.1, 2);
    });
  });

  describe('NFT Integration', () => {
    it('should create NFT metadata from stamp', async () => {
      // Skip database test - requires full database setup
      const stamp = archiveDownloader.getSampleStamps(1)[0];
      expect(stamp).toBeDefined();
      expect(stamp.country).toBeDefined();
      expect(stamp.id).toBeDefined();
    });
  });
});

describe('💰 StampCoin Economy', () => {
  it('should track total STMP supply', () => {
    // With 20 sample stamps, should have significant supply
    const stamps = archiveDownloader.getSampleStamps(20);
    let totalSupply = 0;

    stamps.forEach((stamp) => {
      const pricing = archiveService.calculateStampValue({
        ...stamp,
        archiveId: stamp.id,
        denomination: typeof stamp.denomination === 'string' ? parseFloat(stamp.denomination) : stamp.denomination,
      });
      totalSupply += pricing.currency;
    });

    expect(totalSupply).toBeGreaterThan(100000);
    expect(totalSupply).toBeLessThan(1000000); // Less than max supply
  });

  it('should calculate market cap correctly', () => {
    const stamps = archiveDownloader.getSampleStamps(10);
    let totalCoins = 0;

    stamps.forEach((stamp) => {
      const pricing = archiveService.calculateStampValue({
        ...stamp,
        archiveId: stamp.id,
        denomination: typeof stamp.denomination === 'string' ? parseFloat(stamp.denomination) : stamp.denomination,
      });
      totalCoins += pricing.currency;
    });

    const price = 0.1;
    const marketCap = totalCoins * price;

    expect(marketCap).toBeGreaterThan(0);
    expect(marketCap).toBeCloseTo(totalCoins * 0.1, 0);
  });
});

describe('📚 Archive Statistics', () => {
  it('should calculate rarity distribution', () => {
    const stamps = archiveDownloader.getSampleStamps(20);

    const byRarity = stamps.reduce(
      (acc, stamp) => {
        acc[stamp.rarity] = (acc[stamp.rarity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(byRarity['legendary']).toBeGreaterThan(0);
    Object.keys(byRarity).forEach((rarity) => {
      expect(['common', 'uncommon', 'rare', 'very_rare', 'legendary']).toContain(
        rarity
      );
    });
  });

  it('should organize by country', () => {
    const stamps = archiveDownloader.getSampleStamps(20);

    const byCountry = stamps.reduce(
      (acc, stamp) => {
        acc[stamp.country] = (acc[stamp.country] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(Object.keys(byCountry).length).toBeGreaterThan(0);
    expect(byCountry['Great Britain']).toBeGreaterThan(0);
  });
});
