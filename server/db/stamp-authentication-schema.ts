/**
 * نظام توثيق وتداول الطوابع
 * Stamp Authentication & Trading System Schema
 */

import { int as integer, varchar, decimal, datetime, boolean, json, text, mysqlEnum } from 'drizzle-orm/mysql-core';
import { mysqlTable } from 'drizzle-orm/mysql-core';

// ============================================================================
// جداول نظام التوثيق (Authentication Tables)
// ============================================================================

/**
 * جدول الطوابع الموثقة
 * Authenticated Stamps Table
 */
export const authenticatedStamps = mysqlTable('authenticated_stamps', {
  id: integer('id').primaryKey().autoincrement(),
  
  // معلومات الطابع الأساسية
  userId: varchar('user_id', { length: 255 }).notNull(), // المالك الأصلي
  stampName: varchar('stamp_name', { length: 255 }).notNull(),
  stampCountry: varchar('stamp_country', { length: 100 }).notNull(),
  stampYear: integer('stamp_year'),
  stampCatalogNumber: varchar('stamp_catalog_number', { length: 100 }),
  stampCondition: mysqlEnum('stamp_condition', ['mint', 'used', 'fine', 'very_fine']).notNull(),
  
  // الصورة و NFT
  imageUrl: varchar('image_url', { length: 500 }),
  imageIpfsHash: varchar('image_ipfs_hash', { length: 100 }), // على IPFS
  nftTokenId: varchar('nft_token_id', { length: 100 }), // NFT token ID
  nftContractAddress: varchar('nft_contract_address', { length: 100 }),
  
  // التقييم والقيمة
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }), // بالدولار
  stampCoinValue: integer('stamp_coin_value'), // بعملة الموقع
  rarity: mysqlEnum('rarity', ['common', 'uncommon', 'rare', 'very_rare', 'legendary']),
  
  // تكاليف التوثيق
  authenticationFee: decimal('authentication_fee', { precision: 10, scale: 2 }), // سعر التوثيق
  nftMintingFee: decimal('nft_minting_fee', { precision: 10, scale: 2 }), // سعر السك
  storageFee: decimal('storage_fee', { precision: 10, scale: 2 }), // سعر التخزين
  totalFee: decimal('total_fee', { precision: 10, scale: 2 }).notNull(), // المجموع
  feesPaid: boolean('fees_paid').default(false), // تم الدفع؟
  paymentStatus: mysqlEnum('payment_status', ['pending', 'completed', 'failed']).default('pending'),
  
  // معلومات التوثيق
  authenticationStatus: mysqlEnum('authentication_status', ['pending', 'verified', 'rejected']).default('pending'),
  certificationNumber: varchar('certification_number', { length: 100 }), // رقم الشهادة
  authenticationDetails: json('authentication_details'), // تفاصيل التوثيق
  
  // المواقع والتحفظات
  certificates: json('certificates'), // الشهادات المرفقة
  shippingDocuments: json('shipping_documents'), // وثائق الشحن
  invoices: json('invoices'), // الفواتير
  
  // الحالة
  status: mysqlEnum('status', ['draft', 'pending_auth', 'authenticated', 'listed', 'sold', 'archived']).default('draft'),
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull().default(new Date()),
  
  // التتبع
  viewCount: integer('view_count').default(0),
  tradeCount: integer('trade_count').default(0),
});

// ============================================================================
// جداول التداول (Trading Tables)
// ============================================================================

/**
 * جدول قوائم البيع (Listings)
 * NFT Trading Listings
 */
export const stampListings = mysqlTable('stamp_listings', {
  id: integer('id').primaryKey().autoincrement(),
  stampId: integer('stamp_id').notNull(),
  sellerId: varchar('seller_id', { length: 255 }).notNull(),
  
  // تفاصيل القائمة
  listingType: mysqlEnum('listing_type', ['nft_only', 'physical_only', 'both']).notNull(),
  nftPrice: decimal('nft_price', { precision: 10, scale: 2 }), // سعر NFT
  physicalPrice: decimal('physical_price', { precision: 10, scale: 2 }), // سعر الطابع الحقيقي
  
  // رسوم المنصة
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }).notNull(), // نسبة من السعر
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }), // تكلفة الشحن
  insuranceCost: decimal('insurance_cost', { precision: 10, scale: 2 }), // تكلفة التأمين
  
  // المواقع والشروط
  description: text('description'),
  shippingCompany: varchar('shipping_company', { length: 100 }),
  shippingTrackingNumber: varchar('shipping_tracking_number', { length: 100 }),
  
  // الحالة
  status: mysqlEnum('listing_status', ['active', 'pending', 'sold', 'cancelled']).default('active'),
  createdAt: datetime('created_at').notNull().default(new Date()),
  expiresAt: datetime('expires_at'),
  soldAt: datetime('sold_at'),
});

