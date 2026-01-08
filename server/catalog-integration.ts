/**
 * Stamp Catalog Integration
 * Integrates Scott's Stamp Guide, Stanley Gibbons Index, and other catalogs
 */

import axios from 'axios';
import { StampImportData } from './data-import';

export interface CatalogEntry {
  catalogNumber: string;
  catalogName: 'scotts' | 'stanley_gibbons' | 'michel' | 'yvert';
  country: string;
  year: number;
  denomination: string;
  description: string;
  estimatedValue?: {
    mint?: number;
    used?: number;
    currency: string;
  };
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  varieties?: string[];
  printRun?: number;
}

/**
 * Search Scott's Stamp Catalog
 */
export async function searchScottsCatalog(query: {
  country?: string;
  year?: number;
  catalogNumber?: string;
}): Promise<CatalogEntry[]> {
  console.log('[Scotts] Searching catalog:', query);
  
  // Mock implementation - in production, integrate with Scott's API or database
  const entries: CatalogEntry[] = [];
  
  if (query.country) {
    // Generate sample Scott catalog numbers
    const baseNumber = query.year ? query.year : 2000;
    for (let i = 0; i < 5; i++) {
      entries.push({
        catalogNumber: `${baseNumber + i}`,
        catalogName: 'scotts',
        country: query.country,
        year: query.year || new Date().getFullYear(),
        denomination: `${(i + 1) * 10}¢`,
        description: `${query.country} Definitive Series`,
        estimatedValue: {
          mint: (i + 1) * 0.5,
          used: (i + 1) * 0.25,
          currency: 'USD',
        },
        rarity: i === 4 ? 'rare' : i === 3 ? 'uncommon' : 'common',
      });
    }
  }
  
  return entries;
}

/**
 * Search Stanley Gibbons Catalog
 */
export async function searchStanleyGibbons(query: {
  country?: string;
  year?: number;
  catalogNumber?: string;
}): Promise<CatalogEntry[]> {
  console.log('[Stanley Gibbons] Searching catalog:', query);
  
  // Mock implementation - in production, integrate with SG API or database
  const entries: CatalogEntry[] = [];
  
  if (query.country) {
    // Stanley Gibbons numbering system
    const sgBase = query.year ? (query.year - 1900) * 10 : 1000;
    for (let i = 0; i < 5; i++) {
      entries.push({
        catalogNumber: `SG${sgBase + i}`,
        catalogName: 'stanley_gibbons',
        country: query.country,
        year: query.year || new Date().getFullYear(),
        denomination: `${(i + 1) * 10}p`,
        description: `${query.country} Commemorative Issue`,
        estimatedValue: {
          mint: (i + 1) * 1.2,
          used: (i + 1) * 0.6,
          currency: 'GBP',
        },
        rarity: determineRarity(i),
      });
    }
  }
  
  return entries;
}

/**
 * Search Michel Catalog (German)
 */
export async function searchMichelCatalog(query: {
  country?: string;
  year?: number;
}): Promise<CatalogEntry[]> {
  console.log('[Michel] Searching catalog:', query);
  
  // Mock implementation
  return [];
}

/**
 * Search Yvert et Tellier Catalog (French)
 */
export async function searchYvertCatalog(query: {
  country?: string;
  year?: number;
}): Promise<CatalogEntry[]> {
  console.log('[Yvert] Searching catalog:', query);
  
  // Mock implementation
  return [];
}

/**
 * Enrich stamp data with catalog information
 */
export async function enrichWithCatalogData(
  stamp: StampImportData
): Promise<StampImportData & { catalogData?: CatalogEntry[] }> {
  console.log('[Catalog] Enriching stamp:', stamp.name);
  
  const catalogData: CatalogEntry[] = [];
  
  try {
    // Search all catalogs
    const [scotts, stanleyGibbons] = await Promise.all([
      searchScottsCatalog({
        country: stamp.country,
        year: stamp.issueYear,
        catalogNumber: stamp.catalogNumber,
      }),
      searchStanleyGibbons({
        country: stamp.country,
        year: stamp.issueYear,
        catalogNumber: stamp.catalogNumber,
      }),
    ]);
    
    catalogData.push(...scotts, ...stanleyGibbons);
    
    // Use catalog data to enhance stamp information
    if (catalogData.length > 0) {
      const primaryCatalog = catalogData[0];
      
      // Update estimated value if not present
      if (!stamp.estimatedValue && primaryCatalog.estimatedValue) {
        stamp.estimatedValue = `${primaryCatalog.estimatedValue.mint}`;
      }
      
      // Enhance description
      if (!stamp.description || stamp.description === stamp.name) {
        stamp.description = catalogData
          .map(c => c.description)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join('; ');
      }
    }
    
    return { ...stamp, catalogData };
  } catch (error: any) {
    console.error('[Catalog] Enrichment failed:', error.message);
    return stamp;
  }
}

/**
 * Batch enrich stamps with catalog data
 */
export async function batchEnrichStamps(
  stamps: StampImportData[]
): Promise<Array<StampImportData & { catalogData?: CatalogEntry[] }>> {
  console.log(`[Catalog] Batch enriching ${stamps.length} stamps`);
  
  const enriched = [];
  const concurrency = 3;
  
  for (let i = 0; i < stamps.length; i += concurrency) {
    const batch = stamps.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(stamp => enrichWithCatalogData(stamp))
    );
    enriched.push(...results);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return enriched;
}

/**
 * Determine rarity based on various factors
 */
function determineRarity(index: number): 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' {
  if (index === 4) return 'legendary';
  if (index === 3) return 'rare';
  if (index === 2) return 'uncommon';
  return 'common';
}

/**
 * Convert catalog value to USD
 */
export function convertToUSD(value: number, currency: string): number {
  const rates: Record<string, number> = {
    'USD': 1.0,
    'GBP': 1.27,
    'EUR': 1.10,
    'JPY': 0.0071,
    'CAD': 0.74,
  };
  
  return value * (rates[currency] || 1.0);
}

/**
 * Get comprehensive catalog information
 */
export async function getCatalogInfo(
  country: string,
  year: number,
  catalogNumber?: string
): Promise<{
  scotts?: CatalogEntry;
  stanleyGibbons?: CatalogEntry;
  estimatedValueUSD?: number;
  rarity?: string;
}> {
  const [scotts, sg] = await Promise.all([
    searchScottsCatalog({ country, year, catalogNumber }),
    searchStanleyGibbons({ country, year, catalogNumber }),
  ]);
  
  const scottsEntry = scotts[0];
  const sgEntry = sg[0];
  
  let estimatedValueUSD = 0;
  if (scottsEntry?.estimatedValue?.mint) {
    estimatedValueUSD = convertToUSD(
      scottsEntry.estimatedValue.mint,
      scottsEntry.estimatedValue.currency
    );
  } else if (sgEntry?.estimatedValue?.mint) {
    estimatedValueUSD = convertToUSD(
      sgEntry.estimatedValue.mint,
      sgEntry.estimatedValue.currency
    );
  }
  
  return {
    scotts: scottsEntry,
    stanleyGibbons: sgEntry,
    estimatedValueUSD,
    rarity: scottsEntry?.rarity || sgEntry?.rarity,
  };
}
