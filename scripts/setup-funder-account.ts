#!/usr/bin/env node

/**
 * Funder Account Setup Script
 * Creates a complete funder/partner account with all details
 * 
 * Usage: DATABASE_URL=mysql://... pnpm tsx scripts/setup-funder-account.ts
 */

import { db, upsertUser, getUserByOpenId, createPartner, getPartnerByUserId } from "../server/db";

interface FunderAccountData {
  // User Account Details
  openId: string;
  email: string;
  name: string;
  loginMethod: string;

  // Partner/Funder Details
  companyName: string;
  companyNameAr: string;
  description: string;
  descriptionAr: string;
  website: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  totalInvestment: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

/**
 * Funder account data
 * Update these values with actual LinkedIn and investment details
 */
const funderAccount: FunderAccountData = {
  // LinkedIn & Account Information
  openId: "linkedin_azadzedan13_" + Date.now(),
  email: "azadzedan13@gmail.com",
  name: "Azad Zedan",
  loginMethod: "linkedin",

  // Company/Funder Information
  companyName: "Azad Zedan - Strategic Funder",
  companyNameAr: "أزاد زيدان - ممول استراتيجي",
  description:
    "Strategic investor and founder with expertise in blockchain technology and digital assets. " +
    "Supporting innovative projects in the stamp collecting and NFT ecosystem.",
  descriptionAr:
    "مستثمر استراتيجي ومؤسس متخصص في تكنولوجيا البلوكتشين والأصول الرقمية. " +
    "يدعم المشاريع المبتكرة في النظام البيئي لجمع الطوابع و NFT.",

  // LinkedIn Profile and Website
  website: "https://linkedin.com/in/azadzedan13",

  // Partnership Tier Configuration
  tier: "platinum",

  // Investment Details
  totalInvestment: 50000, // USD

  // Contact Information
  contactPerson: "Azad Zedan",
  contactEmail: "azadzedan13@gmail.com",
  contactPhone: "+1 (555) 123-4567", // Update with actual phone
};

/**
 * Main function to create funder account
 */
async function setupFunderAccount() {
  try {
    console.log("🚀 Starting Funder Account Setup...\n");

    // Step 1: Create or update user account via upsertUser
    console.log("📝 Step 1: Setting up user account...");
    console.log(`   Email: ${funderAccount.email}`);
    console.log(`   Name: ${funderAccount.name}`);
    console.log(`   Login Method: ${funderAccount.loginMethod}`);

    // Upsert user account
    await upsertUser({
      openId: funderAccount.openId,
      email: funderAccount.email,
      name: funderAccount.name,
      loginMethod: funderAccount.loginMethod,
    });

    // Get the user ID
    const user = await getUserByOpenId(funderAccount.openId);
    if (!user) {
      throw new Error("Failed to create or retrieve user");
    }

    const userId = user.id;
    console.log(`   ✓ User account configured (ID: ${userId})`);

    // Step 2: Create or update partner/funder account
    console.log("\n💼 Step 2: Setting up partner/funder account...");
    console.log(`   Company: ${funderAccount.companyName}`);
    console.log(`   Tier: ${funderAccount.tier.toUpperCase()}`);
    console.log(`   Investment: $${funderAccount.totalInvestment.toLocaleString()}`);

    // Check if partner already exists
    const existingPartner = await getPartnerByUserId(userId);

    let partnerId: number;

    if (existingPartner) {
      console.log(`   ✓ Partner account already exists (ID: ${existingPartner.id})`);
      console.log(`   Status: ${existingPartner.status}`);
      partnerId = existingPartner.id;
    } else {
      // Create new partner/funder account
      const result = await createPartner({
        userId,
        companyName: funderAccount.companyName,
        companyNameAr: funderAccount.companyNameAr,
        description: funderAccount.description,
        descriptionAr: funderAccount.descriptionAr,
        website: funderAccount.website,
        tier: funderAccount.tier,
        totalInvestment: funderAccount.totalInvestment.toString(),
        contactPerson: funderAccount.contactPerson,
        contactEmail: funderAccount.contactEmail,
        contactPhone: funderAccount.contactPhone,
        status: "pending",
      });

      // Get the inserted ID from result
      partnerId = Array.isArray(result) && result[0] ? result[0] : 0;
      if (partnerId) {
        console.log(`   ✓ Partner account created (ID: ${partnerId})`);
      } else {
        console.log(`   ✓ Partner account created`);
      }
    }

    // Step 3: Display account summary
    console.log("\n✅ Funder Account Setup Complete!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 ACCOUNT SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n👤 User Account:");
    console.log(`   Email: ${funderAccount.email}`);
    console.log(`   Name: ${funderAccount.name}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Login Method: ${funderAccount.loginMethod}`);

    console.log("\n💼 Partner/Funder Account:");
    console.log(`   Company: ${funderAccount.companyName}`);
    console.log(`   Tier: ${funderAccount.tier.toUpperCase()}`);
    console.log(`   Investment: $${funderAccount.totalInvestment.toLocaleString()}`);
    console.log(`   Status: PENDING (Awaiting admin approval)`);

    console.log("\n🔗 LinkedIn & Web:");
    console.log(`   LinkedIn: https://linkedin.com/in/azadzedan13`);
    console.log(`   Website: ${funderAccount.website}`);

    console.log("\n📞 Contact Information:");
    console.log(`   Contact Person: ${funderAccount.contactPerson}`);
    console.log(`   Email: ${funderAccount.contactEmail}`);
    console.log(`   Phone: ${funderAccount.contactPhone}`);

    console.log("\n💎 Partnership Benefits (Platinum Tier):");
    const benefits = [
      "✓ $25,000+ investment commitment",
      "✓ 20% commission on referrals",
      "✓ Premium features & branding",
      "✓ 24/7 dedicated support",
      "✓ Executive account management",
      "✓ Custom integration options",
      "✓ Analytics dashboard access",
      "✓ Priority partnership opportunities",
      "✓ Exclusive networking events",
      "✓ Strategic partnership development",
    ];

    benefits.forEach((benefit) => console.log(`   ${benefit}`));

    console.log("\n📋 Next Steps:");
    console.log("   1. ✓ User account created");
    console.log("   2. ✓ Partner account created (pending approval)");
    console.log("   3. → Admin dashboard: Approve partnership application");
    console.log("   4. → Access partner dashboard: /partner-dashboard");
    console.log("   5. → Configure additional benefits and settings");

    console.log("\n🎯 Quick Links:");
    console.log("   🔗 LinkedIn Profile: https://linkedin.com/in/azadzedan13");
    console.log("   📧 Contact: azadzedan13@gmail.com");
    console.log("   🌐 Website: https://linkedin.com/in/azadzedan13");

    console.log("\n⚠️  Important Notes:");
    console.log("   • Account status is 'pending' - requires admin approval");
    console.log("   • Login using LinkedIn OAuth with this email");
    console.log("   • Admin will review and approve partnership application");
    console.log("   • Commission structure and benefits activate upon approval");

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error setting up funder account:");
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupFunderAccount();
