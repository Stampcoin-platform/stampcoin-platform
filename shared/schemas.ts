/**
 * Shared Validation Schemas
 * Common Zod schemas used across the application
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * Stamp rarity levels
 */
export const RarityEnum = z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']);
export type Rarity = z.infer<typeof RarityEnum>;

/**
 * Stamp condition grades
 */
export const StampConditionEnum = z.enum(['mint', 'used', 'fine', 'very_fine']);
export type StampCondition = z.infer<typeof StampConditionEnum>;

/**
 * Supported shipping companies
 */
export const ShippingCompanyEnum = z.enum(['DHL', 'FedEx', 'UPS', 'USPS', 'Aramex']);
export type ShippingCompany = z.infer<typeof ShippingCompanyEnum>;

// ============================================================================
// Common Object Schemas
// ============================================================================

/**
 * Standard address schema for shipping and billing
 */
export const AddressSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  street: z.string().min(1, 'اسم الشارع مطلوب'),
  city: z.string().min(1, 'اسم المدينة مطلوب'),
  state: z.string().optional(),
  zipCode: z.string().min(1, 'الرمز البريدي مطلوب'),
  country: z.string().min(1, 'الدولة مطلوبة'),
  phone: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

/**
 * Optional address schema (all fields optional except structure)
 */
export const OptionalAddressSchema = z.object({
  fullName: z.string(),
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
  country: z.string(),
}).optional();
