// pages/api/upload-to-nftstorage.js
import fs from 'fs';
import path from 'path';
import { NFTStorage, File } from 'nft.storage';
import nextConnect from 'next-connect';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const handler = nextConnect();

// تأكد من أن لديك NFT_STORAGE_API_KEY في env
const client = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY || '' });

handler.use(upload.single('file'));

handler.post(async (req, res) => {
  if (!process.env.NFT_STORAGE_API_KEY) {
    return res.status(500).json({ error: 'NFT_STORAGE_API_KEY not configured' });
  }
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file required (multipart/form-data)' });
    // file.buffer موجود
    const nftFile = new File([file.buffer], file.originalname, { type: file.mimetype });
    // نرفع الملف كـ blob ونأخذ CID
    const cid = await client.storeBlob(nftFile);
    const ipfsUri = `ipfs://${cid}`;
    const gateway = `https://nftstorage.link/ipfs/${cid}`;
    // نعيد النتيجة
    res.json({ cid, ipfsUri, gateway });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'upload failed' });
  }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default handler;
