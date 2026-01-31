/**
 * Tests for shared validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  RarityEnum,
  StampConditionEnum,
  ShippingCompanyEnum,
  AddressSchema,
  OptionalAddressSchema,
} from '../shared/schemas';
import { z } from 'zod';

describe('Shared Validation Schemas', () => {
  describe('RarityEnum', () => {
    it('should accept valid rarity values', () => {
      expect(RarityEnum.parse('common')).toBe('common');
      expect(RarityEnum.parse('uncommon')).toBe('uncommon');
      expect(RarityEnum.parse('rare')).toBe('rare');
      expect(RarityEnum.parse('very_rare')).toBe('very_rare');
      expect(RarityEnum.parse('legendary')).toBe('legendary');
    });

    it('should reject invalid rarity values', () => {
      expect(() => RarityEnum.parse('invalid')).toThrow();
      expect(() => RarityEnum.parse('super_rare')).toThrow();
      expect(() => RarityEnum.parse('')).toThrow();
    });

    it('should be case-sensitive', () => {
      expect(() => RarityEnum.parse('Common')).toThrow();
      expect(() => RarityEnum.parse('RARE')).toThrow();
    });
  });

  describe('StampConditionEnum', () => {
    it('should accept valid condition values', () => {
      expect(StampConditionEnum.parse('mint')).toBe('mint');
      expect(StampConditionEnum.parse('used')).toBe('used');
      expect(StampConditionEnum.parse('fine')).toBe('fine');
      expect(StampConditionEnum.parse('very_fine')).toBe('very_fine');
    });

    it('should reject invalid condition values', () => {
      expect(() => StampConditionEnum.parse('invalid')).toThrow();
      expect(() => StampConditionEnum.parse('excellent')).toThrow();
      expect(() => StampConditionEnum.parse('')).toThrow();
    });

    it('should be case-sensitive', () => {
      expect(() => StampConditionEnum.parse('Mint')).toThrow();
      expect(() => StampConditionEnum.parse('USED')).toThrow();
    });
  });

  describe('ShippingCompanyEnum', () => {
    it('should accept valid shipping company values', () => {
      expect(ShippingCompanyEnum.parse('DHL')).toBe('DHL');
      expect(ShippingCompanyEnum.parse('FedEx')).toBe('FedEx');
      expect(ShippingCompanyEnum.parse('UPS')).toBe('UPS');
      expect(ShippingCompanyEnum.parse('USPS')).toBe('USPS');
      expect(ShippingCompanyEnum.parse('Aramex')).toBe('Aramex');
    });

    it('should reject invalid shipping company values', () => {
      expect(() => ShippingCompanyEnum.parse('Amazon')).toThrow();
      expect(() => ShippingCompanyEnum.parse('TNT')).toThrow();
      expect(() => ShippingCompanyEnum.parse('')).toThrow();
    });

    it('should be case-sensitive', () => {
      expect(() => ShippingCompanyEnum.parse('dhl')).toThrow();
      expect(() => ShippingCompanyEnum.parse('fedex')).toThrow();
    });
  });

  describe('AddressSchema', () => {
    const validAddress = {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      zipCode: '10001',
      country: 'USA',
    };

    it('should accept valid complete address', () => {
      const result = AddressSchema.parse(validAddress);
      expect(result.fullName).toBe('John Doe');
      expect(result.street).toBe('123 Main St');
      expect(result.city).toBe('New York');
      expect(result.zipCode).toBe('10001');
      expect(result.country).toBe('USA');
    });

    it('should accept address with optional state and phone', () => {
      const addressWithOptionals = {
        ...validAddress,
        state: 'NY',
        phone: '+1234567890',
      };
      const result = AddressSchema.parse(addressWithOptionals);
      expect(result.state).toBe('NY');
      expect(result.phone).toBe('+1234567890');
    });

    it('should allow missing optional fields', () => {
      const result = AddressSchema.parse(validAddress);
      expect(result.state).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it('should reject address with empty fullName', () => {
      const invalidAddress = { ...validAddress, fullName: '' };
      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject address with empty street', () => {
      const invalidAddress = { ...validAddress, street: '' };
      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject address with empty city', () => {
      const invalidAddress = { ...validAddress, city: '' };
      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject address with empty zipCode', () => {
      const invalidAddress = { ...validAddress, zipCode: '' };
      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject address with empty country', () => {
      const invalidAddress = { ...validAddress, country: '' };
      expect(() => AddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should reject address missing required fields', () => {
      expect(() => AddressSchema.parse({ fullName: 'John Doe' })).toThrow();
      expect(() => AddressSchema.parse({})).toThrow();
    });
  });

  describe('OptionalAddressSchema', () => {
    const validAddress = {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      zipCode: '10001',
      country: 'USA',
    };

    it('should accept valid address', () => {
      const result = OptionalAddressSchema.parse(validAddress);
      expect(result?.fullName).toBe('John Doe');
      expect(result?.street).toBe('123 Main St');
    });

    it('should accept undefined', () => {
      const result = OptionalAddressSchema.parse(undefined);
      expect(result).toBeUndefined();
    });

    it('should reject empty strings in fields when provided', () => {
      const invalidAddress = { ...validAddress, fullName: '' };
      // OptionalAddressSchema still validates structure when provided
      expect(() => OptionalAddressSchema.parse(invalidAddress)).toThrow();
    });

    it('should require all fields when address is provided', () => {
      const incompleteAddress = {
        fullName: 'John Doe',
        street: '123 Main St',
      };
      expect(() => OptionalAddressSchema.parse(incompleteAddress)).toThrow();
    });
  });

  describe('Type exports', () => {
    it('should export Rarity type', () => {
      type Rarity = z.infer<typeof RarityEnum>;
      const rarity: Rarity = 'common';
      expect(rarity).toBe('common');
    });

    it('should export StampCondition type', () => {
      type StampCondition = z.infer<typeof StampConditionEnum>;
      const condition: StampCondition = 'mint';
      expect(condition).toBe('mint');
    });

    it('should export ShippingCompany type', () => {
      type ShippingCompany = z.infer<typeof ShippingCompanyEnum>;
      const company: ShippingCompany = 'DHL';
      expect(company).toBe('DHL');
    });

    it('should export Address type', () => {
      type Address = z.infer<typeof AddressSchema>;
      const address: Address = {
        fullName: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'USA',
      };
      expect(address.fullName).toBe('John Doe');
    });
  });
});