/**
 * جدول المعاملات (Trades)
 * P2P Trading Transactions
 */
export const stampTrades = mysqlTable('stamp_trades', {
  id: integer('id').primaryKey().autoincrement(),
  listingId: integer('listing_id').notNull(),
  stampId: integer('stamp_id').notNull(),
  
  // الأطراف
  sellerId: varchar('seller_id', { length: 255 }).notNull(),
  buyerId: varchar('buyer_id', { length: 255 }).notNull(),
  
  // الأسعار والرسوم
  nftPrice: decimal('nft_price', { precision: 10, scale: 2 }),
  physicalPrice: decimal('physical_price', { precision: 10, scale: 2 }),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  insuranceCost: decimal('insurance_cost', { precision: 10, scale: 2 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // تنفيذ التداول
  tradeStatus: mysqlEnum('trade_status', ['pending', 'payment_pending', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled']).default('pending'),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']).default('pending'),
  
  // معلومات الشحن
  shippingCompany: varchar('shipping_company', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippingDocuments: json('shipping_documents'),
  estimatedDelivery: datetime('estimated_delivery'),
  deliveredAt: datetime('delivered_at'),
  
  // التواقيع والموافقات
  sellerApproved: boolean('seller_approved').default(false),
  buyerApproved: boolean('buyer_approved').default(false),
  sellerSignedAt: datetime('seller_signed_at'),
  buyerSignedAt: datetime('buyer_signed_at'),
  
  // الأوقات
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull().default(new Date()),
  completedAt: datetime('completed_at'),
});

// ============================================================================
// جداول الرصيد الاحتياطي والتأمين (Escrow & Reserve)
// ============================================================================

/**
 * جدول الأرصدة الاحتياطية (Escrow Accounts)
 * يحفظ الأموال حتى تكتمل المعاملة
 */
export const escrowAccounts = mysqlTable('escrow_accounts', {
  id: integer('id').primaryKey().autoincrement(),
  tradeId: integer('trade_id').notNull().unique(),
  
  // الأطراف
  buyerId: varchar('buyer_id', { length: 255 }).notNull(),
  sellerId: varchar('seller_id', { length: 255 }).notNull(),
  
  // الأموال
  holdAmount: decimal('hold_amount', { precision: 10, scale: 2 }).notNull(), // الكمية المحتفظ بها
  currency: varchar('currency', { length: 20 }).default('STAMP_COIN'),
  
  // حالة الحفظ
  status: mysqlEnum('escrow_status', ['held', 'released_to_seller', 'refunded_to_buyer', 'disputed']).default('held'),
  holdStartDate: datetime('hold_start_date').notNull().default(new Date()),
  releaseDate: datetime('release_date'),
  
  // معلومات الإفراج
  releaseReason: varchar('release_reason', { length: 255 }),
  notes: text('notes'),
});

/**
 * جدول الرصيد الاحتياطي للمستخدم
 * User Reserve Balance
 */
export const userReserveBalance = mysqlTable('user_reserve_balance', {
  id: integer('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  
  // الرصيد
  totalBalance: decimal('total_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  heldInEscrow: decimal('held_in_escrow', { precision: 15, scale: 2 }).notNull().default('0'),
  
  // التاريخ
  lastUpdated: datetime('last_updated').notNull().default(new Date()),
  createdAt: datetime('created_at').notNull().default(new Date()),
});

/**
 * جدول سجل معاملات الرصيد
 * Balance Transaction Log
 */
export const balanceTransactions = mysqlTable('balance_transactions', {
  id: integer('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  
  // نوع المعاملة
  transactionType: mysqlEnum('transaction_type', [
    'deposit', // إيداع
    'withdrawal', // سحب
    'fee_charged', // رسم
    'escrow_hold', // حفظ احتياطي
    'escrow_release', // إفراج عن احتياطي
    'trade_payment', // دفع تداول
    'trade_refund', // استرجاع تداول
    'purchase_nft', // شراء NFT
    'sell_nft', // بيع NFT
  ]).notNull(),
  
  // المبلغ
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 20 }).default('STAMP_COIN'),
  
  // المرجع
  relatedTradeId: integer('related_trade_id'),
  relatedStampId: integer('related_stamp_id'),
  description: text('description'),
  
  // التاريخ
  createdAt: datetime('created_at').notNull().default(new Date()),
  
  // الحالة
  status: mysqlEnum('status', ['pending', 'completed', 'failed', 'reversed']).default('completed'),
});

// ============================================================================
// جداول الشحن والوثائق (Shipping & Documents)
// ============================================================================

/**
 * جدول معلومات الشحن
 * Shipping Information
 */
export const shippingRecords = mysqlTable('shipping_records', {
  id: integer('id').primaryKey().autoincrement(),
  tradeId: integer('trade_id').notNull(),
  stampId: integer('stamp_id').notNull(),
  
  // معلومات الشحن
  shippingCompany: varchar('shipping_company', { length: 100 }).notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  shippingDate: datetime('shipping_date').notNull(),
  estimatedDeliveryDate: datetime('estimated_delivery_date'),
  actualDeliveryDate: datetime('actual_delivery_date'),
  
  // المرسل والمستقبل
  senderName: varchar('sender_name', { length: 255 }).notNull(),
  senderAddress: text('sender_address').notNull(),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientAddress: text('recipient_address').notNull(),
  
  // الحزم
  packageWeight: decimal('package_weight', { precision: 8, scale: 3 }), // بالكيلوجرام
  packageDimensions: varchar('package_dimensions', { length: 100 }), // الأبعاد
  packageDescription: text('package_description'),
  
  // القيمة والتأمين
  declaredValue: decimal('declared_value', { precision: 10, scale: 2 }),
  insuranceAmount: decimal('insurance_amount', { precision: 10, scale: 2 }),
  
  // الحالة
  status: mysqlEnum('shipping_status', ['pending', 'in_transit', 'delivered', 'lost', 'damaged', 'returned']).default('pending'),
  lastStatusUpdate: datetime('last_status_update').notNull().default(new Date()),
  
  // الوثائق
  invoiceUrl: varchar('invoice_url', { length: 500 }),
  labelUrl: varchar('label_url', { length: 500 }),
  proofOfDelivery: varchar('proof_of_delivery', { length: 500 }),
  
  createdAt: datetime('created_at').notNull().default(new Date()),
});

/**
 * جدول الفواتير والوثائق
 * Invoices & Documents
 */
export const invoices = mysqlTable('invoices', {
  id: integer('id').primaryKey().autoincrement(),
  tradeId: integer('trade_id').notNull(),
  stampId: integer('stamp_id').notNull(),
  
  // رقم الفاتورة
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  
  // الأطراف
  sellerId: varchar('seller_id', { length: 255 }).notNull(),
  buyerId: varchar('buyer_id', { length: 255 }).notNull(),
  
  // التفاصيل
  itemDescription: text('item_description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  
  // الرسوم والضرائب
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  insuranceCost: decimal('insurance_cost', { precision: 10, scale: 2 }),
  tax: decimal('tax', { precision: 10, scale: 2 }),
  
  // الإجمالي
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  
  // الحالة
  status: mysqlEnum('invoice_status', ['draft', 'issued', 'paid', 'overdue', 'cancelled']).default('issued'),
  issuedDate: datetime('issued_date').notNull().default(new Date()),
  dueDate: datetime('due_date'),
  paidDate: datetime('paid_date'),
  
  // الملفات
  pdfUrl: varchar('pdf_url', { length: 500 }),
  documentUrl: varchar('document_url', { length: 500 }),
});

// ============================================================================
// جداول النزاعات والمطالبات (Disputes & Claims)
// ============================================================================

/**
 * جدول النزاعات
 * Dispute Resolution
 */
export const disputes = mysqlTable('disputes', {
  id: integer('id').primaryKey().autoincrement(),
  tradeId: integer('trade_id').notNull().unique(),
  stampId: integer('stamp_id').notNull(),
  
  // الأطراف
  claimantId: varchar('claimant_id', { length: 255 }).notNull(),
  respondentId: varchar('respondent_id', { length: 255 }).notNull(),
  
  // الشكوى
  disputeReason: mysqlEnum('dispute_reason', [
    'item_not_received',
    'item_damaged',
    'item_not_as_described',
    'unauthorized_transaction',
    'other',
  ]).notNull(),
  
  description: text('description').notNull(),
  evidence: json('evidence'), // الأدلة والصور
  
  // الحالة
  status: mysqlEnum('dispute_status', ['open', 'under_review', 'resolved', 'escalated', 'closed']).default('open'),
  resolution: text('resolution'), // القرار
  
  // الأوقات
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull().default(new Date()),
  resolvedAt: datetime('resolved_at'),
});
