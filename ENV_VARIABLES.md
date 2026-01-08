# ⚙️ متغيرات البيئة المطلوبة
# Environment Variables Checklist

## 🔴 مطلوبة (Required)

### قاعدة البيانات (Database)
```bash
DATABASE_URL=mysql://user:password@host:3306/database
# أو PostgreSQL: postgresql://user:password@host:5432/database
```

### المصادقة (Authentication)
```bash
JWT_SECRET=<64-character-random-string>
# توليد: openssl rand -hex 32
```

### البيئة (Environment)
```bash
NODE_ENV=production
```

---

## 🟡 موصى بها (Recommended)

### Stripe (للمدفوعات)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### AWS S3 (لتخزين الصور)
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-production
```

---

## ⚪ اختيارية (Optional)

### Blockchain (NFT Features)
```bash
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/KEY
DEPLOYER_PRIVATE_KEY=<wallet-private-key-no-0x>
NFT_CONTRACT_ADDRESS=0x...
```

### IPFS (NFT Metadata)
```bash
PINATA_API_KEY=...
PINATA_API_SECRET=...
# أو
NFT_STORAGE_API_KEY=...
```

### AI Services
```bash
GOOGLE_VISION_API_KEY=...
AZURE_VISION_ENDPOINT=...
AZURE_VISION_KEY=...
OPENAI_API_KEY=sk-...
```

### Email (Notifications)
```bash
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
# أو
RESEND_API_KEY=re_...
```

### Monitoring
```bash
SENTRY_DSN=https://...@sentry.io/...
GA_TRACKING_ID=G-...
```

---

## 📋 نماذج حسب المنصة

### Railway
```bash
# يُضاف تلقائياً من MySQL service:
DATABASE_URL=${{MySQL.DATABASE_URL}}

# أضف يدوياً:
NODE_ENV=production
JWT_SECRET=<generate>
STRIPE_SECRET_KEY=sk_live_...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Render
```bash
# يُضاف تلقائياً من PostgreSQL service:
DATABASE_URL=${{stampcoin-db.DATABASE_URL}}

# أضف يدوياً:
NODE_ENV=production
JWT_SECRET=<generate>
# ... باقي المتغيرات
```

### Vercel
```bash
# أضف جميع المتغيرات في:
# Dashboard → Settings → Environment Variables

DATABASE_URL=mysql://...@aws.connect.psdb.cloud/...
NODE_ENV=production
JWT_SECRET=<generate>
# ... باقي المتغيرات
```

---

## 🔑 توليد المفاتيح

### JWT_SECRET
```bash
openssl rand -hex 32
# أو
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Webhook Secrets
```bash
# Stripe Webhook
# من: https://dashboard.stripe.com/webhooks
# Create endpoint → Copy signing secret
```

---

## ✅ Validation

### تحقق من المتغيرات المطلوبة:
```bash
# في terminal على المنصة:
echo $DATABASE_URL
echo $JWT_SECRET
echo $NODE_ENV

# أو من logs:
# يجب أن لا ترى: "Warning: Missing environment variable..."
```

---

## 📚 مراجع

- [.env.production.example](.env.production.example) - ملف الأمثلة الكامل
- [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) - الدليل الشامل
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - دليل النشر السريع
