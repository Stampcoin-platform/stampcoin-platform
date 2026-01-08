#!/usr/bin/env node

/**
 * Initialize Stamp Archive with sample data
 * Usage: npm run init:archive
 */

import * as archiveService from '../stamp-archive';
import * as archiveDownloader from '../archive-downloader';

async function initializeArchive() {
  console.log('🏛️  Initializing Stamp Archive System...\n');

  try {
    // Get sample stamps
    console.log('📚 Loading ALL stamps from collection...');
    const stamps = archiveDownloader.getSampleStamps(100); // Get all available stamps
    console.log(`✅ Loaded ${stamps.length} stamps\n`);

    // Validate stamps
    console.log('🔍 Validating stamp data...');
    const validStamps = stamps.filter((stamp) => {
      const validation = archiveDownloader.validateStampData(stamp);
      if (!validation.valid) {
        console.warn(`⚠️  ${stamp.id}: ${validation.errors.join(', ')}`);
      }
      return validation.valid;
    });
    console.log(`✅ ${validStamps.length}/${stamps.length} stamps validated\n`);

    // Import stamps
    console.log('📥 Importing stamps into archive...');
    
    // Map ArchiveStampData to StampMetadata format
    const mappedStamps = validStamps.map(stamp => ({
      archiveId: stamp.id,
      country: stamp.country,
      denomination: parseInt(stamp.denomination) || 1,
      year: stamp.year,
      catalog: stamp.catalog,
      condition: stamp.condition,
      rarity: stamp.rarity,
      description: stamp.description,
      imageUrl: stamp.imageUrl,
    }));
    
    const results = await archiveService.batchImportStamps(mappedStamps);

    // Summary
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log('\n📊 Import Summary:');
    console.log(`  ✅ Successful: ${successful.length}`);
    console.log(`  ❌ Failed: ${failed.length}`);
    console.log(`  📈 Total: ${results.length}\n`);

    if (failed.length > 0) {
      console.log('Failed imports:');
      failed.forEach((f) => {
        console.log(`  - ${f.archiveId}: ${f.error}`);
      });
    }

    // Display statistics
    const stats = await archiveService.getArchiveStats();
    console.log('\n📈 Archive Statistics:');
    console.log(`  Total Stamps: ${stats.totalStamps}`);
    console.log(`  Total USD Value: $${stats.totalUSDValue.toFixed(2)}`);
    console.log(`  Total StampCoins: ${stats.totalStampCoins}`);

    console.log('\n📊 By Rarity:');
    stats.byRarity.forEach((rarity) => {
      console.log(
        `  ${rarity.rarity.padEnd(12)}: ${rarity.count} stamps, avg value $${rarity.avgValue.toFixed(2)}`
      );
    });

    console.log('\n📍 Top Countries:');
    stats.byCountry
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .forEach((country) => {
        console.log(`  ${country.country}: ${country.count} stamps, total value $${country.totalValue.toFixed(2)}`);
      });

    console.log('\n✨ Archive initialization complete!');
    console.log('🌐 View at: https://stampcoin-platform.fly.dev/archive');
    console.log('💰 Economy: https://stampcoin-platform.fly.dev/economy\n');

  } catch (error) {
    console.error('❌ Error initializing archive:', error);
    process.exit(1);
  }
}

// Run initialization
initializeArchive().catch(console.error);
