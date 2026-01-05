import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { randomBytes } from "crypto";
import Stripe from 'stripe';
import { STAMP_PRODUCTS } from './products';
import * as nftMinting from './nft-minting';
import * as authentication from './authentication';
import * as appraisal from './appraisal';import * as expertManagement from "./expert-management";
function createTestStripeMock() {
  return {
    checkout: {
      sessions: {
        async create(_opts: any) {
          return {
            url: 'https://checkout.stripe.com/test_session',
            id: 'sess_test_123',
          } as any;
        },
        async retrieve(_id: string) {
          return {
            id: _id,
            payment_status: 'paid',
            customer_email: 'test@example.com',
            metadata: {},
          } as any;
        },
      },
    },
  } as any;
}

const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' })
  : createTestStripeMock();

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

  // Upload
  upload: router({    uploadImage: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const randomSuffix = randomBytes(8).toString('hex');
        const fileKey = `stamps/${ctx.user.id}-${randomSuffix}-${input.fileName}`;
        
        // Convert base64 to buffer
        const base64Data = input.fileData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const result = await storagePut(fileKey, buffer, input.mimeType);
        
        return {
          url: result.url,
          key: fileKey,
        };
      }),
  }),

  // Stripe Payments
  payments: router({
    createCheckout: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        productId: z.string(),
        paymentMethod: z.enum(['card', 'paypal', 'apple_pay', 'google_pay']).default('card'),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const product = STAMP_PRODUCTS[input.productId];
          
          if (!product) {
            throw new Error('Product not found');
          }

          const origin = ctx.req.headers.origin || 'http://localhost:3000';
          
          const paymentMethodMap: Record<string, string[]> = {
            card: ['card'],
            paypal: ['paypal'],
            apple_pay: ['apple_pay'],
            google_pay: ['google_pay'],
          };
          
          const paymentMethods = paymentMethodMap[input.paymentMethod] || ['card'];

          const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods as any,
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: product.name,
                    description: product.description,
                  },
                  unit_amount: Math.round(product.price * 100),
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `${origin}/dashboard?payment=success&sessionId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/marketplace?payment=cancelled`,
            customer_email: ctx.user.email || undefined,
            client_reference_id: ctx.user.id.toString(),
            metadata: {
              user_id: ctx.user.id.toString(),
              customer_email: ctx.user.email || '',
              customer_name: ctx.user.name || '',
              stamp_id: input.stampId.toString(),
              product_id: input.productId,
              payment_method: input.paymentMethod,
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
          });

          return {
            url: session.url,
            sessionId: session.id,
            paymentMethod: input.paymentMethod,
          };
        } catch (error: any) {
          console.error('[Payments] Checkout creation failed:', error);
          throw new Error(`Failed to create checkout session: ${error.message}`);
        }
      }),
    
    validateCheckout: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const session = await stripe.checkout.sessions.retrieve(input.sessionId);
          return {
            status: session.payment_status,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_email,
            metadata: session.metadata,
          };
        } catch (error: any) {
          console.error('[Payments] Session validation failed:', error);
          throw new Error('Invalid session ID');
        }
      }),
    
    getPaymentMethods: publicProcedure.query(async () => {
      return [
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard, American Express, Discover',
          icon: 'CreditCard',
          supported: true,
        },
        {
          id: 'paypal',
          name: 'PayPal',
          description: 'Fast and secure payments with PayPal',
          icon: 'PayPal',
          supported: true,
        },
        {
          id: 'apple_pay',
          name: 'Apple Pay',
          description: 'Quick and secure payments with Apple Pay',
          icon: 'Apple',
          supported: true,
        },
        {
          id: 'google_pay',
          name: 'Google Pay',
          description: 'Fast checkout with Google Pay',
          icon: 'Google',
          supported: true,
        },
      ];
    }),
  }),

  // Reviews
  reviews: router({    create: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createReview({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    getStampReviews: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStampReviews(input.stampId);
      }),
    
    getStampRating: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStampAverageRating(input.stampId);
      }),
    
    myReviews: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReviews(ctx.user.id);
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

  // NFT Management
  nft: router({
    mintStamp: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        blockchainNetwork: z.enum(['ethereum', 'polygon', 'solana', 'arbitrum']),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const stamp = await db.getStampById(input.stampId);
          if (!stamp) {
            throw new Error('Stamp not found');
          }

          // Check if already minted
          if (stamp.nftTokenId) {
            throw new Error('This stamp has already been minted as an NFT');
          }

          // Prepare minting request
          const mintingRequest: nftMinting.MintingRequest = {
            stampId: input.stampId,
            userId: ctx.user.id,
            blockchainNetwork: input.blockchainNetwork,
            imageUrl: stamp.imageUrl || '',
            title: stamp.title,
            description: stamp.description || '',
            attributes: {
              country: stamp.country,
              year: stamp.year,
              rarity: stamp.rarity,
              designer: stamp.designer,
              issuedBy: stamp.issuedBy,
              denomination: stamp.denomination,
              condition: stamp.condition,
            },
          };

          // Mint NFT
          const result = await nftMinting.mintNft(mintingRequest);

          if (!result.success) {
            throw new Error(result.errorMessage || 'Minting failed');
          }

          // Update stamp with NFT data
          await db.updateStamp(input.stampId, {
            nftTokenId: result.tokenId,
            nftContractAddress: result.contractAddress,
            nftMetadataUri: result.metadataUri,
            blockchainNetwork: input.blockchainNetwork,
            mintedAt: new Date(),
          });

          return {
            success: true,
            tokenId: result.tokenId,
            contractAddress: result.contractAddress,
            transactionHash: result.transactionHash,
            metadataUri: result.metadataUri,
          };
        } catch (error: any) {
          console.error('[NFT] Minting error:', error);
          throw new Error(error.message || 'Failed to mint NFT');
        }
      }),

    estimateCost: publicProcedure
      .input(z.object({
        blockchainNetwork: z.enum(['ethereum', 'polygon', 'solana', 'arbitrum']),
      }))
      .query(async ({ input }) => {
        return await nftMinting.estimateMintingCost(input.blockchainNetwork);
      }),

    getMetadata: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        const stamp = await db.getStampById(input.stampId);
        if (!stamp) {
          throw new Error('Stamp not found');
        }
        return nftMinting.generateNftMetadata(stamp);
      }),
  }),

  // Authentication & Verification
  authentication: router({
    requestVerification: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        authenticationType: z.enum(['expert_review', 'certificate_scan', 'ai_analysis', 'blockchain_provenance', 'third_party']),
        supportingDocuments: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const stamp = await db.getStampById(input.stampId);
        if (!stamp) {
          throw new Error('Stamp not found');
        }

        const result = await authentication.requestAuthentication({
          stampId: input.stampId,
          userId: ctx.user.id,
          authenticationType: input.authenticationType,
          supportingDocuments: input.supportingDocuments,
          notes: input.notes,
        });

        return result;
      }),

    submitVerification: protectedProcedure
      .input(z.object({
        authenticationId: z.number(),
        status: z.enum(['verified', 'rejected', 'disputed']),
        confidenceScore: z.number().min(0).max(100),
        findings: z.string(),
        certificateUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admins or verified experts can submit verifications
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized - Only experts can submit verifications');
        }

        const result = await authentication.submitVerification({
          authenticationId: input.authenticationId,
          verifierId: ctx.user.id,
          verifierName: ctx.user.name || 'Anonymous Expert',
          verifierCredentials: 'Platform Verified Expert',
          status: input.status,
          confidenceScore: input.confidenceScore,
          findings: input.findings,
          certificateUrl: input.certificateUrl,
        });

        return result;
      }),

    analyzeImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        return await authentication.analyzeStampImage(input.imageUrl);
      }),

    getStatus: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        return await authentication.getAuthenticationStatus(input.stampId);
      }),
  }),

  // Appraisal & Valuation
  appraisal: router({
    requestAppraisal: protectedProcedure
      .input(z.object({
        stampId: z.number(),
        appraisalType: z.enum(['formal', 'informal', 'market_based', 'ai_estimated']),
      }))
      .mutation(async ({ input, ctx }) => {
        const stamp = await db.getStampById(input.stampId);
        if (!stamp) {
          throw new Error('Stamp not found');
        }

        const result = await appraisal.requestAppraisal({
          stampId: input.stampId,
          userId: ctx.user.id,
          appraisalType: input.appraisalType,
          requestedBy: ctx.user.name || ctx.user.email || 'User',
        });

        return result;
      }),

    getQuickEstimate: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        const stamp = await db.getStampById(input.stampId);
        if (!stamp) {
          throw new Error('Stamp not found');
        }

        return await appraisal.getAiEstimate({
          rarity: stamp.rarity,
          year: stamp.year || undefined,
          country: stamp.country || undefined,
          condition: stamp.condition || undefined,
          lastSoldPrice: stamp.lastSoldPrice?.toString(),
        });
      }),

    getValuationHistory: publicProcedure
      .input(z.object({ stampId: z.number() }))
      .query(async ({ input }) => {
        return await appraisal.getValuationHistory(input.stampId);
      }),

    getMarketTrends: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        country: z.string().optional(),
        yearRange: z.tuple([z.number(), z.number()]).optional(),
      }))
      .query(async ({ input }) => {
        return await appraisal.analyzeMarketTrends({
          category: input.category,
          country: input.country,
          yearRange: input.yearRange,
        });
      }),
  }),

  // Partners
  partners: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        tier: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (input.status) {
          return await db.getAllPartners(input.status);
        }
        return await db.getAllPartners();
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPartnerById(input.id);
      }),
    
    getByTier: publicProcedure
      .input(z.object({ tier: z.string() }))
      .query(async ({ input }) => {
        return await db.getPartnersByTier(input.tier);
      }),
    
    create: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        companyNameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        website: z.string().optional(),
        tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
        totalInvestment: z.string(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createPartner({
          ...input,
          userId: ctx.user.id,
          status: 'pending',
        });
      }),
    
    getMyPartner: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPartnerByUserId(ctx.user.id);
    }),
    
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.approvePartner(input.id, ctx.user.id);
      }),
    
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.rejectPartner(input.id, ctx.user.id);
      }),
    
    benefits: router({
      list: publicProcedure
        .input(z.object({ partnerId: z.number() }))
        .query(async ({ input }) => {
          return await db.getPartnerBenefits(input.partnerId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          partnerId: z.number(),
          benefitType: z.enum(['discount', 'commission', 'feature', 'support', 'branding', 'exclusive_access']),
          description: z.string(),
          value: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.user.role !== 'admin') {
            throw new Error('Unauthorized');
          }
          return await db.createPartnerBenefit(input);
        }),
    }),
    
    transactions: router({
      list: protectedProcedure
        .input(z.object({ partnerId: z.number() }))
        .query(async ({ input, ctx }) => {
          const partner = await db.getPartnerById(input.partnerId);
          if (!partner || (partner.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
            throw new Error('Unauthorized');
          }
          return await db.getPartnerTransactions(input.partnerId);
        }),
      
      create: protectedProcedure
        .input(z.object({
          partnerId: z.number(),
          type: z.enum(['purchase', 'commission', 'reward', 'refund']),
          amount: z.string(),
          description: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.user.role !== 'admin') {
            throw new Error('Unauthorized');
          }
          return await db.createPartnerTransaction({
            ...input,
            status: 'pending',
          });
        }),
      
      getTotalEarnings: protectedProcedure
        .input(z.object({ partnerId: z.number() }))
        .query(async ({ input, ctx }) => {
          const partner = await db.getPartnerById(input.partnerId);
          if (!partner || (partner.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
            throw new Error('Unauthorized');
          }
          return await db.getPartnerTotalEarnings(input.partnerId);
        }),
    }),
  }),
  
  // Expert Network Management
  experts: router({
    // Apply to become an expert
    applyAsExpert: protectedProcedure
      .input(z.object({
        expertiseAreas: z.array(z.string()),
        credentials: z.string(),
        experience: z.string(),
        references: z.array(z.object({
          name: z.string(),
          organization: z.string(),
          contact: z.string(),
        })),
        certifications: z.array(z.string()), // URLs to cert documents
        motivation: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await expertManagement.applyAsExpert({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    // Review expert application (admin only)
    reviewApplication: protectedProcedure
      .input(z.object({
        applicationId: z.number(),
        approved: z.boolean(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return await expertManagement.reviewExpertApplication(
          input.applicationId,
          ctx.user.id,
          input.approved,
          input.notes
        );
      }),
    
    // Get list of available experts
    getAvailable: publicProcedure
      .input(z.object({
        expertiseArea: z.string().optional(),
        minRating: z.number().optional(),
        maxWorkload: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await expertManagement.getAvailableExperts(input);
      }),
    
    // Assign expert to authentication task (admin or auto-assign)
    assign: protectedProcedure
      .input(z.object({
        authenticationId: z.number(),
        expertiseRequired: z.array(z.string()),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        estimatedDays: z.number().default(7),
        compensation: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'expert') {
          throw new Error('Unauthorized');
        }
        return await expertManagement.assignExpert({
          ...input,
          assignedBy: ctx.user.id,
        });
      }),
    
    // Get expert workload
    getWorkload: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Only admins or the expert themselves can view workload
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.expertId) {
          throw new Error('Unauthorized');
        }
        return await expertManagement.getExpertWorkload(input.expertId);
      }),
    
    // Submit review of expert's work
    submitReview: protectedProcedure
      .input(z.object({
        expertId: z.number(),
        authenticationId: z.number(),
        rating: z.number().min(1).max(5),
        accuracy: z.number().min(1).max(5),
        timeliness: z.number().min(1).max(5),
        professionalism: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await expertManagement.submitExpertReview({
          ...input,
          reviewerId: ctx.user.id,
        });
      }),
    
    // Get expert statistics
    getStats: publicProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return await expertManagement.getExpertStats(input.expertId);
      }),
    
    // Get expert leaderboard
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await expertManagement.getExpertLeaderboard(input.limit);
      }),
    
    // Auto-assign pending tasks (admin cron job)
    autoAssign: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await expertManagement.autoAssignPendingTasks();
      }),
  }),
});

export type AppRouter = typeof appRouter;
