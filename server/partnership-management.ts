/**
 * Partnership Management Service
 * Handles auction house, museum, and institutional partnerships
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { partnerTransactions, partners } from "../drizzle/schema";
import { getDb } from "./db";

const TIER_REVENUE_SHARE: Record<string, number> = {
  bronze: 60,
  silver: 65,
  gold: 70,
  platinum: 75,
  diamond: 80,
};

function getPartnerSharePercent(tier?: string) {
  return TIER_REVENUE_SHARE[tier ?? ""] ?? 70;
}

export interface PartnershipProposal {
  organizationType: 'auction_house' | 'museum' | 'postal_service' | 'dealer' | 'collector_society' | 'academic';
  organizationName: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  proposedCollaboration: string;
  collectionSize?: number;
  digitalizationCapability: boolean;
  authenticationCapability: boolean;
  marketAccess: string[];
  revenueShareProposal?: number; // percentage
  exclusivityRequested: boolean;
}

export interface Partnership {
  id: number;
  organizationType: string;
  organizationName: string;
  status: 'proposed' | 'negotiating' | 'active' | 'paused' | 'terminated';
  contractSigned: boolean;
  revenueShare: number;
  startDate: Date;
  endDate?: Date;
  contributedStamps: number;
  totalRevenue: string;
}

/**
 * Submit partnership proposal
 */
export async function submitProposal(proposal: PartnershipProposal & { userId?: number }): Promise<{
  success: boolean;
  proposalId: number;
  message: string;
}> {
  console.log('[Partnership] New proposal from:', proposal.organizationName);

  // Validate proposal
  if (!proposal.contactEmail.includes('@')) {
    return {
      success: false,
      proposalId: 0,
      message: 'Invalid email address',
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      proposalId: 0,
      message: 'Database not available',
    };
  }

  const userId = proposal.userId;
  if (!userId) {
    return {
      success: false,
      proposalId: 0,
      message: 'User context is required to submit a proposal',
    };
  }

  const [result] = await db.insert(partners).values({
    userId,
    companyName: proposal.organizationName,
    companyNameAr: null,
    description: proposal.proposedCollaboration,
    descriptionAr: null,
    website: null,
    tier: 'bronze',
    totalInvestment: '0',
    status: 'pending',
    contactPerson: proposal.contactPerson,
    contactEmail: proposal.contactEmail,
    contactPhone: proposal.contactPhone,
    benefits: null,
  });

  const proposalId = (result as any)?.insertId ?? 0;

  return {
    success: true,
    proposalId,
    message: 'Proposal submitted successfully. Our team will contact you within 48 hours.',
  };
}

/**
 * Generate partnership agreement template
 */
