import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

// Types for NFT category data
interface StampCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  filters: {
    yearRange?: [number, number];
    rarity?: string[];
    countries?: string[];
  };
}

// Define categories
const CATEGORIES: Record<string, StampCategory> = {
  'era-1800s': {
    id: 'era-1800s',
    name: '1800s - Early Era',
    displayName: '🏛️ 1800s - The Birth of Stamps',
    description: 'Historic stamps from the birth of the postal system',
    filters: {
      yearRange: [1840, 1900],
    },
  },
  'era-1900s': {
    id: 'era-1900s',
    name: '1900s - Golden Era',
    displayName: '✨ 1900s - Golden Era',
    description: 'Beautiful stamps from the 20th century beginning',
    filters: {
      yearRange: [1900, 1950],
    },
  },
  'era-modern': {
    id: 'era-modern',
    name: 'Modern',
    displayName: '🚀 Modern Era (1950+)',
    description: 'Contemporary and modern stamp collecting',
    filters: {
      yearRange: [1950, 2000],
    },
  },
  'rarity-legendary': {
    id: 'rarity-legendary',
    name: 'Legendary',
    displayName: '👑 Legendary Stamps',
    description: 'The rarest and most valuable stamps in the world',
    filters: {
      rarity: ['legendary'],
    },
  },
  'rarity-rare': {
    id: 'rarity-rare',
    name: 'Rare',
    displayName: '💎 Rare Stamps',
    description: 'Scarce and valuable collectible stamps',
    filters: {
      rarity: ['rare'],
    },
  },
  'rarity-uncommon': {
    id: 'rarity-uncommon',
    name: 'Uncommon',
    displayName: '⭐ Uncommon Stamps',
    description: 'Less common but still desirable stamps',
    filters: {
      rarity: ['uncommon'],
    },
  },
  'rarity-common': {
    id: 'rarity-common',
    name: 'Common',
    displayName: '📮 Common Stamps',
    description: 'Accessible stamps for every collector',
    filters: {
      rarity: ['common'],
    },
  },
};

// Get all categories
export const getCategoriesRouter = router({
  // List all available categories
  listCategories: publicProcedure
    .query(() => {
      return Object.values(CATEGORIES).map(cat => ({
        id: cat.id,
        name: cat.name,
        displayName: cat.displayName,
        description: cat.description,
      }));
    }),

  // Get stamps by era
  byEra: publicProcedure
    .input(z.enum(['1800s', '1900s', 'modern']))
    .query(async ({ input }: { input: string }) => {
      const eraKey = `era-${input.toLowerCase()}`;
      const category = CATEGORIES[eraKey];
      
      if (!category) {
        throw new Error(`Unknown era: ${input}`);
      }

      // In production, fetch from database with filters
      return {
        category: category.displayName,
        description: category.description,
        count: 0, // Would be actual count from DB
        stamps: [], // Would be actual stamps from DB
        filters: category.filters,
      };
    }),

  // Get stamps by rarity
  byRarity: publicProcedure
    .input(z.enum(['legendary', 'rare', 'uncommon', 'common']))
    .query(async ({ input }: { input: string }) => {
      const rarityKey = `rarity-${input}`;
      const category = CATEGORIES[rarityKey];
      
      if (!category) {
        throw new Error(`Unknown rarity: ${input}`);
      }

      return {
        category: category.displayName,
        description: category.description,
        count: 0,
        stamps: [],
        filters: category.filters,
      };
    }),

  // Get stamps by country
  byCountry: publicProcedure
    .input(z.string())
    .query(async ({ input }: { input: string }) => {
      return {
        category: `Stamps from ${input}`,
        description: `Postal history from ${input}`,
        count: 0,
        stamps: [],
        filters: { countries: [input] },
      };
    }),

  // Get category metadata
  getCategoryInfo: publicProcedure
    .input(z.string())
    .query(({ input }: { input: string }) => {
      const category = CATEGORIES[input];
      if (!category) {
        throw new Error(`Category not found: ${input}`);
      }
      return category;
    }),

  // Get featured category
  getFeatured: publicProcedure
    .query(() => {
      return {
        id: 'rarity-legendary',
        name: '👑 Legendary Stamps',
        description: 'The rarest stamps in the world',
        image: 'https://via.placeholder.com/400x300?text=Legendary+Stamps',
        link: '/stamps/category/rarity-legendary',
      };
    }),
});

// Export for use in main router
export default getCategoriesRouter;
