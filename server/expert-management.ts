/**
 * Expert Management Service
 * Handles expert onboarding, assignment, and performance tracking
 */

import { and, desc, eq, sql } from "drizzle-orm";
import {
  expertApplications,
  expertAssignments,
  expertReviews,
  users,
  stampAuthentications,
  type ExpertApplication as ExpertApplicationRow,
  type ExpertAssignment,
  type ExpertReview,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";

export interface ExpertProfile {
  userId: number;
  name: string;
  email: string;
  expertiseAreas: string[];
  credentials: string;
  expertRating: number;
  totalAuthentications: number;
  verifiedExpert: boolean;
}

export interface ExpertApplication {
  userId: number;
  expertiseAreas: string[];
  credentials: string;
  experience: string;
  references: Array<{
    name: string;
    organization: string;
    contact: string;
  }>;
  certifications: string[]; // URLs to cert documents
  motivation: string;
}

export interface AssignmentRequest {
  authenticationId: number;
  expertiseRequired: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedDays: number;
  compensation: string;
  assignedBy?: number;
}

const PREFERRED_EXPERTISE = [
  'victorian_stamps',
  'modern_european',
  'asian_philately',
  'rare_classics',
  'postage_due',
  'airmail',
  'commemoratives',
  'postal_history',
  'forgery_detection',
  'conservation',
];

const ACTIVE_ASSIGNMENT_STATUSES = ['assigned', 'accepted', 'in_progress'] as const;

function parseJsonArray(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function stringifyJson(value?: unknown): string | null {
  if (value === undefined) return null;
  return JSON.stringify(value);
}

/**
 * Submit application to become an expert
 */
export async function applyAsExpert(application: ExpertApplication): Promise<{
  success: boolean;
  applicationId: number;
  message: string;
}> {
  console.log('[Expert Management] New application from user:', application.userId);

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      applicationId: 0,
      message: 'Database not available',
    };
  }

  const invalidAreas = application.expertiseAreas.filter(area => !PREFERRED_EXPERTISE.includes(area));
  if (invalidAreas.length > 0) {
    return {
      success: false,
      applicationId: 0,
      message: `Invalid expertise areas: ${invalidAreas.join(', ')}`,
    };
  }

  const [result] = await db.insert(expertApplications).values({
    userId: application.userId,
    expertiseAreas: stringifyJson(application.expertiseAreas),
    credentials: application.credentials,
    experience: application.experience,
    references: stringifyJson(application.references),
    certifications: stringifyJson(application.certifications),
    motivation: application.motivation,
    status: 'pending',
  });

  const applicationId = (result as any)?.insertId ?? 0;

  return {
    success: true,
    applicationId,
    message: 'Application submitted successfully. Review typically takes 5-7 business days.',
  };
}

/**
 * Review and approve/reject expert application
 */
export async function reviewExpertApplication(
  applicationId: number,
  reviewerId: number,
  approved: boolean,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  console.log('[Expert Management] Reviewing application:', applicationId, approved);

  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const [application] = await db
    .select()
    .from(expertApplications)
    .where(eq(expertApplications.id, applicationId))
    .limit(1);

  if (!application) {
    return { success: false, message: 'Application not found' };
  }

  await db
    .update(expertApplications)
    .set({
      status: approved ? 'approved' : 'rejected',
      reviewedBy: reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date(),
    })
    .where(eq(expertApplications.id, applicationId));

  if (approved) {
    await db
      .update(users)
      .set({
        role: 'expert',
        verifiedExpert: true,
        expertiseAreas: application.expertiseAreas,
        credentials: application.credentials,
      })
      .where(eq(users.id, application.userId));

    return {
      success: true,
      message: 'Expert application approved. User has been granted expert privileges.',
    };
  }

  return {
    success: true,
    message: `Expert application rejected. Reason: ${notes || 'Did not meet requirements'}`,
  };
}

/**
 * Find best expert for an authentication task
 */
