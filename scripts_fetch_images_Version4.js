/**
 * تحميل الصور من قائمة روابط (images.txt) وحفظها في مجلد مؤقت ./tmp_images
 * images.txt يجب أن يحتوي رابطًا واحدًا لكل سطر
 *
 * تشغيل:
 * 1) ضع قائمة الروابط في images.txt
 * 2) npm run fetch:images
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

async function fetchImage(url, outPath) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  await fs.outputFile(outPath, res.data);
}

(async () => {
  try {
    const listPath = process.env.IMAGES_LIST || './images.txt';
    if (!fs.existsSync(listPath)) {
      console.error('ضع ملف images.txt أو حدّد IMAGES_LIST في .env');
      process.exit(1);
    }
    const lines = (await fs.readFile(listPath, 'utf8')).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const outDir = path.resolve('./tmp_images');
    await fs.ensureDir(outDir);
    console.log('Downloading', lines.length, 'images...');
    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
      const fileName = `img_${String(i+1).padStart(3,'0')}${ext}`;
      const outPath = path.join(outDir, fileName);
      try {
        await fetchImage(url, outPath);
        console.log('Saved', url, '->', outPath);
      } catch (e) {
        console.error('Failed to download', url, e.message);
      }
    }
    console.log('Done. Images in', outDir);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();