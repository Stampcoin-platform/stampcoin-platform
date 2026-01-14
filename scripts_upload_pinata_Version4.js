/**
 * رفع الصور إلى Pinata (pinFileToIPFS) — بديل عن nft.storage
 * يتطلب PINATA_API_KEY و PINATA_SECRET_API_KEY في .env
 *
 * تشغيل:
 * npm run upload:pinata
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const pinataSDK = require('@pinata/sdk');

const PINATA_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY;
if (!PINATA_KEY || !PINATA_SECRET) {
  console.error('ضع PINATA_API_KEY و PINATA_SECRET_API_KEY في .env');
  process.exit(1);
}

const pinata = pinataSDK(PINATA_KEY, PINATA_SECRET);

(async () => {
  try {
    const imagesDir = path.resolve('./tmp_images');
    const outDir = path.resolve(process.env.OUTPUT_DIR || './output');
    await fs.ensureDir(outDir);

    const files = (await fs.readdir(imagesDir)).filter(f => !f.startsWith('.'));
    const results = [];

    for (const f of files) {
      const filePath = path.join(imagesDir, f);
      console.log('Pinning to Pinata:', f);
      const readable = fs.createReadStream(filePath);
      const response = await pinata.pinFileToIPFS(readable, {
        pinataMetadata: { name: f }
      });
      // response.IpfsHash
      console.log(' -> IPFS hash:', response.IpfsHash);
      const record = { file: f, ipfsHash: response.IpfsHash, gateway: `https://gateway.pinata.cloud/ipfs/${response.IpfsHash}` };
      results.push(record);
      await fs.appendFile(path.join(outDir, 'pinata_results.json'), JSON.stringify(record) + '\n');
    }

    await fs.writeJSON(path.join(outDir, 'pinata_summary.json'), results, { spaces: 2 });
    console.log('Done. Summary in', path.join(outDir, 'pinata_summary.json'));
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();