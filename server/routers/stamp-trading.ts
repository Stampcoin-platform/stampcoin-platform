/**
 * جهاز توجيه التداول والمعاملات
 * Trading & P2P Transactions Router
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { db } from '../db';
import {
  stampListings,
  stampTrades,
  escrowAccounts,
  userReserveBalance,
  balanceTransactions,
  disputes,
} from '../db/stamp-authentication-schema';
import { eq, and } from 'drizzle-orm';
import { OptionalAddressSchema } from '../../shared/schemas';
import { calculateTotalPlatformFee } from '../../shared/fee-utils';

// ============================================================================
// Schemas
// ============================================================================

const CreateListingInput = z.object({
  stampId: z.number(),
  listingType: z.enum(['nft_only', 'physical_only', 'both']),
  nftPrice: z.number().optional(),
  physicalPrice: z.number().optional(),
  description: z.string().optional(),
  shippingCompany: z.string().optional(),
});

const CreateTradeInput = z.object({
  listingId: z.number(),
  stampId: z.number(),
  buyerId: z.string(),
  offeredPrice: z.number(),
  buyNft: z.boolean().default(false),
  buyPhysical: z.boolean().default(false),
  buyerAddress: OptionalAddressSchema,
});

// ============================================================================
// Router
// ============================================================================

export const tradingRouter = router({
  /**
   * إنشاء قائمة بيع
   * Create a new listing
   */
  createListing: publicProcedure
    .input(CreateListingInput)
    .mutation(async ({ input, ctx }) => {
      const sellerId = ctx.user?.openId || 'anonymous';

      // التحقق من صحة الأسعار
      if (input.listingType !== 'physical_only' && !input.nftPrice) {
        throw new Error('سعر NFT مطلوب');
      }
      if (input.listingType !== 'nft_only' && !input.physicalPrice) {
        throw new Error('سعر الطابع المادي مطلوب');
      }

      // حساب رسم المنصة (5%)
      const platformFee = calculateTotalPlatformFee(input.nftPrice, input.physicalPrice);

      const result = await db.insert(stampListings).values({
        stampId: input.stampId,
        sellerId,
        listingType: input.listingType,
        nftPrice: input.nftPrice ? input.nftPrice.toString() : null,
        physicalPrice: input.physicalPrice ? input.physicalPrice.toString() : null,
        platformFee: platformFee.toString(),
        description: input.description,
        shippingCompany: input.shippingCompany,
        status: 'active',
      });

      return {
        listingId: result.insertId,
        status: 'active',
        message: 'تم إنشاء القائمة بنجاح',
        platformFee,
      };
    }),

  /**
   * الحصول على القوائم النشطة
   * Get active listings
   */
  getListings: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
        listingType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const listings = await db.query.stampListings.findMany({
        limit: input.limit,
        offset: input.offset,
      });

      return {
        listings,
        count: listings.length,
      };
    }),

  /**
   * قبول عرض تداول
   * Accept a trade offer
   */
  acceptTrade: publicProcedure
    .input(CreateTradeInput)
    .mutation(async ({ input, ctx }) => {
      const buyerId = input.buyerId;

      // الحصول على القائمة
      const listing = await db.query.stampListings.findFirst({
        where: eq(stampListings.id, input.listingId),
      });

      if (!listing) {
        throw new Error('القائمة غير موجودة');
      }

      // حساب المبلغ الإجمالي
      let totalAmount = 0;
      const nftPrice = input.buyNft ? parseFloat(listing.nftPrice?.toString() || '0') : 0;
      const physicalPrice = input.buyPhysical ? parseFloat(listing.physicalPrice?.toString() || '0') : 0;
      const platformFee = calculateTotalPlatformFee(nftPrice || undefined, physicalPrice || undefined);
      const shippingCost = input.buyPhysical ? 50 : 0; // تكلفة شحن افتراضية
      const insuranceCost = input.buyPhysical ? 10 : 0; // تأمين افتراضي

      totalAmount = nftPrice + physicalPrice + platformFee + shippingCost + insuranceCost;

      // إنشاء معاملة جديدة
      const tradeResult = await db.insert(stampTrades).values({
        listingId: input.listingId,
        stampId: input.stampId,
        sellerId: listing.sellerId,
        buyerId,
        nftPrice: nftPrice || null,
        physicalPrice: physicalPrice || null,
        platformFee: platformFee.toString(),
        shippingCost: shippingCost || null,
        insuranceCost: insuranceCost || null,
        totalAmount: totalAmount.toString(),
        tradeStatus: 'pending',
        paymentStatus: 'pending',
      });

      // إنشاء حساب رصيد احتياطي
      await db.insert(escrowAccounts).values({
        tradeId: tradeResult.insertId,
        buyerId,
        sellerId: listing.sellerId,
        holdAmount: totalAmount.toString(),
        status: 'held',
        holdStartDate: new Date(),
      });

      // تسجيل معاملة في السجل
      await db.insert(balanceTransactions).values({
        userId: buyerId,
        transactionType: 'escrow_hold',
        amount: totalAmount.toString(),
        relatedTradeId: tradeResult.insertId,
        relatedStampId: input.stampId,
        description: `حجز احتياطي لشراء طابع`,
        status: 'completed',
      });

      return {
        tradeId: tradeResult.insertId,
        totalAmount,
        escrowAmount: totalAmount,
        breakdown: {
          nftPrice,
          physicalPrice,
          platformFee,
          shippingCost,
          insuranceCost,
        },
        message: 'تم إنشاء المعاملة بنجاح. تم حجز الأموال احتياطياً',
      };
    }),

  /**
   * الموافقة على المعاملة من قبل البائع
   * Approve trade (seller)
   */
  approveTrade: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trade = await db.query.stampTrades.findFirst({
        where: eq(stampTrades.id, input.tradeId),
      });

      if (!trade) {
        throw new Error('المعاملة غير موجودة');
      }

      // تحديث حالة المعاملة
      await db
        .update(stampTrades)
        .set({
          sellerApproved: true,
          sellerSignedAt: new Date(),
          tradeStatus: 'payment_pending',
          updatedAt: new Date(),
        })
        .where(eq(stampTrades.id, input.tradeId));

      return {
        tradeId: input.tradeId,
        message: 'تم الموافقة على المعاملة من قبل البائع',
      };
    }),

  /**
   * الموافقة على المعاملة من قبل المشتري
   * Approve trade (buyer)
   */
  approveBuyerTrade: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trade = await db.query.stampTrades.findFirst({
        where: eq(stampTrades.id, input.tradeId),
      });

      if (!trade) {
        throw new Error('المعاملة غير موجودة');
      }

      // تحديث حالة المعاملة
      await db
        .update(stampTrades)
        .set({
          buyerApproved: true,
          buyerSignedAt: new Date(),
          paymentStatus: 'completed',
          tradeStatus: 'shipped',
          updatedAt: new Date(),
        })
        .where(eq(stampTrades.id, input.tradeId));

      return {
        tradeId: input.tradeId,
        message: 'تم الموافقة على المعاملة من قبل المشتري',
      };
    }),

  /**
   * الحصول على تفاصيل المعاملة
   * Get trade details
   */
  getTrade: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ input }) => {
      const trade = await db.query.stampTrades.findFirst({
        where: eq(stampTrades.id, input.tradeId),
      });

      if (!trade) {
        throw new Error('المعاملة غير موجودة');
      }

      // الحصول على معلومات الرصيد الاحتياطي
      const escrow = await db.query.escrowAccounts.findFirst({
        where: eq(escrowAccounts.tradeId, input.tradeId),
      });

      return {
        ...trade,
        escrow,
      };
    }),

  /**
   * الحصول على معاملات المستخدم
   * Get user trades
   */
  getUserTrades: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['buyer', 'seller', 'both']).optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let trades: any[] = [];

      if (input.role === 'seller' || input.role === 'both') {
        const sellerTrades = await db.query.stampTrades.findMany();
        trades = [...trades, ...sellerTrades];
      }

      if (input.role === 'buyer' || input.role === 'both') {
        const buyerTrades = await db.query.stampTrades.findMany();
        trades = [...trades, ...buyerTrades];
      }

      // فلترة حسب الحالة إذا تم تحديدها
      if (input.status) {
        trades = trades.filter((t) => t.tradeStatus === input.status);
      }

      return {
        trades,
        count: trades.length,
      };
    }),

  /**
   * إتمام المعاملة
   * Complete trade
   */
  completeTrade: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trade = await db.query.stampTrades.findFirst({
        where: eq(stampTrades.id, input.tradeId),
      });

      if (!trade) {
        throw new Error('المعاملة غير موجودة');
      }

      // الحصول على معلومات الرصيد الاحتياطي
      const escrow = await db.query.escrowAccounts.findFirst({
        where: eq(escrowAccounts.tradeId, input.tradeId),
      });

      if (!escrow) {
        throw new Error('معلومات الرصيد الاحتياطي غير موجودة');
      }

      // إفراج عن الأموال للبائع
      const totalAmount = parseFloat(trade.totalAmount?.toString() || '0');
      const sellerPayment = totalAmount * 0.95; // 95% للبائع، 5% رسم المنصة

      await db
        .update(escrowAccounts)
        .set({
          status: 'released_to_seller',
          releaseDate: new Date(),
        })
        .where(eq(escrowAccounts.id, escrow.id));

      // تسجيل معاملات الإفراج
      await db.insert(balanceTransactions).values({
        userId: trade.sellerId,
        transactionType: 'escrow_release',
        amount: sellerPayment.toString(),
        relatedTradeId: input.tradeId,
        description: 'إفراج عن أموال البيع',
        status: 'completed',
      });

      // تحديث حالة المعاملة
      await db
        .update(stampTrades)
        .set({
          tradeStatus: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stampTrades.id, input.tradeId));

      return {
        tradeId: input.tradeId,
        sellerPayment,
        message: 'تم إتمام المعاملة بنجاح',
      };
    }),

  /**
   * فتح نزاع
   * Open dispute
   */
  openDispute: publicProcedure
    .input(
      z.object({
        tradeId: z.number(),
        claimantId: z.string(),
        reason: z.enum([
          'item_not_received',
          'item_damaged',
          'item_not_as_described',
          'unauthorized_transaction',
          'other',
        ]),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const trade = await db.query.stampTrades.findFirst({
        where: eq(stampTrades.id, input.tradeId),
      });

      if (!trade) {
        throw new Error('المعاملة غير موجودة');
      }

      // تحديد الطرف الآخر
      const respondentId =
        input.claimantId === trade.buyerId ? trade.sellerId : trade.buyerId;

      // إنشاء نزاع جديد
      const result = await db.insert(disputes).values({
        tradeId: input.tradeId,
        stampId: trade.stampId,
        claimantId: input.claimantId,
        respondentId,
        disputeReason: input.reason,
        description: input.description,
        status: 'open',
      });

      // تحديث حالة المعاملة
      await db
        .update(stampTrades)
        .set({
          tradeStatus: 'disputed',
          updatedAt: new Date(),
        })
        .where(eq(stampTrades.id, input.tradeId));

      return {
        disputeId: result.insertId,
        tradeId: input.tradeId,
        status: 'open',
        message: 'تم فتح نزاع. سيتم مراجعة الحالة من قبل فريق الدعم',
      };
    }),

  /**
   * الحصول على رصيد المستخدم الاحتياطي
   * Get user reserve balance
   */
  getReserveBalance: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      let balance = await db.query.userReserveBalance.findFirst({
        where: eq(userReserveBalance.userId, input.userId),
      });

      if (!balance) {
        // إنشاء رصيد جديد إذا لم يكن موجوداً
        await db.insert(userReserveBalance).values({
          userId: input.userId,
          totalBalance: '0',
          availableBalance: '0',
          heldInEscrow: '0',
        });

        balance = await db.query.userReserveBalance.findFirst({
          where: eq(userReserveBalance.userId, input.userId),
        });
      }

      return balance;
    }),

  /**
   * الحصول على سجل المعاملات المالية
   * Get balance transaction history
   */
  getTransactionHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const transactions = await db.query.balanceTransactions.findMany();

      return {
        transactions,
        count: transactions.length,
      };
    }),
});
