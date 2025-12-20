import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Categories
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoryById(input.id);
      }),
  }),

  // Stamps
  stamps: router({
    list: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        categoryId: z.number().optional(),
        rarity: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAllStamps(input);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStampById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        country: z.string(),
        year: z.number(),
        categoryId: z.number(),
        rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']),
        price: z.string(),
        imageUrl: z.string().optional(),
        issuedBy: z.string().optional(),
        denomination: z.string().optional(),
        color: z.string().optional(),
        perforation: z.string().optional(),
        watermark: z.string().optional(),
        printingMethod: z.string().optional(),
        designer: z.string().optional(),
        engraver: z.string().optional(),
        quantity: z.number().optional(),
        condition: z.string().optional(),
        certificateUrl: z.string().optional(),
        historicalSignificance: z.string().optional(),
        marketTrend: z.string().optional(),
        estimatedValue: z.string().optional(),
        lastSoldPrice: z.string().optional(),
        lastSoldDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createStamp({
          ...input,
          ownerId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        country: z.string().optional(),
        year: z.number().optional(),
        categoryId: z.number().optional(),
        rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']).optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        return await db.updateStamp(id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteStamp(input.id);
      }),
  }),

  // Favorites
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserFavorites(ctx.user.id);
    }),
    
    check: protectedProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.isFavorite(ctx.user.id, input.stampId);
      }),
    
    add: protectedProcedure
      .input(z.object({ stampId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.addFavorite({
          userId: ctx.user.id,
          stampId: input.stampId,
        });
      }),
    
    remove: protectedProcedure
      .input(z.object({ stampId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await db.removeFavorite(ctx.user.id, input.stampId);
      }),
  }),

  // Transactions
  transactions: router({
    myTransactions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTransactions(ctx.user.id);
    }),
    
    stampHistory: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStampTransactions(input.stampId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        sellerId: z.number(),
        price: z.string(),
        transactionHash: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTransaction({
          ...input,
          buyerId: ctx.user.id,
          status: 'pending',
        });
      }),
  }),

  // Contact Messages
  contact: router({
    send: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        subject: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createContactMessage(input);
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admin can view all messages
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await db.getAllContactMessages();
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Only admin can mark messages as read
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.markMessageAsRead(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