export async function findBestExpert(requirements: {
  expertiseAreas: string[];
  minRating?: number;
  excludeExperts?: number[];
}): Promise<ExpertProfile | null> {
  console.log('[Expert Management] Finding expert for:', requirements.expertiseAreas);

  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      expertiseAreas: users.expertiseAreas,
      credentials: users.credentials,
      expertRating: users.expertRating,
      totalAuthentications: users.totalAuthentications,
      verifiedExpert: users.verifiedExpert,
    })
    .from(users)
    .where(and(eq(users.role, 'expert'), eq(users.verifiedExpert, true)))
    .orderBy(desc(users.expertRating), desc(users.totalAuthentications), desc(users.createdAt));

  const filtered = rows
    .filter(row => {
      if (requirements.excludeExperts?.includes(row.id)) return false;
      const areas = parseJsonArray(row.expertiseAreas);
      const matchesExpertise = requirements.expertiseAreas.length === 0
        || requirements.expertiseAreas.some(area => areas.includes(area));
      const meetsRating = requirements.minRating ? Number(row.expertRating ?? 0) >= requirements.minRating : true;
      return matchesExpertise && meetsRating;
    })
    .sort((a, b) => {
      const ratingDiff = Number(b.expertRating ?? 0) - Number(a.expertRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.totalAuthentications ?? 0) - (a.totalAuthentications ?? 0);
    });

  const best = filtered[0];
  if (!best) return null;

  return {
    userId: best.id,
    name: best.name || 'Expert',
    email: best.email || '',
    expertiseAreas: parseJsonArray(best.expertiseAreas),
    credentials: best.credentials || '',
    expertRating: Number(best.expertRating ?? 0),
    totalAuthentications: best.totalAuthentications ?? 0,
    verifiedExpert: Boolean(best.verifiedExpert),
  };
}

/**
 * Assign expert to authentication task
 */
export async function assignExpert(request: AssignmentRequest): Promise<{
  success: boolean;
  assignmentId?: number;
  expert?: ExpertProfile;
  message: string;
}> {
  console.log('[Expert Management] Assigning expert for auth:', request.authenticationId);

  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const expert = await findBestExpert({
    expertiseAreas: request.expertiseRequired,
    minRating: 4.0,
  });

  if (!expert) {
    return {
      success: false,
      message: 'No available expert found matching requirements',
    };
  }

  const [assignment] = await db.insert(expertAssignments).values({
    authenticationId: request.authenticationId,
    expertId: expert.userId,
    assignedBy: request.assignedBy ?? expert.userId,
    status: 'assigned',
    priority: request.priority,
    estimatedCompletionDays: request.estimatedDays,
    compensation: request.compensation ? (request.compensation as any) : null,
    createdAt: new Date(),
  });

  await db
    .update(stampAuthentications)
    .set({ status: 'in_progress', verifierId: expert.userId })
    .where(eq(stampAuthentications.id, request.authenticationId));

  const assignmentId = (assignment as any)?.insertId ?? 0;

  return {
    success: true,
    assignmentId,
    expert,
    message: `Assigned to ${expert.name}`,
  };
}

/**
 * Auto-assign experts to pending authentications
 */
export async function autoAssignPendingTasks(): Promise<{
  assigned: number;
  failed: number;
  details: string[];
}> {
  console.log('[Expert Management] Running auto-assignment...');

  const db = await getDb();
  if (!db) {
    return { assigned: 0, failed: 0, details: ['Database not available'] };
  }

  const pendingAuthentications = await db
    .select()
    .from(stampAuthentications)
    .where(eq(stampAuthentications.status, 'pending'))
    .limit(20);

  let assigned = 0;
  let failed = 0;
  const details: string[] = [];

  for (const auth of pendingAuthentications) {
    const existing = await db
      .select()
      .from(expertAssignments)
      .where(eq(expertAssignments.authenticationId, auth.id))
      .limit(1);

    if (existing.length > 0) continue;

    const result = await assignExpert({
      authenticationId: auth.id,
      expertiseRequired: [],
      priority: 'normal',
      estimatedDays: 7,
      compensation: '0',
      assignedBy: 0,
    });

    if (result.success && result.expert) {
      assigned += 1;
      details.push(`Auth #${auth.id} assigned to ${result.expert.name}`);
    } else {
      failed += 1;
      details.push(`Auth #${auth.id} assignment failed: ${result.message}`);
    }
  }

  return { assigned, failed, details };
}

/**
 * Get expert workload (current active assignments)
 */
