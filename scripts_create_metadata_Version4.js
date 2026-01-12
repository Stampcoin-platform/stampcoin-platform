/**
 * مثال لتوليد ملف metadata من نتائج الرفع (upload_summary.json أو pinata_summary.json)
 * ويخزن ملف metadata.json نهائي لكل عنصر.
 *
 * تشغيل:
 * node scripts/create_metadata.js
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');

(async () => {
  const outDir = path.resolve(process.env.OUTPUT_DIR || './output');
  const uploadSummaryPath = path.join(outDir, 'upload_summary.json'); // من nft.storage
  if (!fs.existsSync(uploadSummaryPath)) {
    console.error('لم أجد', uploadSummaryPath);
    process.exit(1);
  }
  const items = await fs.readJSON(uploadSummaryPath);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const name = `Stamp #${i+1} - ${it.file}`;
    const metadata = {
      name,
      description: `A collectible stamp: ${it.file}. Uploaded via nft.storage.`,
      image: `ipfs://${it.imageCid}`,
      attributes: [
        { trait_type: 'source', value: 'web-scrape' },
        { trait_type: 'index', value: i+1 }
      ]
    };
    await fs.writeJSON(path.join(outDir, `metadata_${i+1}.json`), metadata, { spaces: 2 });
    console.log('Wrote metadata', `metadata_${i+1}.json`);
  }
  console.log('metadata files created in', outDir);
})();