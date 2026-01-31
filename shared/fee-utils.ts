/**
 * Shared Business Logic Utilities
 * Common fee calculations and business rules
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Platform fee percentage (5% of transaction value)
 */
export const PLATFORM_FEE_PERCENTAGE = 0.05;

/**
 * Fixed NFT minting fee in USD
 */
export const NFT_MINTING_FEE_USD = 10;

/**
 * Fixed monthly storage fee in USD
 */
export const STORAGE_FEE_USD = 2;

/**
 * Authentication fee bounds
 */
export const AUTH_FEE_MIN_USD = 5;
export const AUTH_FEE_MAX_USD = 1000;

/**
 * USD to StampCoin exchange rate
 */
export const USD_TO_STAMPCOIN_RATE = 100;

/**
 * USD to StampCoin exchange rate for minting (alternative rate)
 */
export const USD_TO_STAMPCOIN_MINTING_RATE = 10;

// ============================================================================
// Fee Calculation Functions
// ============================================================================

/**
 * حساب سعر التوثيق بناءً على قيمة الطابع
 * Calculate authentication fee based on stamp value
 * 
 * @param estimatedValue - Estimated value of the stamp in USD
 * @returns Authentication fee (5% of value, min $5, max $1000)
 */
export function calculateAuthenticationFee(estimatedValue: number): number {
  const fee = Math.max(AUTH_FEE_MIN_USD, Math.min(estimatedValue * PLATFORM_FEE_PERCENTAGE, AUTH_FEE_MAX_USD));
  return parseFloat(fee.toFixed(2));
}

/**
 * حساب سعر السك
 * Calculate NFT minting fee
 * 
 * @returns Fixed NFT minting fee in USD
 */
export function getNFTMintingFee(): number {
  return NFT_MINTING_FEE_USD;
}

/**
 * حساب سعر التخزين
 * Calculate storage fee
 * 
 * @returns Fixed monthly storage fee in USD
 */
export function getStorageFee(): number {
  return STORAGE_FEE_USD;
}

/**
 * حساب قيمة الطابع بعملة المنصة
 * Convert USD value to platform currency (STAMP_COIN)
 * 
 * @param usdValue - Value in USD
 * @returns Value in StampCoin
 */
export function convertToStampCoin(usdValue: number): number {
  return Math.round(usdValue * USD_TO_STAMPCOIN_RATE);
}

/**
 * Calculate platform fee based on transaction value
 * حساب رسم المنصة بناءً على قيمة المعاملة
 * 
 * @param transactionValue - Transaction value in USD
 * @returns Platform fee (5% of transaction value)
 */
export function calculatePlatformFee(transactionValue: number): number {
  return parseFloat((transactionValue * PLATFORM_FEE_PERCENTAGE).toFixed(2));
}

/**
 * Calculate total platform fee for multiple prices
 * حساب رسم المنصة الإجمالي لأسعار متعددة
 * 
 * @param prices - Array of prices to calculate fee on
 * @returns Total platform fee
 */
export function calculateTotalPlatformFee(...prices: (number | undefined | null)[]): number {
  const total = prices.reduce((sum, price) => {
    return sum + (price ? calculatePlatformFee(price) : 0);
  }, 0);
  return parseFloat(total.toFixed(2));
}