export async function getExpertWorkload(expertId: number): Promise<{
  activeAssignments: number;
  completedToday: number;
  averageCompletionDays: number;
  currentCapacity: 'low' | 'medium' | 'high' | 'full';
}> {
  const db = await getDb();
  if (!db) {
    return {
      activeAssignments: 0,
      completedToday: 0,
      averageCompletionDays: 0,
      currentCapacity: 'low',
    };
  }

  const assignments = await db
    .select({
      status: expertAssignments.status,
      createdAt: expertAssignments.createdAt,
      completedAt: expertAssignments.completedAt,
      estimated: expertAssignments.estimatedCompletionDays,
    })
    .from(expertAssignments)
    .where(eq(expertAssignments.expertId, expertId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAssignments = assignments.filter(a => ACTIVE_ASSIGNMENT_STATUSES.includes(a.status as any)).length;
  const completedToday = assignments.filter(a => a.completedAt && (a.completedAt as Date) >= today).length;

  const completed = assignments.filter(a => a.completedAt && a.createdAt);
  const averageCompletionDays = completed.length
    ? completed.reduce((acc, a) => {
        const diff = ((a.completedAt as Date).getTime() - (a.createdAt as Date).getTime()) / (1000 * 60 * 60 * 24);
        return acc + diff;
      }, 0) / completed.length
    : 0;

  let currentCapacity: 'low' | 'medium' | 'high' | 'full' = 'low';
  if (activeAssignments >= 6) currentCapacity = 'full';
  else if (activeAssignments >= 4) currentCapacity = 'high';
  else if (activeAssignments >= 2) currentCapacity = 'medium';

  return {
    activeAssignments,
    completedToday,
    averageCompletionDays: Number(averageCompletionDays.toFixed(2)),
    currentCapacity,
  };
}

/**
 * Submit expert review/rating
 */
export async function submitExpertReview(review: {
  expertId: number;
  reviewerId: number;
  authenticationId: number;
  rating: number;
  accuracy: number;
  timeliness: number;
  professionalism: number;
  comment?: string;
}): Promise<{ success: boolean; message: string }> {
  console.log('[Expert Management] Submitting review for expert:', review.expertId);

  // Validate ratings (1-5)
  if (
    review.rating < 1 || review.rating > 5 ||
    review.accuracy < 1 || review.accuracy > 5 ||
    review.timeliness < 1 || review.timeliness > 5 ||
    review.professionalism < 1 || review.professionalism > 5
  ) {
    return {
      success: false,
      message: 'Ratings must be between 1 and 5',
    };
  }

  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  await db.insert(expertReviews).values({
    expertId: review.expertId,
    reviewerId: review.reviewerId,
    authenticationId: review.authenticationId,
    rating: review.rating,
    accuracy: review.accuracy,
    timeliness: review.timeliness,
    professionalism: review.professionalism,
    comment: review.comment,
  });

  const [agg] = await db
    .select({
      averageRating: sql<string>`AVG(${expertReviews.rating})`,
      authCount: sql<string>`COUNT(*)`,
    })
    .from(expertReviews)
    .where(eq(expertReviews.expertId, review.expertId));

  const newAverage = agg?.averageRating ? Number(agg.averageRating) : null;

  if (newAverage !== null) {
    await db
      .update(users)
      .set({ expertRating: newAverage })
      .where(eq(users.id, review.expertId));
  }

  return {
    success: true,
    message: 'Review submitted successfully',
  };
}

/**
 * Get expert performance statistics
 */
export async function getExpertStats(expertId: number): Promise<{
  totalAuthentications: number;
  averageRating: number;
  accuracyRate: number;
  averageCompletionDays: number;
  onTimeRate: number;
  specialties: string[];
  recentReviews: Array<{
    rating: number;
    comment: string;
    date: Date;
  }>;
}> {
  console.log('[Expert Management] Getting stats for expert:', expertId);

  const db = await getDb();
  if (!db) {
    return {
      totalAuthentications: 0,
      averageRating: 0,
      accuracyRate: 0,
      averageCompletionDays: 0,
      onTimeRate: 0,
      specialties: [],
      recentReviews: [],
    };
  }

  const [user] = await db
    .select({
      expertiseAreas: users.expertiseAreas,
      expertRating: users.expertRating,
      totalAuthentications: users.totalAuthentications,
    })
    .from(users)
    .where(eq(users.id, expertId))
    .limit(1);

  const assignments = await db
    .select({
      status: expertAssignments.status,
      createdAt: expertAssignments.createdAt,
      completedAt: expertAssignments.completedAt,
      estimated: expertAssignments.estimatedCompletionDays,
    })
    .from(expertAssignments)
    .where(eq(expertAssignments.expertId, expertId));

  const completed = assignments.filter(a => a.status === 'completed' && a.completedAt && a.createdAt);
  const totalAuthentications = completed.length;

  const averageCompletionDays = completed.length
    ? completed.reduce((acc, a) => {
        const diff = ((a.completedAt as Date).getTime() - (a.createdAt as Date).getTime()) / (1000 * 60 * 60 * 24);
        return acc + diff;
      }, 0) / completed.length
    : 0;

  const onTimeAssignments = completed.filter(a => {
    if (!a.estimated || !a.createdAt || !a.completedAt) return false;
    const expected = (a.createdAt as Date).getTime() + a.estimated * 24 * 60 * 60 * 1000;
    return (a.completedAt as Date).getTime() <= expected;
  }).length;

  const [reviewAgg] = await db
    .select({
      averageRating: sql<string>`AVG(${expertReviews.rating})`,
      averageAccuracy: sql<string>`AVG(${expertReviews.accuracy})`,
    })
    .from(expertReviews)
    .where(eq(expertReviews.expertId, expertId));

  const recentReviews = await db
    .select({
      rating: expertReviews.rating,
      comment: expertReviews.comment,
      date: expertReviews.createdAt,
    })
    .from(expertReviews)
    .where(eq(expertReviews.expertId, expertId))
    .orderBy(desc(expertReviews.createdAt))
    .limit(5);

  return {
    totalAuthentications,
    averageRating: reviewAgg?.averageRating ? Number(reviewAgg.averageRating) : Number(user?.expertRating ?? 0),
    accuracyRate: reviewAgg?.averageAccuracy ? Number(reviewAgg.averageAccuracy) / 5 : 0,
    averageCompletionDays: Number(averageCompletionDays.toFixed(2)),
    onTimeRate: completed.length ? Number((onTimeAssignments / completed.length).toFixed(2)) : 0,
    specialties: parseJsonArray(user?.expertiseAreas),
    recentReviews: recentReviews.map(r => ({
      rating: r.rating,
      comment: r.comment || '',
      date: r.date as Date,
    })),
  };
}

/**
 * Get list of available experts for assignment
 */
export async function getAvailableExperts(filters?: {
  expertiseArea?: string;
  minRating?: number;
  maxWorkload?: number;
}): Promise<ExpertProfile[]> {
  console.log('[Expert Management] Getting available experts');

  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      expertiseAreas: users.expertiseAreas,
      credentials: users.credentials,
      expertRating: users.expertRating,
      totalAuthentications: users.totalAuthentications,
      verifiedExpert: users.verifiedExpert,
    })
    .from(users)
    .where(and(eq(users.role, 'expert'), eq(users.verifiedExpert, true)))
    .orderBy(desc(users.expertRating), desc(users.totalAuthentications));

  const experts: ExpertProfile[] = [];

  for (const row of rows) {
    const areas = parseJsonArray(row.expertiseAreas);
    if (filters?.expertiseArea && !areas.includes(filters.expertiseArea)) continue;
    if (filters?.minRating && Number(row.expertRating ?? 0) < filters.minRating) continue;

    if (filters?.maxWorkload !== undefined) {
      const workload = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(expertAssignments)
        .where(
          and(
            eq(expertAssignments.expertId, row.id),
            sql`${expertAssignments.status} in ('assigned','accepted','in_progress')`
          )
        );

      const activeCount = workload[0]?.count ? Number(workload[0].count) : 0;
      if (activeCount > filters.maxWorkload) continue;
    }

    experts.push({
      userId: row.id,
      name: row.name || 'Expert',
      email: row.email || '',
      expertiseAreas: areas,
      credentials: row.credentials || '',
      expertRating: Number(row.expertRating ?? 0),
      totalAuthentications: row.totalAuthentications ?? 0,
      verifiedExpert: Boolean(row.verifiedExpert),
    });
  }

  return experts;
}

