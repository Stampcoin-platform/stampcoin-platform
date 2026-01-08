-- ============================================================================
-- Stamp Authentication & Trading System Database Schema
-- نظام توثيق وتداول الطوابع - قاعدة البيانات
-- ============================================================================

-- Table: stamp_submissions (الطوابع المرفوعة للتوثيق)
CREATE TABLE IF NOT EXISTS stamp_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- Stamp Details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  country VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  denomination VARCHAR(50),
  condition ENUM('mint', 'very_fine', 'fine', 'used', 'poor') NOT NULL,
  rarity ENUM('common', 'uncommon', 'rare', 'very_rare', 'legendary') NOT NULL,
  estimated_value DECIMAL(10, 2) NOT NULL, -- USD
  
  -- Images & Documents
  images JSON NOT NULL, -- Array of image URLs
  certificate_of_authenticity TEXT,
  ownership_proof TEXT,
  
  -- Authentication
  auth_certificate VARCHAR(100) UNIQUE NOT NULL,
  verified_by INT, -- Admin user ID
  verification_notes TEXT,
  
  -- Minting
  minting_cost_usd DECIMAL(10, 2) NOT NULL,
  minting_cost_stampcoins INT NOT NULL,
  paid_at TIMESTAMP NULL,
  nft_token_id INT NULL,
  ipfs_hash VARCHAR(100) NULL,
  blockchain_tx_hash VARCHAR(100) NULL,
  
  -- Status
  status ENUM(
    'pending_verification',  -- في انتظار التحقق
    'verified',              -- تم التحقق
    'rejected',              -- مرفوض
    'payment_received',      -- تم الدفع
    'minting',               -- جاري السك
    'minted',                -- تم السك
    'failed'                 -- فشل
  ) NOT NULL DEFAULT 'pending_verification',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  minted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_auth_certificate (auth_certificate),
  INDEX idx_nft_token_id (nft_token_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_balances (أرصدة المستخدمين)
CREATE TABLE IF NOT EXISTS user_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  
  -- Balances in StampCoins
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  escrow_locked DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: transactions (المعاملات)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- Transaction Details
  type ENUM(
    'minting_payment',      -- دفع السك
    'deposit',              -- إيداع
    'withdrawal',           -- سحب
    'nft_sale',            -- بيع NFT
    'nft_purchase',        -- شراء NFT
    'physical_sale',       -- بيع طابع حقيقي
    'physical_purchase',   -- شراء طابع حقيقي
    'escrow_deposit',      -- إيداع ضمان
    'escrow_release',      -- إطلاق ضمان
    'escrow_refund',       -- استرداد ضمان
    'platform_fee',        -- أتعاب المنصة
    'reward'               -- مكافأة
  ) NOT NULL,
  
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  
  description TEXT,
  reference_id VARCHAR(100), -- Trade ID, Submission ID, etc.
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_reference_id (reference_id),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: physical_trades (تداول الطوابع الحقيقية)
CREATE TABLE IF NOT EXISTS physical_trades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trade_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Parties
  stamp_id INT NOT NULL,
  seller_id INT NOT NULL,
  buyer_id INT NOT NULL,
  
  -- Price & Escrow
  agreed_price DECIMAL(10, 2) NOT NULL,
  buyer_deposit DECIMAL(10, 2) NOT NULL,
  seller_deposit DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  
  -- Shipping
  shipping_company ENUM('DHL', 'FedEx', 'UPS', 'USPS', 'Aramex', 'Other') NOT NULL,
  tracking_number VARCHAR(100) NULL,
  insurance_amount DECIMAL(10, 2) NOT NULL,
  shipping_receipt TEXT NULL, -- Base64 image
  package_photos JSON NULL, -- Array of Base64 images
  
  -- Addresses
  buyer_address JSON NOT NULL,
  seller_address JSON NOT NULL,
  
  -- Status
  status ENUM(
    'escrow_pending',      -- في انتظار إيداع الضمان
    'escrow_locked',       -- تم قفل الضمان
    'shipped',             -- تم الشحن
    'in_transit',          -- في الطريق
    'delivered',           -- تم التسليم
    'completed',           -- مكتمل
    'disputed',            -- نزاع
    'cancelled',           -- ملغى
    'refunded'             -- مسترد
  ) NOT NULL DEFAULT 'escrow_pending',
  
  -- Feedback
  buyer_rating INT NULL, -- 1-5
  buyer_feedback TEXT NULL,
  seller_rating INT NULL, -- 1-5
  seller_feedback TEXT NULL,
  receipt_photos JSON NULL, -- Buyer's receipt photos
  
  -- Dispute
  dispute_reason TEXT NULL,
  dispute_resolution TEXT NULL,
  resolved_by INT NULL, -- Admin user ID
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  escrow_locked_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  disputed_at TIMESTAMP NULL,
  
  INDEX idx_trade_id (trade_id),
  INDEX idx_stamp_id (stamp_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_status (status),
  
  FOREIGN KEY (stamp_id) REFERENCES stamp_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: nft_trades (تداول صور NFT)
CREATE TABLE IF NOT EXISTS nft_trades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trade_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- NFT Details
  nft_token_id INT NOT NULL,
  stamp_id INT NOT NULL,
  
  -- Parties
  seller_id INT NOT NULL,
  buyer_id INT NOT NULL,
  
  -- Price
  price DECIMAL(10, 2) NOT NULL, -- StampCoins
  platform_fee DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status ENUM(
    'pending',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_nft_token_id (nft_token_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_status (status),
  
  FOREIGN KEY (stamp_id) REFERENCES stamp_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: platform_revenue (إيرادات المنصة)
CREATE TABLE IF NOT EXISTS platform_revenue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  amount DECIMAL(10, 2) NOT NULL,
  source ENUM(
    'minting_fee',
    'escrow_trade',
    'nft_trade',
    'subscription',
    'other'
  ) NOT NULL,
  
  trade_id VARCHAR(100) NULL,
  submission_id INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_source (source),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: shipping_tracking (تتبع الشحنات)
CREATE TABLE IF NOT EXISTS shipping_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  trade_id VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100) NOT NULL,
  shipping_company VARCHAR(50) NOT NULL,
  
  -- Status updates from shipping API
  status VARCHAR(50) NOT NULL,
  location VARCHAR(200),
  description TEXT,
  
  -- Timestamp
  event_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_trade_id (trade_id),
  INDEX idx_tracking_number (tracking_number),
  
  FOREIGN KEY (trade_id) REFERENCES physical_trades(trade_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Create platform revenue account
INSERT IGNORE INTO users (username, email, password, role, created_at)
VALUES ('platform', 'platform@stampcoin.com', 'N/A', 'admin', NOW());

-- ============================================================================
-- Views
-- ============================================================================

-- View: User balance summary
CREATE OR REPLACE VIEW user_balance_summary AS
SELECT 
  ub.user_id,
  u.username,
  u.email,
  ub.balance as available_balance,
  ub.escrow_locked,
  (ub.balance + ub.escrow_locked) as total_balance,
  ub.total_earned,
  ub.total_spent,
  COUNT(DISTINCT ss.id) as total_stamps_submitted,
  COUNT(DISTINCT CASE WHEN ss.status = 'minted' THEN ss.id END) as total_stamps_minted,
  COUNT(DISTINCT pt.id) as total_physical_trades,
  COUNT(DISTINCT nt.id) as total_nft_trades
FROM user_balances ub
JOIN users u ON ub.user_id = u.id
LEFT JOIN stamp_submissions ss ON u.id = ss.user_id
LEFT JOIN physical_trades pt ON (u.id = pt.seller_id OR u.id = pt.buyer_id)
LEFT JOIN nft_trades nt ON (u.id = nt.seller_id OR u.id = nt.buyer_id)
GROUP BY ub.user_id, u.username, u.email, ub.balance, ub.escrow_locked, ub.total_earned, ub.total_spent;

-- View: Active trades summary
CREATE OR REPLACE VIEW active_trades_summary AS
SELECT 
  pt.trade_id,
  pt.status,
  ss.title as stamp_title,
  seller.username as seller_name,
  buyer.username as buyer_name,
  pt.agreed_price,
  pt.shipping_company,
  pt.tracking_number,
  pt.created_at,
  pt.shipped_at
FROM physical_trades pt
JOIN stamp_submissions ss ON pt.stamp_id = ss.id
JOIN users seller ON pt.seller_id = seller.id
JOIN users buyer ON pt.buyer_id = buyer.id
WHERE pt.status IN ('escrow_locked', 'shipped', 'in_transit', 'delivered')
ORDER BY pt.created_at DESC;
