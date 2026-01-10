/**
 * جهاز توجيه مصادقة وتوثيق الطوابع
 * Stamp Authentication & NFT Minting Router
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { db, getDb } from '../db';
import { authenticatedStamps } from '../db/stamp-authentication-schema';
import { eq, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { randomBytes, createHash } from 'crypto';
import {
  RarityEnum,
  StampConditionEnum,
  ShippingCompanyEnum,
  AddressSchema,
} from '../../shared/schemas';
import {
  calculateAuthenticationFee,
  getNFTMintingFee,
  getStorageFee,
  convertToStampCoin,
  calculatePlatformFee,
  PLATFORM_FEE_PERCENTAGE,
} from '../../shared/fee-utils';

// ============================================================================
// Schemas
// ============================================================================

const CreateStampAuthInput = z.object({
  stampName: z.string().min(1, 'اسم الطابع مطلوب'),
  stampCountry: z.string().min(1, 'دولة الطابع مطلوبة'),
  stampYear: z.number().optional(),
  stampCatalogNumber: z.string().optional(),
  stampCondition: StampConditionEnum,
  estimatedValue: z.string().regex(/^\d+\.?\d*$/, 'قيمة غير صحيحة'),
  rarity: RarityEnum,
  description: z.string().optional(),
  image: z.unknown(), // سيتم التعامل مع الصورة بشكل منفصل
});

const StampUploadSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  country: z.string(),
  year: z.number().optional(),
  denomination: z.string().optional(),
  condition: z.string(),
  rarity: RarityEnum,
  estimatedValue: z.number(),
  images: z.array(z.string()).default([]),
});

const MintingCostCalculation = z.object({
  stampValue: z.number(),
  rarity: RarityEnum,
});

// ============================================================================
// الإجراءات والخدمات
// ============================================================================

/**
 * طلب بدء تداول طابع مادي
 */
