import { int, varchar, text, boolean, decimal, bigint, datetime, mysqlTable, primaryKey } from 'drizzle-orm/mysql-core';

/**
 * Schema extension for NFT minting support
 * Add these columns to the stamps table:
 * - nft_token_id: The ERC-721 token ID on Polygon
 * - ipfs_hash: IPFS hash of the NFT metadata
 * - contract_address: The NFT smart contract address
 * - transaction_hash: The blockchain transaction hash
 * - minted_at: When the NFT was minted
 * - is_minted: Whether this stamp has been minted as NFT
 * - category: The category for filtering (era, rarity, country)
 */

export const stampNftExtension = {
  nft_token_id: varchar('nft_token_id', { length: 255 }).unique(),
  ipfs_hash: varchar('ipfs_hash', { length: 255 }),
  ipfs_gateway_url: varchar('ipfs_gateway_url', { length: 500 }),
  contract_address: varchar('contract_address', { length: 42 }),
  transaction_hash: varchar('transaction_hash', { length: 66 }),
  minted_at: datetime('minted_at'),
  is_minted: boolean('is_minted').default(false),
  category: varchar('category', { length: 100 }), // e.g., 'era-1800s', 'rarity-legendary'
  royalty_percentage: decimal('royalty_percentage', { precision: 5, scale: 2 }).default('5.00'),
};

export interface StampWithNFT {
  id: number;
  country: string;
  year: number;
  name: string;
  denomination: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  imageUrl?: string;
  // NFT Fields
  nft_token_id?: string;
  ipfs_hash?: string;
  ipfs_gateway_url?: string;
  contract_address?: string;
  transaction_hash?: string;
  minted_at?: Date;
  is_minted?: boolean;
  category?: string;
  royalty_percentage?: number;
}

/**
 * Migration SQL (for manual execution if needed):
 * 
 * ALTER TABLE stamps ADD COLUMN nft_token_id VARCHAR(255) UNIQUE;
 * ALTER TABLE stamps ADD COLUMN ipfs_hash VARCHAR(255);
 * ALTER TABLE stamps ADD COLUMN ipfs_gateway_url VARCHAR(500);
 * ALTER TABLE stamps ADD COLUMN contract_address VARCHAR(42);
 * ALTER TABLE stamps ADD COLUMN transaction_hash VARCHAR(66);
 * ALTER TABLE stamps ADD COLUMN minted_at DATETIME;
 * ALTER TABLE stamps ADD COLUMN is_minted BOOLEAN DEFAULT FALSE;
 * ALTER TABLE stamps ADD COLUMN category VARCHAR(100);
 * ALTER TABLE stamps ADD COLUMN royalty_percentage DECIMAL(5, 2) DEFAULT 5.00;
 * 
 * CREATE INDEX idx_is_minted ON stamps(is_minted);
 * CREATE INDEX idx_category ON stamps(category);
 * CREATE INDEX idx_ipfs_hash ON stamps(ipfs_hash);
 */
