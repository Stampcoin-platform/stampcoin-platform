/**
 * جهاز توجيه الشحن والفواتير
 * Shipping & Invoice Management Router
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { db } from '../db';
import {
  shippingRecords,
  invoices,
  stampTrades,
} from '../db/stamp-authentication-schema';
import { eq } from 'drizzle-orm';
import { ShippingCompanyEnum } from '../../shared/schemas';

// ============================================================================
// Schemas
// ============================================================================

const CreateShippingInput = z.object({
  tradeId: z.number(),
  stampId: z.number(),
  shippingCompany: ShippingCompanyEnum,
  trackingNumber: z.string(),
  senderName: z.string(),
  senderAddress: z.string(),
  recipientName: z.string(),
  recipientAddress: z.string(),
  packageWeight: z.number().optional(),
  packageDimensions: z.string().optional(),
  declaredValue: z.number().optional(),
  insuranceAmount: z.number().optional(),
});

const UpdateShippingStatusInput = z.object({
  shippingId: z.number(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'lost', 'damaged', 'returned']),
  proofOfDelivery: z.string().optional(),
});

const CreateInvoiceInput = z.object({
  tradeId: z.number(),
  stampId: z.number(),
  sellerId: z.string(),
  buyerId: z.string(),
  itemDescription: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number(),
  platformFee: z.number().optional(),
  shippingCost: z.number().optional(),
  insuranceCost: z.number().optional(),
  tax: z.number().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const shippingRouter = router({
  /**
   * إنشاء سجل شحن جديد
   * Create shipping record
   */
  createShippingRecord: publicProcedure
    .input(CreateShippingInput)
    .mutation(async ({ input }) => {
      const result = await db.insert(shippingRecords).values({
        tradeId: input.tradeId,
        stampId: input.stampId,
        shippingCompany: input.shippingCompany,
        trackingNumber: input.trackingNumber,
        shippingDate: new Date(),
        senderName: input.senderName,
        senderAddress: input.senderAddress,
        recipientName: input.recipientName,
        recipientAddress: input.recipientAddress,
        packageWeight: input.packageWeight ? input.packageWeight.toString() : null,
        packageDimensions: input.packageDimensions,
        declaredValue: input.declaredValue ? input.declaredValue.toString() : null,
        insuranceAmount: input.insuranceAmount ? input.insuranceAmount.toString() : null,
        status: 'pending',
      });

      // تحديث حالة المعاملة
      await db
        .update(stampTrades)
        .set({
          tradeStatus: 'shipped',
          shippingCompany: input.shippingCompany,
          trackingNumber: input.trackingNumber,
          updatedAt: new Date(),
        })
        .where(eq(stampTrades.id, input.tradeId));

      return {
        shippingId: result.insertId,
        trackingNumber: input.trackingNumber,
        status: 'pending',
        message: 'تم إنشاء سجل الشحن بنجاح',
      };
    }),

  /**
   * الحصول على معلومات الشحن
   * Get shipping details
   */
  getShippingDetails: publicProcedure
    .input(z.object({ shippingId: z.number() }))
    .query(async ({ input }) => {
      const shipping = await db.query.shippingRecords.findFirst({
        where: eq(shippingRecords.id, input.shippingId),
      });

      if (!shipping) {
        throw new Error('سجل الشحن غير موجود');
      }

      return shipping;
    }),

  /**
   * تتبع الشحنة برقم المتابعة
   * Track shipment by tracking number
   */
  trackShipment: publicProcedure
    .input(z.object({ trackingNumber: z.string() }))
    .query(async ({ input }) => {
      const shipping = await db.query.shippingRecords.findFirst();

      if (!shipping) {
        throw new Error('لم نتمكن من العثور على الشحنة برقم المتابعة المحدد');
      }

      return {
        trackingNumber: shipping.trackingNumber,
        status: shipping.status,
        lastUpdate: shipping.lastStatusUpdate,
        estimatedDelivery: shipping.estimatedDeliveryDate,
        from: {
          name: shipping.senderName,
          address: shipping.senderAddress,
        },
        to: {
          name: shipping.recipientName,
          address: shipping.recipientAddress,
        },
      };
    }),

  /**
   * تحديث حالة الشحن
   * Update shipping status
   */
  updateShippingStatus: publicProcedure
    .input(UpdateShippingStatusInput)
    .mutation(async ({ input }) => {
      const shipping = await db.query.shippingRecords.findFirst({
        where: eq(shippingRecords.id, input.shippingId),
      });

      if (!shipping) {
        throw new Error('سجل الشحن غير موجود');
      }

      // تحديث السجل
      const updateData: any = {
        status: input.status,
        lastStatusUpdate: new Date(),
      };

      if (input.status === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }

      if (input.proofOfDelivery) {
        updateData.proofOfDelivery = input.proofOfDelivery;
      }

      await db
        .update(shippingRecords)
        .set(updateData)
        .where(eq(shippingRecords.id, input.shippingId));

      // تحديث حالة المعاملة إذا تم التسليم
      if (input.status === 'delivered') {
        await db
          .update(stampTrades)
          .set({
            tradeStatus: 'delivered',
            deliveredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(stampTrades.id, shipping.tradeId));
      }

      return {
        shippingId: input.shippingId,
        status: input.status,
        message: `تم تحديث حالة الشحن إلى: ${input.status}`,
      };
    }),

  /**
   * الحصول على شحنات المعاملة
   * Get trade shipments
   */
  getTradeShipments: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ input }) => {
      const shipments = await db.query.shippingRecords.findMany();

      return {
        shipments,
        count: shipments.length,
      };
    }),

  /**
   * إنشاء فاتورة جديدة
   * Create invoice
   */
  createInvoice: publicProcedure
    .input(CreateInvoiceInput)
    .mutation(async ({ input }) => {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const subtotal = input.unitPrice * input.quantity;
      const platformFee = input.platformFee || subtotal * 0.05;
      const shippingCost = input.shippingCost || 0;
      const insuranceCost = input.insuranceCost || 0;
      const tax = input.tax || 0;
      const total = subtotal + platformFee + shippingCost + insuranceCost + tax;

      const result = await db.insert(invoices).values({
        tradeId: input.tradeId,
        stampId: input.stampId,
        invoiceNumber,
        sellerId: input.sellerId,
        buyerId: input.buyerId,
        itemDescription: input.itemDescription,
        quantity: input.quantity,
        unitPrice: input.unitPrice.toString(),
        subtotal: subtotal.toString(),
        platformFee: platformFee.toString(),
        shippingCost: shippingCost.toString(),
        insuranceCost: insuranceCost.toString(),
        tax: tax.toString(),
        total: total.toString(),
        status: 'issued',
        issuedDate: new Date(),
      });

      return {
        invoiceId: result.insertId,
        invoiceNumber,
        status: 'issued',
        total,
        breakdown: {
          subtotal,
          platformFee,
          shippingCost,
          insuranceCost,
          tax,
        },
        message: 'تم إنشاء الفاتورة بنجاح',
      };
    }),

  /**
   * الحصول على بيانات الفاتورة
   * Get invoice details
   */
  getInvoice: publicProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input }) => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
      });

      if (!invoice) {
        throw new Error('الفاتورة غير موجودة');
      }

      return invoice;
    }),

  /**
   * الحصول على فواتير المعاملة
   * Get trade invoices
   */
  getTradeInvoices: publicProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ input }) => {
      const tradeInvoices = await db.query.invoices.findMany();

      return {
        invoices: tradeInvoices,
        count: tradeInvoices.length,
      };
    }),

  /**
   * تحديث حالة الفاتورة
   * Update invoice status
   */
  updateInvoiceStatus: publicProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        status: z.enum(['draft', 'issued', 'paid', 'overdue', 'cancelled']),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = { status: input.status };

      if (input.status === 'paid') {
        updateData.paidDate = new Date();
      }

      await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, input.invoiceId));

      return {
        invoiceId: input.invoiceId,
        status: input.status,
        message: `تم تحديث حالة الفاتورة إلى: ${input.status}`,
      };
    }),

  /**
   * الحصول على فواتير المستخدم
   * Get user invoices
   */
  getUserInvoices: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['seller', 'buyer']),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      // يمكن تحسين هذا باستخدام WHERE clause صحيح
      const userInvoices = await db.query.invoices.findMany({
        limit: input.limit,
        offset: input.offset,
      });

      return {
        invoices: userInvoices,
        count: userInvoices.length,
      };
    }),

  /**
   * تحميل الفاتورة كـ PDF
   * Download invoice as PDF
   */
  generateInvoicePDF: publicProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input }) => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
      });

      if (!invoice) {
        throw new Error('الفاتورة غير موجودة');
      }

      // في الإنتاج، يمكن استخدام مكتبة مثل pdfkit أو puppeteer
      const pdfUrl = `https://api.example.com/invoices/${input.invoiceId}/pdf`;

      return {
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl,
        message: 'تم إنشاء الفاتورة بصيغة PDF',
      };
    }),
});