/**
 * Expert leaderboard (top performers)
 */
export async function getExpertLeaderboard(limit: number = 10): Promise<Array<{
  rank: number;
  expert: ExpertProfile;
  score: number;
}>> {
  console.log('[Expert Management] Getting leaderboard');

  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      expertiseAreas: users.expertiseAreas,
      credentials: users.credentials,
      expertRating: users.expertRating,
      totalAuthentications: users.totalAuthentications,
      verifiedExpert: users.verifiedExpert,
    })
    .from(users)
    .where(and(eq(users.role, 'expert'), eq(users.verifiedExpert, true)))
    .orderBy(desc(users.expertRating), desc(users.totalAuthentications))
    .limit(limit);

  const leaderboard = rows.map((row, index) => {
    const rating = Number(row.expertRating ?? 0);
    const totalAuth = row.totalAuthentications ?? 0;
    const score = rating * 20 + totalAuth * 0.1; // weighted composite

    return {
      rank: index + 1,
      expert: {
        userId: row.id,
        name: row.name || 'Expert',
        email: row.email || '',
        expertiseAreas: parseJsonArray(row.expertiseAreas),
        credentials: row.credentials || '',
        expertRating: rating,
        totalAuthentications: totalAuth,
        verifiedExpert: Boolean(row.verifiedExpert),
      },
      score: Number(score.toFixed(2)),
    };
  });

  return leaderboard;
}
