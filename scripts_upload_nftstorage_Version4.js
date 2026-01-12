/**
 * رفع ملفات الصور الموجودة في ./tmp_images إلى nft.storage
 * ينشئ metadata لكل صورة (name, description, image) ويخزن النتيجة محليًا في ./output/metadata-*.json
 *
 * متطلبات:
 * - ضع NFT_STORAGE_API_KEY في .env
 * - نفّذ أولاً npm run fetch:images لملء tmp_images
 *
 * تشغيل:
 * npm run upload:nftstorage
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { NFTStorage, File } = require('nft.storage');

const API_KEY = process.env.NFT_STORAGE_API_KEY;
if (!API_KEY) {
  console.error('ضع NFT_STORAGE_API_KEY في .env');
  process.exit(1);
}

const client = new NFTStorage({ token: API_KEY });

async function uploadFile(filePath) {
  const content = await fs.readFile(filePath);
  const name = path.basename(filePath);
  const file = new File([content], name);
  const cid = await client.storeBlob(file); // storeBlob returns CID
  return cid;
}

async function storeMetadata(name, description, imageCid) {
  // يمكن استخدام client.store({...}) للحصول على metadata متكامل؛ هنا نرفع JSON يدوياً
  const metadata = {
    name,
    description,
    image: `ipfs://${imageCid}`,
    properties: {
      source: 'stampcoin-batch'
    }
  };
  const blob = new File([JSON.stringify(metadata)], `${name.replace(/\s+/g,'_')}.json`, { type: 'application/json' });
  const metaCid = await client.storeBlob(blob);
  return metaCid;
}

(async () => {
  try {
    const imagesDir = path.resolve('./tmp_images');
    const outDir = path.resolve(process.env.OUTPUT_DIR || './output');
    await fs.ensureDir(outDir);

    const files = (await fs.readdir(imagesDir)).filter(f => !f.startsWith('.'));
    const results = [];

    for (const f of files) {
      const filePath = path.join(imagesDir, f);
      console.log('Uploading image:', f);
      const imageCid = await uploadFile(filePath);
      console.log(' -> image CID:', imageCid);

      const name = path.parse(f).name;
      const description = `Stamp image ${name} uploaded via nft.storage for Stampcoin`;
      const metaCid = await storeMetadata(name, description, imageCid);
      console.log(' -> metadata CID:', metaCid);

      const metadataUrl = `ipfs://${metaCid}`;
      const gatewayUrl = `https://nftstorage.link/ipfs/${metaCid}`;

      const record = { file: f, imageCid, metaCid, metadataUrl, gatewayUrl };
      results.push(record);
      await fs.appendFile(path.join(outDir, 'upload_results.json'), JSON.stringify(record) + '\n');
    }

    await fs.writeJSON(path.join(outDir, 'upload_summary.json'), results, { spaces: 2 });
    console.log('All done. Summary in', path.join(outDir, 'upload_summary.json'));
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();