export function generateAgreementTemplate(partnership: {
  organizationName: string;
  organizationType: string;
  revenueShare: number;
  exclusivity: boolean;
  territory?: string;
}): string {
  const { organizationName, organizationType, revenueShare, exclusivity, territory } = partnership;

  return `
# PARTNERSHIP AGREEMENT

**Between:** StampCoin Platform LLC ("StampCoin")
**And:** ${organizationName} ("Partner")

**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

## 1. PARTNERSHIP TYPE
This agreement establishes a ${organizationType} partnership between StampCoin and Partner.

## 2. SCOPE OF COLLABORATION

### 2.1 Partner Responsibilities
- Provide high-resolution digital scans of stamps (minimum 300 DPI)
- Verify authenticity and provenance of contributed stamps
- Provide historical and philatelic documentation
- Assist with categorization and metadata enrichment
${exclusivity ? '- Grant exclusive digital rights to StampCoin' : '- Grant non-exclusive digital rights to StampCoin'}

### 2.2 StampCoin Responsibilities
- Convert stamps to NFTs on blockchain
- Host and maintain NFT marketplace
- Provide authentication services
- Handle payment processing and customer service
- Promote partner's collection through marketing channels

## 3. REVENUE SHARING

### 3.1 Revenue Split
- Partner receives: **${revenueShare}%** of net sales
- StampCoin receives: **${100 - revenueShare}%** of net sales

### 3.2 Payment Terms
- Monthly payments via wire transfer or cryptocurrency
- Minimum payout threshold: $100 USD
- Payments processed within 15 business days of month end

### 3.3 Net Sales Definition
Net sales = Gross sales - Payment processing fees - Gas fees - Refunds

## 4. INTELLECTUAL PROPERTY

### 4.1 Digital Rights
${exclusivity
    ? 'Partner grants StampCoin exclusive digital reproduction rights for contributed stamps.'
    : 'Partner grants StampCoin non-exclusive digital reproduction rights. Partner may license to other platforms.'}

### 4.2 Attribution
All NFTs will include proper attribution to Partner as the source collection.

### 4.3 Trademarks
Partner grants StampCoin right to use Partner's name and logo for promotional purposes.

## 5. TERM AND TERMINATION

### 5.1 Initial Term
This agreement is effective for **2 years** from the date above.

### 5.2 Renewal
Agreement automatically renews for additional 1-year terms unless either party provides 90 days written notice.

### 5.3 Termination
Either party may terminate with 90 days written notice. Revenue sharing continues for stamps minted during term.

${territory ? `\n## 6. GEOGRAPHIC SCOPE\nThis partnership applies to: **${territory}**\n` : ''}

## 7. CONFIDENTIALITY
Both parties agree to maintain confidentiality of business terms, trade secrets, and proprietary information.

## 8. DISPUTE RESOLUTION
Disputes will be resolved through binding arbitration in [Jurisdiction].

## 9. GOVERNING LAW
This agreement is governed by the laws of [Jurisdiction].

---

**SIGNATURES:**

For StampCoin Platform LLC:
- Name: ________________________
- Title: ________________________
- Date: ________________________
- Signature: ____________________

For ${organizationName}:
- Name: ________________________
- Title: ________________________
- Date: ________________________
- Signature: ____________________
`;
}

/**
 * Calculate revenue share for a partner
 */
export async function calculateRevenueShare(
  partnerId: number,
  startDate: Date,
  endDate: Date
): Promise<{
  totalSales: string;
  partnerShare: string;
  stampCoinShare: string;
  transactionCount: number;
  breakdown: Array<{
    stampId: number;
    stampName: string;
    salePrice: string;
    partnerEarnings: string;
    saleDate: Date;
  }>;
}> {
  console.log('[Partnership] Calculating revenue for partner:', partnerId);

  const db = await getDb();
  if (!db) {
    return {
      totalSales: '0.00',
      partnerShare: '0.00',
      stampCoinShare: '0.00',
      transactionCount: 0,
      breakdown: [],
    };
  }

  const [partner] = await db
    .select({ id: partners.id, tier: partners.tier })
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);

  const revenueSharePercent = getPartnerSharePercent(partner?.tier);

  const transactionsRows = await db
    .select({
      amount: partnerTransactions.amount,
      description: partnerTransactions.description,
      createdAt: partnerTransactions.createdAt,
      id: partnerTransactions.id,
      transactionId: partnerTransactions.transactionId,
      type: partnerTransactions.type,
      status: partnerTransactions.status,
    })
    .from(partnerTransactions)
    .where(
      and(
        eq(partnerTransactions.partnerId, partnerId),
        eq(partnerTransactions.status, 'completed'),
        sql`${partnerTransactions.createdAt} BETWEEN ${startDate} AND ${endDate}`
      )
    )
    .orderBy(desc(partnerTransactions.createdAt));

  const totalSales = transactionsRows.reduce((acc, tx) => acc + Number(tx.amount ?? 0), 0);
  const partnerShareValue = totalSales * (revenueSharePercent / 100);
  const stampCoinShare = totalSales - partnerShareValue;

  return {
    totalSales: totalSales.toFixed(2),
    partnerShare: partnerShareValue.toFixed(2),
    stampCoinShare: stampCoinShare.toFixed(2),
    transactionCount: transactionsRows.length,
    breakdown: transactionsRows.map(tx => ({
      stampId: tx.transactionId ?? tx.id,
      stampName: tx.description || 'Sale',
      salePrice: Number(tx.amount ?? 0).toFixed(2),
      partnerEarnings: (Number(tx.amount ?? 0) * (revenueSharePercent / 100)).toFixed(2),
      saleDate: tx.createdAt as Date,
    })),
  };
}

/**
 * Get partnership dashboard data
 */
export async function getPartnershipDashboard(partnerId: number): Promise<{
  partnership: Partnership;
  performance: {
    stampsContributed: number;
    stampsListed: number;
    stampsSold: number;
    totalRevenue: string;
    partnerEarnings: string;
    averageSalePrice: string;
    monthlyGrowth: number;
  };
  topStamps: Array<{
    stampId: number;
    name: string;
    sales: number;
    revenue: string;
  }>;
  recentActivity: Array<{
    type: 'upload' | 'sale' | 'payment' | 'review';
    description: string;
    date: Date;
  }>;
}> {
  console.log('[Partnership] Getting dashboard for partner:', partnerId);
  const db = await getDb();
  if (!db) {
    return {
      partnership: {
        id: partnerId,
        organizationType: 'institution',
        organizationName: 'Unknown partner',
        status: 'pending',
        contractSigned: false,
        revenueShare: 70,
        startDate: new Date(),
        contributedStamps: 0,
        totalRevenue: '0.00',
      },
      performance: {
        stampsContributed: 0,
        stampsListed: 0,
        stampsSold: 0,
        totalRevenue: '0.00',
        partnerEarnings: '0.00',
        averageSalePrice: '0.00',
        monthlyGrowth: 0,
      },
      topStamps: [],
      recentActivity: [],
    };
  }

  const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) {
    return {
      partnership: {
        id: partnerId,
        organizationType: 'institution',
        organizationName: 'Unknown partner',
        status: 'pending',
        contractSigned: false,
        revenueShare: 70,
        startDate: new Date(),
        contributedStamps: 0,
        totalRevenue: '0.00',
      },
      performance: {
        stampsContributed: 0,
        stampsListed: 0,
        stampsSold: 0,
        totalRevenue: '0.00',
        partnerEarnings: '0.00',
        averageSalePrice: '0.00',
        monthlyGrowth: 0,
      },
      topStamps: [],
      recentActivity: [],
    };
  }

  const transactionsRows = await db
    .select({
      id: partnerTransactions.id,
      amount: partnerTransactions.amount,
      description: partnerTransactions.description,
      createdAt: partnerTransactions.createdAt,
      completedAt: partnerTransactions.completedAt,
      status: partnerTransactions.status,
      type: partnerTransactions.type,
    })
    .from(partnerTransactions)
    .where(eq(partnerTransactions.partnerId, partnerId))
    .orderBy(desc(partnerTransactions.createdAt));

  const completedSales = transactionsRows.filter(tx => tx.status === 'completed' && tx.type === 'purchase');
  const totalSalesValue = completedSales.reduce((acc, tx) => acc + Number(tx.amount ?? 0), 0);
  const revenueShare = getPartnerSharePercent(partner.tier);
  const partnerEarnings = totalSalesValue * (revenueShare / 100);
  const averageSalePrice = completedSales.length ? totalSalesValue / completedSales.length : 0;

  const now = new Date();
  const days30 = 1000 * 60 * 60 * 24 * 30;
  const recentWindowStart = new Date(now.getTime() - days30);
  const previousWindowStart = new Date(recentWindowStart.getTime() - days30);

  const recentSales = completedSales.filter(tx => tx.createdAt >= recentWindowStart);
  const previousSales = completedSales.filter(tx => tx.createdAt >= previousWindowStart && tx.createdAt < recentWindowStart);
  const recentTotal = recentSales.reduce((acc, tx) => acc + Number(tx.amount ?? 0), 0);
  const previousTotal = previousSales.reduce((acc, tx) => acc + Number(tx.amount ?? 0), 0);
  const monthlyGrowth = previousTotal === 0 ? (recentTotal > 0 ? 100 : 0) : ((recentTotal - previousTotal) / previousTotal) * 100;

  const topByDescription = new Map<string, { sales: number; revenue: number }>();
  completedSales.forEach(tx => {
    const key = tx.description || 'Unnamed sale';
    const current = topByDescription.get(key) || { sales: 0, revenue: 0 };
    topByDescription.set(key, {
      sales: current.sales + 1,
      revenue: current.revenue + Number(tx.amount ?? 0),
    });
  });

  const topStamps = Array.from(topByDescription.entries())
    .map(([name, stats]) => ({
      stampId: 0,
      name,
      sales: stats.sales,
      revenue: stats.revenue.toFixed(2),
    }))
    .sort((a, b) => Number(b.revenue) - Number(a.revenue))
    .slice(0, 5);

  const recentActivity = transactionsRows.slice(0, 10).map(tx => ({
    type: tx.type === 'purchase' ? 'sale' : tx.type === 'reward' ? 'payment' : 'upload',
    description: tx.description || 'Partner transaction',
    date: tx.createdAt,
  }));

  return {
    partnership: {
      id: partner.id,
      organizationType: partner.tier || 'institution',
      organizationName: partner.companyName,
      status: partner.status as Partnership['status'],
      contractSigned: partner.status === 'active' || partner.status === 'approved',
      revenueShare,
      startDate: partner.investmentDate ?? new Date(),
      contributedStamps: 0,
      totalRevenue: totalSalesValue.toFixed(2),
    },
    performance: {
      stampsContributed: 0,
      stampsListed: 0,
      stampsSold: completedSales.length,
      totalRevenue: totalSalesValue.toFixed(2),
      partnerEarnings: partnerEarnings.toFixed(2),
      averageSalePrice: averageSalePrice.toFixed(2),
      monthlyGrowth: Number(monthlyGrowth.toFixed(2)),
    },
    topStamps,
    recentActivity,
  };
}

/**
 * Track partner performance metrics
 */
export async function trackPartnerMetrics(partnerId: number): Promise<{
  qualityScore: number; // 0-100
  timelinessScore: number;
  documentationScore: number;
  responseScore: number;
  overallRating: 'poor' | 'fair' | 'good' | 'excellent';
}> {
  const db = await getDb();
  if (!db) {
    return {
      qualityScore: 80,
      timelinessScore: 80,
      documentationScore: 80,
      responseScore: 80,
      overallRating: 'good',
    };
  }

  const transactionsRows = await db
    .select({
      createdAt: partnerTransactions.createdAt,
      completedAt: partnerTransactions.completedAt,
      status: partnerTransactions.status,
      description: partnerTransactions.description,
    })
    .from(partnerTransactions)
    .where(eq(partnerTransactions.partnerId, partnerId));

  if (transactionsRows.length === 0) {
    return {
      qualityScore: 70,
      timelinessScore: 70,
      documentationScore: 70,
      responseScore: 70,
      overallRating: 'fair',
    };
  }

  const completed = transactionsRows.filter(tx => tx.status === 'completed');
  const completionRate = completed.length / transactionsRows.length;

  const avgCompletionHours = completed.length
    ? completed.reduce((acc, tx) => {
        const end = tx.completedAt ?? tx.createdAt;
        const hours = (end.getTime() - tx.createdAt.getTime()) / (1000 * 60 * 60);
        return acc + Math.max(hours, 0);
      }, 0) / completed.length
    : 0;

  const timelinessScore = Math.max(40, Math.min(100, 100 - avgCompletionHours / 2));
  const documentationScore = Math.max(50, Math.min(100, 60 + (transactionsRows.filter(tx => tx.description).length / transactionsRows.length) * 40));
  const qualityScore = Math.max(50, Math.min(100, 70 + completionRate * 30));
  const responseScore = Math.round((timelinessScore * 0.6 + documentationScore * 0.4));

  const averageScore = (qualityScore + timelinessScore + documentationScore + responseScore) / 4;
  const overallRating = averageScore >= 90 ? 'excellent' : averageScore >= 80 ? 'good' : averageScore >= 70 ? 'fair' : 'poor';

  return {
    qualityScore: Math.round(qualityScore),
    timelinessScore: Math.round(timelinessScore),
    documentationScore: Math.round(documentationScore),
    responseScore: Math.round(responseScore),
    overallRating,
  };
}

/**
 * Generate partnership report
 */
export async function generatePartnershipReport(
  partnerId: number,
  period: 'monthly' | 'quarterly' | 'annual'
): Promise<{
  reportId: string;
  period: string;
  metrics: any;
  recommendations: string[];
  pdfUrl?: string;
}> {
  console.log('[Partnership] Generating report for partner:', partnerId, period);
  const now = new Date();
  const periodDays = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const revenue = await calculateRevenueShare(partnerId, startDate, now);
  const metrics = await trackPartnerMetrics(partnerId);

  const recommendations: string[] = [];
  if (Number(revenue.totalSales) === 0) {
    recommendations.push('List new inventory to unlock revenue.');
  }
  if (metrics.timelinessScore < 80) {
    recommendations.push('Reduce turnaround time on uploads and confirmations.');
  }
  if (metrics.documentationScore < 85) {
    recommendations.push('Add detailed descriptions to each upload to improve discovery.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Great performance—maintain current operational cadence.');
  }

  return {
    reportId: `RPT-${partnerId}-${Date.now()}`,
    period,
    metrics: {
      revenue,
      qualityScore: metrics.qualityScore,
      timelinessScore: metrics.timelinessScore,
      documentationScore: metrics.documentationScore,
      responseScore: metrics.responseScore,
    },
    recommendations,
  };
}

/**
 * List of potential partnership targets
 */
export const PARTNERSHIP_TARGETS = [
  {
    name: 'Sotheby\'s',
    type: 'auction_house',
    country: 'UK',
    priority: 'high',
    estimatedCollection: 50000,
    contact: 'stamps@sothebys.com',
  },
  {
    name: 'Christie\'s',
    type: 'auction_house',
    country: 'UK',
    priority: 'high',
    estimatedCollection: 45000,
    contact: 'philately@christies.com',
  },
  {
    name: 'British Postal Museum',
    type: 'museum',
    country: 'UK',
    priority: 'high',
    estimatedCollection: 150000,
    contact: 'collections@postalmuseum.org',
  },
  {
    name: 'Smithsonian National Postal Museum',
    type: 'museum',
    country: 'USA',
    priority: 'high',
    estimatedCollection: 6000000,
    contact: 'npm@si.edu',
  },
  {
    name: 'Stanley Gibbons',
    type: 'dealer',
    country: 'UK',
    priority: 'medium',
    estimatedCollection: 100000,
    contact: 'info@stanleygibbons.com',
  },
  {
    name: 'American Philatelic Society',
    type: 'collector_society',
    country: 'USA',
    priority: 'medium',
    estimatedCollection: 25000,
    contact: 'info@stamps.org',
  },
  {
    name: 'Royal Philatelic Society London',
    type: 'collector_society',
    country: 'UK',
    priority: 'medium',
    estimatedCollection: 30000,
    contact: 'secretary@rpsl.org.uk',
  },
];

/**
 * Generate outreach email template
 */
export function generateOutreachEmail(target: typeof PARTNERSHIP_TARGETS[0]): string {
  return `
Subject: Partnership Opportunity: Digitize Your Stamp Collection as NFTs

Dear ${target.name} Team,

I hope this email finds you well. My name is [Your Name] from StampCoin Platform, and I'm reaching out to explore a potential partnership that could bring significant value to your organization and the global philately community.

**About StampCoin:**
StampCoin is a next-generation digital platform that converts physical stamp collections into authenticated NFTs (non-fungible tokens) on the blockchain. We combine cutting-edge technology with deep respect for philatelic heritage.

**Why Partner With Us:**
✓ **Revenue Generation:** Earn 70% of all NFT sales from your collection
✓ **Global Reach:** Access to our worldwide marketplace of collectors
✓ **Preservation:** Create permanent digital records of your stamps
✓ **Authentication:** AI-powered forgery detection and expert verification
✓ **Marketing:** Professional promotion through our channels

**What We Provide:**
- Professional digitization services (if needed)
- Blockchain minting and hosting
- Secure payment processing
- Customer service and support
- Monthly revenue reports and payments

**Your Collection:**
We understand ${target.name} houses approximately ${target.estimatedCollection.toLocaleString()} stamps. We would be honored to help bring this incredible collection to the digital age.

**Next Steps:**
I'd love to schedule a 30-minute call to discuss how we can tailor a partnership to your specific needs. Are you available next week?

Please let me know a convenient time, or feel free to reach out with any questions.

Best regards,
[Your Name]
StampCoin Platform
partnerships@stampcoin.com
+1 (555) 123-4567

P.S. We're currently partnering with [Other Partner Names] and would be thrilled to add ${target.name} to our growing network of prestigious institutions.
`.trim();
}
