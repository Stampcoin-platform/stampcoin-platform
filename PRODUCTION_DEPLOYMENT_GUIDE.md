# 🚀 دليل النشر الشامل للإنتاج
## Stampcoin Platform Production Deployment Guide

**التاريخ**: 7 يناير 2026  
**الحالة**: النظام جاهز 100% للنشر  
**قاعدة البيانات**: ✅ 50 طابعًا + عملة STMP محملة

---

## 📋 جدول المحتويات

1. [الخيارات المتاحة للنشر](#deployment-options)
2. [Railway (الموصى به)](#railway-deployment)
3. [Render.com](#render-deployment)
4. [Vercel + PlanetScale](#vercel-deployment)
5. [إعداد قاعدة البيانات](#database-setup)
6. [التحقق من النشر](#deployment-verification)

---

## 🎯 خيارات النشر {#deployment-options}

### مقارنة المنصات

| المنصة | السعر الشهري | قاعدة البيانات | النشر | الأفضل لـ |
|---|---|---|---|---|
| **Railway** ⭐ | $5-20 | MySQL مدمج | تلقائي | الكل في واحد |
| **Render** | $7-25 | PostgreSQL | تلقائي | سهولة الإعداد |
| **Vercel + PlanetScale** | $0-20 | MySQL Serverless | Serverless | الأداء العالي |
| **Fly.io** | $5-10 | خارجي | Docker | التحكم الكامل |

### التوصية: **Railway** 🏆

**الأسباب:**
- ✅ قاعدة بيانات MySQL مدمجة
- ✅ نشر بضغطة واحدة
- ✅ سعر معقول ($5/شهر للبداية)
- ✅ دعم Docker
- ✅ SSL مجاني تلقائي
- ✅ متوافق مع MySQL الحالي

---

## 🚂 النشر على Railway {#railway-deployment}

### الخطوة 1: إنشاء حساب Railway

1. زيارة: https://railway.app
2. تسجيل الدخول بحساب GitHub
3. ربط مستودع المشروع

### الخطوة 2: إنشاء المشروع

```bash
# 1. تثبيت Railway CLI
npm install -g @railway/cli

# 2. تسجيل الدخول
railway login

# 3. إنشاء مشروع جديد
railway init

# 4. ربط المستودع
railway link
```

### الخطوة 3: إضافة قاعدة بيانات MySQL

في لوحة تحكم Railway:
1. اضغط **+ New Service**
2. اختر **Database → MySQL**
3. انتظر حتى تنشئ القاعدة (دقيقة واحدة)

سيتم توليد متغيرات البيئة تلقائيًا:
- `MYSQL_URL`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

### الخطوة 4: إعداد متغيرات البيئة

في Railway Dashboard → Variables:

```bash
# Database (تُضاف تلقائيًا من MySQL service)
DATABASE_URL=${{MySQL.MYSQL_URL}}

# JWT Secret (توليد جديد)
JWT_SECRET=<generate-64-char-random-string>

# Stripe (من dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS S3 (من console.aws.amazon.com)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-production

# Optional: Polygon Blockchain
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/...
NFT_CONTRACT_ADDRESS=0x...

# Optional: IPFS
PINATA_API_KEY=...
PINATA_API_SECRET=...

# Production
NODE_ENV=production
```

### الخطوة 5: تشغيل Migrations

```bash
# الاتصال بقاعدة البيانات
railway run bash

# تشغيل migrations
npm run db:push

# تعبئة البيانات (50 stamp)
npx tsx ./server/seed-stamp-data.ts
```

### الخطوة 6: النشر

```bash
# نشر من CLI
railway up

# أو من GitHub (تلقائي)
git push origin main
```

Railway سينشر تلقائيًا عند كل push!

### الخطوة 7: الوصول للتطبيق

```
https://your-app-name.up.railway.app
```

### إعدادات Railway الإضافية

#### تحسين الأداء

في `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3

[[deploy.environmentVariables]]
name = "NODE_ENV"
value = "production"
```

#### إعداد Domain مخصص

1. في Railway Dashboard → Settings
2. اضغط **Generate Domain**
3. أو أضف domain مخصص:
   - اذهب إلى **Custom Domain**
   - أضف `yourdomain.com`
   - أضف CNAME في DNS provider:
     ```
     CNAME @ your-app.up.railway.app
     ```

---

## 🎨 النشر على Render {#render-deployment}

### الخطوة 1: إنشاء حساب

1. زيارة: https://render.com
2. تسجيل الدخول بحساب GitHub

### الخطوة 2: إنشاء Web Service

1. Dashboard → **New +** → **Web Service**
2. اختر مستودع GitHub
3. الإعدادات:
   - **Name**: `stampcoin-platform`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build && npm run build:frontend`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

### الخطوة 3: إضافة PostgreSQL

1. Dashboard → **New +** → **PostgreSQL**
2. **Name**: `stampcoin-db`
3. **Plan**: Free (512 MB)

سيتم توليد `DATABASE_URL` تلقائيًا.

### الخطوة 4: ربط Database بـ Web Service

1. Web Service → **Environment**
2. أضف:
   ```
   DATABASE_URL = ${{stampcoin-db.DATABASE_URL}}
   ```

### الخطوة 5: إعداد باقي المتغيرات

```bash
# JWT
JWT_SECRET=<64-char-random-string>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-production

# Production
NODE_ENV=production
```

### الخطوة 6: تحويل Schema من MySQL إلى PostgreSQL

⚠️ **مهم**: Render يستخدم PostgreSQL بدلاً من MySQL

```bash
# تعديل drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // تغيير من mysql
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```bash
# تعديل package.json dependencies
- "mysql2": "^3.15.0",
+ "postgres": "^3.4.3",
```

```bash
# تعديل server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient);
```

### الخطوة 7: تشغيل Migrations

```bash
# من terminal محلي
npm run db:push

# ثم تعبئة البيانات
DATABASE_URL="postgresql://..." npx tsx ./server/seed-stamp-data.ts
```

### الخطوة 8: النشر

Render سينشر تلقائيًا! الوصول عبر:
```
https://stampcoin-platform.onrender.com
```

---

## ▲ النشر على Vercel + PlanetScale {#vercel-deployment}

### الميزات
- ✅ Serverless (أداء عالي)
- ✅ PlanetScale MySQL (متوافق مع schema الحالي)
- ✅ Free tier سخي
- ✅ Edge network عالمي

### الخطوة 1: إنشاء قاعدة بيانات PlanetScale

1. زيارة: https://planetscale.com
2. إنشاء حساب مجاني
3. **Create Database** → `stampcoin-db`
4. **Region**: AWS us-east-1
5. انسخ `DATABASE_URL`:
   ```
   mysql://user:password@aws.connect.psdb.cloud/stampcoin-db?ssl={"rejectUnauthorized":true}
   ```

### الخطوة 2: تشغيل Migrations

```bash
# في terminal محلي
export DATABASE_URL="mysql://..."
npm run db:push

# تعبئة البيانات
npx tsx ./server/seed-stamp-data.ts
```

### الخطوة 3: النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel

# أو من GitHub (الطريقة الموصى بها)
```

#### النشر من GitHub:

1. زيارة: https://vercel.com/new
2. Import مستودع GitHub
3. إعدادات:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build && npm run build:frontend`
   - **Output Directory**: `dist`

### الخطوة 4: إعداد متغيرات البيئة

في Vercel Dashboard → Settings → Environment Variables:

```bash
DATABASE_URL=mysql://...@aws.connect.psdb.cloud/...
JWT_SECRET=<64-chars>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-production
NODE_ENV=production
```

### الخطوة 5: إعداد Serverless Functions

إنشاء `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/**",
      "use": "@vercel/static"
    },
    {
      "src": "server/_core/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/_core/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ]
}
```

### الخطوة 6: الوصول

```
https://stampcoin-platform.vercel.app
```

أو domain مخصص:
1. Vercel Dashboard → Domains
2. Add: `yourdomain.com`

---

## 🗄️ إعداد قاعدة البيانات للإنتاج {#database-setup}

### خيارات قاعدة البيانات

#### 1. Railway MySQL (الأسهل) ⭐
```bash
# تُنشأ تلقائيًا مع Railway project
# DATABASE_URL يُضاف تلقائيًا
```

#### 2. PlanetScale (Serverless)
```bash
# Free tier: 5 GB storage, 1 billion row reads/month
# SSL required
DATABASE_URL=mysql://user:pass@aws.connect.psdb.cloud/db?ssl={"rejectUnauthorized":true}
```

#### 3. AWS RDS MySQL
```bash
# Production-grade, scalable
# Cost: ~$15-50/month
DATABASE_URL=mysql://admin:password@stampcoin-db.xyz.us-east-1.rds.amazonaws.com:3306/stampcoin
```

### تشغيل Migrations في الإنتاج

```bash
# Method 1: من terminal محلي
export DATABASE_URL="mysql://production-url..."
npm run db:push
npx tsx ./server/seed-stamp-data.ts

# Method 2: من CI/CD (GitHub Actions)
- name: Run Migrations
  run: |
    npm run db:push
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

# Method 3: من hosting platform CLI
railway run npm run db:push
render run npm run db:push
```

### نسخ البيانات من التطوير إلى الإنتاج

```bash
# 1. تصدير من Docker المحلي
docker exec stampcoin-mysql mysqldump -u stampcoin -pstampcoin123 stampcoin > backup.sql

# 2. استيراد للإنتاج (Railway)
railway run bash
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup.sql

# 3. أو باستخدام أداة GUI
# TablePlus, DBeaver, MySQL Workbench
```

---

## ✅ التحقق من النشر {#deployment-verification}

### Checklist بعد النشر

```bash
# 1. Health Check
curl https://yourdomain.com/api/health
# Expected: {"status":"ok","database":"connected"}

# 2. Database Check
curl https://yourdomain.com/api/trpc/archive.getDatabaseStatus
# Expected: {"populated":true,"stamps":50,"currency":true}

# 3. Test Homepage
curl -I https://yourdomain.com/
# Expected: HTTP/2 200

# 4. SSL Certificate
curl -vI https://yourdomain.com/ 2>&1 | grep -i ssl
# Expected: SSL certificate verify ok

# 5. Environment Variables
# Check logs for any missing env vars
```

### اختبار الميزات الأساسية

#### 1. Collections Page
```
https://yourdomain.com/collections
```
يجب عرض 50 طابعًا

#### 2. Marketplace
```
https://yourdomain.com/marketplace
```
يجب عرض الطوابع المتاحة للشراء

#### 3. Economy
```
https://yourdomain.com/economy
```
يجب عرض معلومات StampCoin

#### 4. Admin Dashboard
```
https://yourdomain.com/admin/dashboard
```
يجب عرض إحصائيات النظام

### مراقبة الأداء

#### إعداد Monitoring

```bash
# 1. Sentry (Error Tracking)
npm install @sentry/node @sentry/react

# في server/_core/index.ts
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
});

# 2. Uptime Monitoring
# استخدم: UptimeRobot, Pingdom, Better Uptime
# Monitor URL: https://yourdomain.com/api/health
# Interval: 5 minutes
```

#### Logs

```bash
# Railway
railway logs

# Render
# Dashboard → Logs tab

# Vercel
vercel logs https://yourdomain.com
```

---

## 🔒 أمان الإنتاج

### إعدادات SSL

جميع المنصات توفر SSL مجاني تلقائيًا:
- ✅ Railway: Let's Encrypt تلقائي
- ✅ Render: SSL تلقائي
- ✅ Vercel: SSL تلقائي

### تأمين متغيرات البيئة

```bash
# ✅ جيد: في hosting platform
Railway → Variables
Render → Environment
Vercel → Environment Variables

# ❌ سيء: في الكود
const apiKey = 'sk_live_123456';

# ❌ خطير: في Git
git commit .env  # NEVER!
```

### CORS

في `server/_core/index.ts`:
```typescript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  credentials: true,
}));
```

### Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
});

app.use('/api/', limiter);
```

---

## 💰 تقدير التكاليف

### Tier المجاني (للبداية)

| المنصة | Database | Bandwidth | المميزات |
|---|---|---|---|
| **Vercel** | خارجي | 100 GB | Serverless |
| **Railway** | - | 500 GB | $5 credit |
| **Render** | 512 MB | 100 GB | PostgreSQL مجاني |

### Tier الإنتاجي ($20-50/شهر)

```
Railway:
  Web Service: $5/month
  MySQL: $10/month
  Total: $15/month

Render:
  Web Service: $7/month
  PostgreSQL: $7/month
  Total: $14/month

Vercel + PlanetScale:
  Vercel Pro: $20/month
  PlanetScale: Free (5 GB)
  Total: $20/month

AWS/GCP (DIY):
  RDS MySQL: $30/month
  EC2 t3.small: $15/month
  Load Balancer: $15/month
  Total: $60/month
```

### نصيحة: ابدأ مع Railway 🏆

- $5-15/month للبداية
- ترقية سهلة حسب النمو
- كل شيء في مكان واحد

---

## 🚀 سكريبت النشر السريع

### Railway (الطريقة الموصى بها)

```bash
#!/bin/bash
# deploy-railway.sh

echo "🚀 Deploying Stampcoin Platform to Railway..."

# 1. Login
railway login

# 2. Create project (first time only)
railway init

# 3. Add MySQL
echo "📦 Adding MySQL database..."
railway add mysql

# 4. Set environment variables
echo "🔐 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# 5. Deploy
echo "📤 Deploying..."
railway up

echo "✅ Deployment complete!"
railway status
railway open
```

استخدام:
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

---

## 📚 موارد إضافية

### الوثائق
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- PlanetScale: https://planetscale.com/docs

### الدعم
- Railway Discord: https://discord.gg/railway
- Render Status: https://status.render.com
- Vercel Help: https://vercel.com/help

### CI/CD
- GitHub Actions: `.github/workflows/deploy.yml`
- تشغيل تلقائي عند push للـ `main` branch

---

## ✨ الخطوات التالية بعد النشر

### 1. تحسين الأداء
- [ ] تفعيل CDN (Cloudflare)
- [ ] تحسين الصور (Sharp, ImageKit)
- [ ] Redis caching
- [ ] Database indexing

### 2. الأمان
- [ ] تفعيل 2FA للحسابات الإدارية
- [ ] Backup استراتيجية
- [ ] Security headers
- [ ] HTTPS enforcement

### 3. المراقبة
- [ ] Sentry error tracking
- [ ] Google Analytics
- [ ] Uptime monitoring
- [ ] Performance monitoring (New Relic, DataDog)

### 4. التسويق
- [ ] SEO optimization
- [ ] Social media setup
- [ ] Email marketing (SendGrid, Resend)
- [ ] Partnership outreach

---

## 🎉 تهانينا!

النظام جاهز للإطلاق مع:
- ✅ 50 طابعًا تاريخيًا
- ✅ عملة StampCoin (500K STMP)
- ✅ نظام دفع Stripe
- ✅ NFT infrastructure
- ✅ AI authentication
- ✅ Expert network
- ✅ Partnership management

**اختر منصة النشر وابدأ!** 🚀

---

**تم إنشاؤه**: 7 يناير 2026  
**آخر تحديث**: 7 يناير 2026  
**الحالة**: ✅ جاهز للإنتاج
