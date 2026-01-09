/**
 * @fileoverview StampCoin Platform - Database Configuration
 * @copyright © 2024-2026 Stampcoin Platform. All Rights Reserved.
 * @license Proprietary - See LICENSE file for details
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 * For licensing inquiries: legal@stampcoin.platform
 */

import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
