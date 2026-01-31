# Shared Modules

This directory contains reusable code shared across the Stampcoin platform.

## Directory Structure

```
shared/
├── _core/              # Core utilities and error handling
├── const.ts            # Global constants
├── fee-utils.ts        # Fee calculation utilities (NEW)
├── schemas.ts          # Validation schemas (NEW)
├── types.ts            # TypeScript type definitions
└── README.md           # This file
```

## Quick Reference

### Validation Schemas (`schemas.ts`)

Common Zod validation schemas for consistent data validation:

```typescript
import { 
  RarityEnum, 
  StampConditionEnum, 
  ShippingCompanyEnum,
  AddressSchema,
  OptionalAddressSchema 
} from '@shared/schemas';

// Use in your schema definitions
const MySchema = z.object({
  rarity: RarityEnum,          // 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary'
  condition: StampConditionEnum, // 'mint' | 'used' | 'fine' | 'very_fine'
  shipper: ShippingCompanyEnum,  // 'DHL' | 'FedEx' | 'UPS' | 'USPS' | 'Aramex'
  address: AddressSchema,        // Complete address object
});
```

**Available Schemas:**
- `RarityEnum` - Stamp rarity levels
- `StampConditionEnum` - Stamp condition grades  
- `ShippingCompanyEnum` - Supported shipping companies
- `AddressSchema` - Complete address validation
- `OptionalAddressSchema` - Optional address (for buyer addresses)

### Fee Utilities (`fee-utils.ts`)

Business logic for fee calculations:

```typescript
import { 
  calculateAuthenticationFee,
  calculatePlatformFee,
  calculateTotalPlatformFee,
  getNFTMintingFee,
  getStorageFee,
  convertToStampCoin,
  PLATFORM_FEE_PERCENTAGE,
  USD_TO_STAMPCOIN_RATE
} from '@shared/fee-utils';

// Calculate authentication fee (5% with min $5, max $1000)
const authFee = calculateAuthenticationFee(stampValue);

// Calculate platform fee (5%)
const platformFee = calculatePlatformFee(transactionValue);

// Calculate total platform fee for multiple items
const totalFee = calculateTotalPlatformFee(nftPrice, physicalPrice);

// Get fixed fees
const mintingFee = getNFTMintingFee();  // $10 USD
const storageFee = getStorageFee();     // $2 USD/month

// Convert USD to StampCoin (rate: 1 USD = 100 SC)
const stampCoins = convertToStampCoin(usdAmount);
```

**Available Constants:**
- `PLATFORM_FEE_PERCENTAGE` - 0.05 (5%)
- `NFT_MINTING_FEE_USD` - $10
- `STORAGE_FEE_USD` - $2
- `AUTH_FEE_MIN_USD` - $5
- `AUTH_FEE_MAX_USD` - $1000
- `USD_TO_STAMPCOIN_RATE` - 100

**Available Functions:**
- `calculateAuthenticationFee(value)` - Authentication fee with bounds
- `calculatePlatformFee(value)` - 5% platform fee
- `calculateTotalPlatformFee(...prices)` - Sum of platform fees
- `getNFTMintingFee()` - Fixed NFT minting fee
- `getStorageFee()` - Fixed storage fee
- `convertToStampCoin(usd)` - USD to StampCoin conversion

## Best Practices

### When to Use Shared Modules

✅ **DO use shared modules when:**
- Implementing address validation
- Calculating platform fees
- Using rarity or condition enums
- Validating shipping company selection
- Converting between USD and StampCoin

❌ **DON'T create new duplicates:**
- Always check if a schema/utility already exists
- If you need a variation, extend the existing one
- Add new shared utilities if used in 2+ places

### Adding New Shared Code

1. **Check if it exists**: Search existing shared modules first
2. **Is it reusable?**: Will it be used in 2+ places?
3. **Add tests**: Create comprehensive test coverage
4. **Document it**: Update this README and add JSDoc comments
5. **Update docs**: Add to REFACTORING_SUMMARY.md if significant

### Testing Shared Modules

All shared modules should have comprehensive tests:

```bash
# Test fee utilities
npm test server/fee-utils.test.ts

# Test validation schemas
npm test server/schemas.test.ts

# Test all shared code
npm test -- --grep "shared"
```

## Migration Guide

### Migrating Existing Code

If you find duplicated code in existing routers:

1. **Identify the pattern**: Is it validation, calculation, or constants?
2. **Check shared modules**: See if it already exists
3. **Extract if needed**: Add to appropriate shared module
4. **Add tests**: Ensure 100% test coverage
5. **Update routers**: Replace duplicates with imports
6. **Document**: Update relevant documentation

### Example Migration

**Before:**
```typescript
// In your router
const platformFee = transactionValue * 0.05;

const AddressSchema = z.object({
  fullName: z.string(),
  street: z.string(),
  // ...
});
```

**After:**
```typescript
// Import from shared
import { calculatePlatformFee } from '@shared/fee-utils';
import { AddressSchema } from '@shared/schemas';

const platformFee = calculatePlatformFee(transactionValue);
// Use AddressSchema directly
```

## Code Quality Standards

All shared code must:
- ✅ Have comprehensive test coverage (aim for 100%)
- ✅ Include JSDoc comments for all exports
- ✅ Follow TypeScript best practices
- ✅ Export both the schema/function and its TypeScript type
- ✅ Handle edge cases (null, undefined, zero, etc.)
- ✅ Use precise decimal arithmetic for money calculations

## Related Documentation

- [REFACTORING_SUMMARY.md](../docs/REFACTORING_SUMMARY.md) - Detailed refactoring guide
- [types.ts](./types.ts) - TypeScript type definitions
- [const.ts](./const.ts) - Global platform constants

## Support

For questions or issues with shared modules:
1. Check the test files for usage examples
2. Review REFACTORING_SUMMARY.md for detailed documentation
3. Contact the platform maintainers

---

*Last Updated: January 10, 2026*