const PhysicalTradeSchema = z.object({
  stampId: z.number(),
  agreedPrice: z.number(),
  shippingCompany: ShippingCompanyEnum,
  insuranceAmount: z.number(),
  buyerAddress: AddressSchema,
  sellerAddress: AddressSchema,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate minting cost based on stamp value and rarity
 * حساب تكلفة السك بناءً على قيمة الطابع والندرة
 */
function calculateMintingCost(stampValue: number, rarity: string): {
  baseCost: number;
  rarityMultiplier: number;
  platformFee: number;
  gasFee: number;
  totalStampCoins: number;
  totalUSD: number;
} {
  // Base cost: 1% of stamp value
  const baseCost = stampValue * 0.01;

  // Rarity multipliers
  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    very_rare: 2.0,
    legendary: 3.0,
  };

  const rarityMultiplier = rarityMultipliers[rarity as keyof typeof rarityMultipliers] || 1.0;

  // Platform fee (fixed)
  const platformFee = 5; // $5 USD

  // Estimated gas fee for minting on Polygon
  const gasFee = 0.50; // $0.50 USD

  // Total in USD
  const totalUSD = (baseCost * rarityMultiplier) + platformFee + gasFee;

  // Convert to StampCoins (1 USD = 10 StampCoins)
  const totalStampCoins = Math.ceil(totalUSD * 10);

  return {
    baseCost,
    rarityMultiplier,
    platformFee,
    gasFee,
    totalStampCoins,
    totalUSD,
  };
}

/**
 * Calculate escrow deposit required
 * حساب الرصيد الاحتياطي المطلوب
 */
function calculateEscrowDeposit(stampValue: number, shippingCost: number): {
  buyerDeposit: number;
  sellerDeposit: number;
  platformFee: number;
  totalRequired: number;
} {
  // Buyer deposits: stamp price + shipping + 10% security
  const buyerDeposit = stampValue + shippingCost + (stampValue * 0.10);

  // Seller deposits: 20% of stamp value as guarantee
  const sellerDeposit = stampValue * 0.20;

  // Platform fee: 5% of transaction
  const platformFee = calculatePlatformFee(stampValue);

  const totalRequired = buyerDeposit + sellerDeposit;

  return {
    buyerDeposit,
    sellerDeposit,
    platformFee,
    totalRequired,
  };
}

/**
 * Generate unique authentication certificate
 * إنشاء شهادة توثيق فريدة
 */
function generateAuthenticationCertificate(stampData: any): string {
  const timestamp = Date.now();
  const dataString = JSON.stringify({
    ...stampData,
    timestamp,
  });

  const hash = createHash('sha256')
    .update(dataString)
    .digest('hex');

  return `STAMPCOIN-AUTH-${hash.substring(0, 16).toUpperCase()}-${timestamp}`;
}

// ============================================================================
// ROUTER
// ============================================================================

export const stampAuthenticationRouter = router({
  /**
   * Upload stamp for authentication
   * رفع طابع للتوثيق
   */
  uploadStamp: protectedProcedure
    .input(StampUploadSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof StampUploadSchema>; ctx: any }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول لرفع الطوابع',
        });
      }

      // Generate authentication certificate
      const authCertificate = generateAuthenticationCertificate(input);

      // Calculate minting cost
      const mintingCost = calculateMintingCost(input.estimatedValue, input.rarity);

      // Store in database (pseudo-code - adjust to your schema)
      const db = getDb();
      const result = await db.execute(sql`
        INSERT INTO stamp_submissions (
          user_id,
          title,
          description,
          country,
          year,
          denomination,
          condition,
          rarity,
          estimated_value,
          images,
          auth_certificate,
          minting_cost_usd,
          minting_cost_stampcoins,
          status,
          created_at
        ) VALUES (
          ${userId},
          ${input.title},
          ${input.description},
          ${input.country},
          ${input.year},
          ${input.denomination},
          ${input.condition},
          ${input.rarity},
          ${input.estimatedValue},
          ${JSON.stringify(input.images)},
          ${authCertificate},
          ${mintingCost.totalUSD},
          ${mintingCost.totalStampCoins},
          'pending_verification',
          NOW()
        )
      `);

      return {
        success: true,
        submissionId: result.insertId,
        authCertificate,
        mintingCost,
        message: 'تم رفع الطابع بنجاح! في انتظار التحقق والتوثيق',
        nextStep: 'سيتم مراجعة طابعك خلال 24-48 ساعة',
      };
    }),

  /**
   * Calculate minting cost before upload
   * حساب تكلفة السك قبل الرفع
   */
  calculateMintingCost: publicProcedure
    .input(MintingCostCalculation)
    .query(({ input }: { input: z.infer<typeof MintingCostCalculation> }) => {
      return calculateMintingCost(input.stampValue, input.rarity);
    }),

  /**
   * Get user's submitted stamps
   * الحصول على الطوابع المرفوعة من المستخدم
   */
  mySubmissions: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'يجب تسجيل الدخول',
      });
    }

    const db = getDb();
    const submissions = await db.execute(sql`
      SELECT 
        id,
        title,
        description,
        country,
        year,
        rarity,
        estimated_value,
        auth_certificate,
        minting_cost_stampcoins,
        status,
        nft_token_id,
        ipfs_hash,
        created_at,
        verified_at
      FROM stamp_submissions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    return {
      submissions: submissions.rows || [],
      total: submissions.rows?.length || 0,
    };
  }),

  /**
   * Pay for minting and mint NFT
   * الدفع والسك كـ NFT
   */
  payAndMint: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ input, ctx }: { input: { submissionId: number }; ctx: any }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول',
        });
      }

      const db = getDb();

      // Get submission details
      const submission = await db.execute(sql`
        SELECT * FROM stamp_submissions
        WHERE id = ${input.submissionId} AND user_id = ${userId}
      `);

      if (!submission.rows || submission.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'الطابع غير موجود',
        });
      }

      const stamp = submission.rows[0];

      // Check if already minted
      if (stamp.status === 'minted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'تم سك هذا الطابع مسبقاً',
        });
      }

      // Check user balance
      const balance = await db.execute(sql`
        SELECT balance FROM user_balances
        WHERE user_id = ${userId}
      `);

      const currentBalance = balance.rows?.[0]?.balance || 0;
      const requiredCoins = stamp.minting_cost_stampcoins;

      if (currentBalance < requiredCoins) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `رصيد غير كافٍ. المطلوب: ${requiredCoins} StampCoins، الرصيد الحالي: ${currentBalance}`,
        });
      }

      // Deduct balance
      await db.execute(sql`
        UPDATE user_balances
        SET balance = balance - ${requiredCoins}
        WHERE user_id = ${userId}
      `);

      // Record transaction
      await db.execute(sql`
        INSERT INTO transactions (
          user_id,
          type,
          amount,
          description,
          created_at
        ) VALUES (
          ${userId},
          'minting_payment',
          ${requiredCoins},
          'دفع تكلفة سك الطابع: ${stamp.title}',
          NOW()
        )
      `);

      // Update submission status (actual minting would happen here)
      await db.execute(sql`
        UPDATE stamp_submissions
        SET 
          status = 'payment_received',
          paid_at = NOW()
        WHERE id = ${input.submissionId}
      `);

      // TODO: Trigger actual NFT minting process
      // This would call the minting script we created earlier

      return {
        success: true,
        message: 'تم الدفع بنجاح! جاري سك الـ NFT',
        transactionId: randomBytes(16).toString('hex'),
        remainingBalance: currentBalance - requiredCoins,
        estimatedMintingTime: '5-10 دقائق',
      };
    }),

  /**
   * Initiate physical stamp trade with escrow
   * بدء تداول الطابع الحقيقي مع نظام الضمان
   */
  initiatePhysicalTrade: protectedProcedure
    .input(PhysicalTradeSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof PhysicalTradeSchema>; ctx: any }) => {
      const buyerId = ctx.user?.id;

      if (!buyerId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول',
        });
      }

      const db = getDb();

      // Get stamp details
      const stampQuery = await db.execute(sql`
        SELECT * FROM stamp_submissions
        WHERE id = ${input.stampId} AND status = 'minted'
      `);

      if (!stampQuery.rows || stampQuery.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'الطابع غير متاح للتداول',
        });
      }

      const stamp = stampQuery.rows[0];
      const sellerId = stamp.user_id;

      // Calculate escrow deposits
      const escrow = calculateEscrowDeposit(input.agreedPrice, 50); // $50 shipping estimate

      // Check buyer balance
      const buyerBalance = await db.execute(sql`
        SELECT balance FROM user_balances WHERE user_id = ${buyerId}
      `);

      if (!buyerBalance.rows || buyerBalance.rows[0].balance < escrow.buyerDeposit) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `رصيد المشتري غير كافٍ. المطلوب: ${escrow.buyerDeposit} StampCoins`,
        });
      }

      // Check seller balance
      const sellerBalance = await db.execute(sql`
        SELECT balance FROM user_balances WHERE user_id = ${sellerId}
      `);

      if (!sellerBalance.rows || sellerBalance.rows[0].balance < escrow.sellerDeposit) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'رصيد البائع الاحتياطي غير كافٍ',
        });
      }

      // Create escrow trade
      const tradeId = randomBytes(16).toString('hex');

      await db.execute(sql`
        INSERT INTO physical_trades (
          trade_id,
          stamp_id,
          seller_id,
          buyer_id,
          agreed_price,
          buyer_deposit,
          seller_deposit,
          platform_fee,
          shipping_company,
          insurance_amount,
          buyer_address,
          seller_address,
          status,
          created_at
        ) VALUES (
          ${tradeId},
          ${input.stampId},
          ${sellerId},
          ${buyerId},
          ${input.agreedPrice},
          ${escrow.buyerDeposit},
          ${escrow.sellerDeposit},
          ${escrow.platformFee},
          ${input.shippingCompany},
          ${input.insuranceAmount},
          ${JSON.stringify(input.buyerAddress)},
          ${JSON.stringify(input.sellerAddress)},
          'escrow_pending',
          NOW()
        )
      `);

      // Lock escrow amounts
      await db.execute(sql`
        UPDATE user_balances
        SET 
          balance = balance - ${escrow.buyerDeposit},
          escrow_locked = escrow_locked + ${escrow.buyerDeposit}
        WHERE user_id = ${buyerId}
      `);

      await db.execute(sql`
        UPDATE user_balances
        SET 
          balance = balance - ${escrow.sellerDeposit},
          escrow_locked = escrow_locked + ${escrow.sellerDeposit}
        WHERE user_id = ${sellerId}
      `);

      return {
        success: true,
        tradeId,
        escrowDetails: escrow,
        message: 'تم إنشاء عملية التداول بنجاح!',
        nextSteps: [
          'البائع: إعداد الطابع للشحن',
          'البائع: تحميل صور التعبئة',
          'البائع: إرسال الطابع مع شركة الشحن',
          'البائع: إدخال رقم التتبع',
          'المشتري: استلام الطابع',
          'المشتري: تأكيد الاستلام والحالة',
          'إطلاق الأموال من الضمان',
        ],
      };
    }),

  /**
   * Update shipping tracking
   * تحديث معلومات التتبع
   */
  updateShippingTracking: protectedProcedure
    .input(
      z.object({
        tradeId: z.string(),
        trackingNumber: z.string(),
        shippingReceipt: z.string(), // Base64 image
        packagePhotos: z.array(z.string()), // Base64 images
      }),
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول',
        });
      }

      const db = getDb();

      // Verify user is the seller
      const trade = await db.execute(sql`
        SELECT * FROM physical_trades
        WHERE trade_id = ${input.tradeId} AND seller_id = ${userId}
      `);

      if (!trade.rows || trade.rows.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'غير مصرح لك بتحديث هذه العملية',
        });
      }

      // Update tracking info
      await db.execute(sql`
        UPDATE physical_trades
        SET 
          tracking_number = ${input.trackingNumber},
          shipping_receipt = ${input.shippingReceipt},
          package_photos = ${JSON.stringify(input.packagePhotos)},
          status = 'shipped',
          shipped_at = NOW()
        WHERE trade_id = ${input.tradeId}
      `);

      // Notify buyer
      // TODO: Send notification

      return {
        success: true,
        message: 'تم تحديث معلومات الشحن بنجاح',
        trackingNumber: input.trackingNumber,
      };
    }),

  /**
   * Confirm receipt and release escrow
   * تأكيد الاستلام وإطلاق الضمان
   */
  confirmReceipt: protectedProcedure
    .input(
      z.object({
        tradeId: z.string(),
        conditionMatch: z.boolean(),
        receiptPhotos: z.array(z.string()),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'يجب تسجيل الدخول',
        });
      }

      const db = getDb();

      // Verify user is the buyer
      const trade = await db.execute(sql`
        SELECT * FROM physical_trades
        WHERE trade_id = ${input.tradeId} AND buyer_id = ${userId}
      `);

      if (!trade.rows || trade.rows.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'غير مصرح لك بتحديث هذه العملية',
        });
      }

      const tradeData = trade.rows[0];

      if (!input.conditionMatch) {
        // Open dispute
        await db.execute(sql`
          UPDATE physical_trades
          SET status = 'disputed'
          WHERE trade_id = ${input.tradeId}
        `);

        return {
          success: true,
          message: 'تم فتح نزاع. سيتم مراجعة الحالة من قبل فريق الدعم',
          disputeId: randomBytes(8).toString('hex'),
        };
      }

      // Release escrow amounts
      const sellerId = tradeData.seller_id;
      const buyerId = tradeData.buyer_id;
      const agreedPrice = tradeData.agreed_price;
      const platformFee = tradeData.platform_fee;

      // Pay seller
      await db.execute(sql`
        UPDATE user_balances
        SET 
          balance = balance + ${agreedPrice},
          escrow_locked = escrow_locked - ${tradeData.seller_deposit}
        WHERE user_id = ${sellerId}
      `);

      // Refund buyer's security deposit
      await db.execute(sql`
        UPDATE user_balances
        SET 
          balance = balance + ${tradeData.buyer_deposit - agreedPrice},
          escrow_locked = escrow_locked - ${tradeData.buyer_deposit}
        WHERE user_id = ${buyerId}
      `);

      // Collect platform fee
      await db.execute(sql`
        INSERT INTO platform_revenue (
          amount,
          source,
          trade_id,
          created_at
        ) VALUES (
          ${platformFee},
          'escrow_trade',
          ${input.tradeId},
          NOW()
        )
      `);

      // Update trade status
      await db.execute(sql`
        UPDATE physical_trades
        SET 
          status = 'completed',
          buyer_rating = ${input.rating},
          buyer_feedback = ${input.feedback || ''},
          receipt_photos = ${JSON.stringify(input.receiptPhotos)},
          completed_at = NOW()
        WHERE trade_id = ${input.tradeId}
      `);

      return {
        success: true,
        message: 'تم إتمام العملية بنجاح! تم إطلاق الأموال من الضمان',
        sellerPayout: agreedPrice,
        buyerRefund: tradeData.buyer_deposit - agreedPrice,
        platformFee,
      };
    }),

  /**
   * Get active trades
   * الحصول على العمليات النشطة
   */
  myTrades: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'يجب تسجيل الدخول',
      });
    }

    const db = getDb();

    const trades = await db.execute(sql`
      SELECT 
        t.*,
        s.title as stamp_title,
        s.images as stamp_images
      FROM physical_trades t
      JOIN stamp_submissions s ON t.stamp_id = s.id
      WHERE t.buyer_id = ${userId} OR t.seller_id = ${userId}
      ORDER BY t.created_at DESC
    `);

    return {
      trades: trades.rows || [],
      total: trades.rows?.length || 0,
    };
  }),

  /**
   * Get escrow balance
   * الحصول على الرصيد الاحتياطي
   */
  getEscrowBalance: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const userId = ctx.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'يجب تسجيل الدخول',
      });
    }

    const db = getDb();

    const balance = await db.execute(sql`
      SELECT 
        balance,
        escrow_locked,
        (balance + escrow_locked) as total_balance
      FROM user_balances
      WHERE user_id = ${userId}
    `);

    if (!balance.rows || balance.rows.length === 0) {
      return {
        availableBalance: 0,
        escrowLocked: 0,
        totalBalance: 0,
      };
    }

    const data = balance.rows[0];

    return {
      availableBalance: data.balance,
      escrowLocked: data.escrow_locked,
      totalBalance: data.total_balance,
    };
  }),
});
