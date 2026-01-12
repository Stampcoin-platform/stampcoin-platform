import nextConnect from 'next-connect';
import multer from 'multer';
import fs from 'fs';

const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  }
});
const upload = multer({ storage });

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: `Something went wrong: ${error.message}` });
  }
});

apiRoute.use(upload.single('file'));
apiRoute.post((req, res) => {
  const file = req.file;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/uploads/${file.filename}`;
  res.status(200).json({ url });
});

export const config = {
  api: {
    bodyParser: false,
  }
};

export default apiRoute;