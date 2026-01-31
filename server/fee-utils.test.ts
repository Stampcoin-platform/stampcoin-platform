/**
 * Tests for shared fee calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAuthenticationFee,
  getNFTMintingFee,
  getStorageFee,
  convertToStampCoin,
  calculatePlatformFee,
  calculateTotalPlatformFee,
  PLATFORM_FEE_PERCENTAGE,
  NFT_MINTING_FEE_USD,
  STORAGE_FEE_USD,
  AUTH_FEE_MIN_USD,
  AUTH_FEE_MAX_USD,
  USD_TO_STAMPCOIN_RATE,
} from '../shared/fee-utils';

describe('Fee Calculation Utilities', () => {
  describe('calculateAuthenticationFee', () => {
    it('should calculate 5% of stamp value for mid-range values', () => {
      const result = calculateAuthenticationFee(100);
      expect(result).toBe(5); // 100 * 0.05 = 5
    });

    it('should calculate 5% of stamp value for higher values', () => {
      const result = calculateAuthenticationFee(1000);
      expect(result).toBe(50); // 1000 * 0.05 = 50
    });

    it('should apply minimum fee of $5 for low values', () => {
      const result = calculateAuthenticationFee(50);
      expect(result).toBe(5); // 50 * 0.05 = 2.5, but min is 5
    });

    it('should apply minimum fee of $5 for very low values', () => {
      const result = calculateAuthenticationFee(10);
      expect(result).toBe(5); // 10 * 0.05 = 0.5, but min is 5
    });

    it('should apply maximum fee of $1000 for very high values', () => {
      const result = calculateAuthenticationFee(50000);
      expect(result).toBe(1000); // 50000 * 0.05 = 2500, but max is 1000
    });

    it('should apply maximum fee of $1000 at the threshold', () => {
      const result = calculateAuthenticationFee(20000);
      expect(result).toBe(1000); // 20000 * 0.05 = 1000
    });

    it('should return values with at most 2 decimal places', () => {
      const result = calculateAuthenticationFee(333.33);
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('getNFTMintingFee', () => {
    it('should return fixed NFT minting fee', () => {
      expect(getNFTMintingFee()).toBe(NFT_MINTING_FEE_USD);
    });

    it('should return $10 USD', () => {
      expect(getNFTMintingFee()).toBe(10);
    });
  });

  describe('getStorageFee', () => {
    it('should return fixed storage fee', () => {
      expect(getStorageFee()).toBe(STORAGE_FEE_USD);
    });

    it('should return $2 USD', () => {
      expect(getStorageFee()).toBe(2);
    });
  });

  describe('convertToStampCoin', () => {
    it('should convert USD to StampCoin at 100:1 rate', () => {
      const result = convertToStampCoin(100);
      expect(result).toBe(10000); // 100 * 100 = 10000
    });

    it('should convert $1 to 100 StampCoins', () => {
      const result = convertToStampCoin(1);
      expect(result).toBe(100);
    });

    it('should round the result', () => {
      const result = convertToStampCoin(1.234);
      expect(result).toBe(123); // Math.round(1.234 * 100)
    });

    it('should handle decimal values correctly', () => {
      const result = convertToStampCoin(0.5);
      expect(result).toBe(50);
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate 5% platform fee', () => {
      const result = calculatePlatformFee(100);
      expect(result).toBe(5); // 100 * 0.05 = 5
    });

    it('should calculate 5% for larger amounts', () => {
      const result = calculatePlatformFee(1000);
      expect(result).toBe(50); // 1000 * 0.05 = 50
    });

    it('should return values with at most 2 decimal places', () => {
      const result = calculatePlatformFee(333.33);
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should handle zero value', () => {
      const result = calculatePlatformFee(0);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalPlatformFee', () => {
    it('should calculate total fee for multiple prices', () => {
      const result = calculateTotalPlatformFee(100, 200);
      expect(result).toBe(15); // (100 + 200) * 0.05 = 15
    });

    it('should handle undefined values', () => {
      const result = calculateTotalPlatformFee(100, undefined, 200);
      expect(result).toBe(15); // (100 + 200) * 0.05 = 15
    });

    it('should handle null values', () => {
      const result = calculateTotalPlatformFee(100, null, 200);
      expect(result).toBe(15); // (100 + 200) * 0.05 = 15
    });

    it('should handle all undefined values', () => {
      const result = calculateTotalPlatformFee(undefined, undefined);
      expect(result).toBe(0);
    });

    it('should handle single price', () => {
      const result = calculateTotalPlatformFee(100);
      expect(result).toBe(5); // 100 * 0.05 = 5
    });

    it('should return values with at most 2 decimal places', () => {
      const result = calculateTotalPlatformFee(333.33, 666.67);
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('Constants', () => {
    it('should have correct PLATFORM_FEE_PERCENTAGE', () => {
      expect(PLATFORM_FEE_PERCENTAGE).toBe(0.05);
    });

    it('should have correct NFT_MINTING_FEE_USD', () => {
      expect(NFT_MINTING_FEE_USD).toBe(10);
    });

    it('should have correct STORAGE_FEE_USD', () => {
      expect(STORAGE_FEE_USD).toBe(2);
    });

    it('should have correct AUTH_FEE_MIN_USD', () => {
      expect(AUTH_FEE_MIN_USD).toBe(5);
    });

    it('should have correct AUTH_FEE_MAX_USD', () => {
      expect(AUTH_FEE_MAX_USD).toBe(1000);
    });

    it('should have correct USD_TO_STAMPCOIN_RATE', () => {
      expect(USD_TO_STAMPCOIN_RATE).toBe(100);
    });
  });
});
