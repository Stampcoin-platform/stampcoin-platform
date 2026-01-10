# Stampcoin Platform - سريع والتشغيل والنشر

## 🚀 تشغيل محلي فوري

### تشغيل عبر Docker Compose (الأسهل)

```bash
cd /workspaces/Stampcoin-platform
docker compose --env-file .env.docker up -d
docker compose ps
```

**الخدمات:**
- **App:** http://localhost:3000 (الواجهة الأمامية + API)
- **Database Manager (Adminer):** http://localhost:8080
- **Cache Manager (Redis Commander):** http://localhost:8081
- **Email Tester (MailHog):** http://localhost:8025

### التحقق من الصحة

```bash
# تشغيل الاختبارات
pnpm test -- --reporter=dot

# عرض السجلات
docker logs stampcoin-app --tail 200

# إيقاف جميع الخدمات
docker compose down
```

---

## 📊 تطبيق الاختبارات والتغطية

```bash
# تشغيل الاختبارات مع التغطية
pnpm test -- --coverage

# عرض تقرير التغطية HTML
open coverage/index.html
```

---

## 🌐 GitHub Pages و Investor Portal

**الحالة:** مُعد وجاهز عند الدفع لـ `main`.

1. تأكد من أن الفرع الحالي `main`:
   ```bash
   git branch -a
   git checkout main
   ```

2. GitHub Actions ستعمل تلقائياً عند الدفع:
   - تشغيل الاختبارات والفحوصات
   - توليد شارة التغطية
   - نشر Investor Portal و Coverage على GitHub Pages

3. عرض النتائج:
   - **Investor Portal:** `https://stampcoin-platform.github.io/Stampcoin-platform/`
   - **Coverage Report:** `https://stampcoin-platform.github.io/Stampcoin-platform/coverage/`

---

## 🚢 نشر خارجي (تحضيري)

### خيار 1: Fly.io (موصى به - توفر ائتماني)

```bash
# التثبيت والمصادقة
curl -L https://fly.io/install.sh | sh
flyctl auth login

# تشغيل النشر
./deploy-flyio.sh

# متابعة حالة الناشر
flyctl logs -a stampcoin
```

**المتطلبات:**
- حساب Fly.io
- `FLY_ACCESS_TOKEN` (من لوحة البيانات)

### خيار 2: Railway (سريع وبسيط)

```bash
# إعداد المشروع
./deploy-railway-setup.sh

# النشر
./deploy-railway.sh
```

**المتطلبات:**
- حساب Railway
- توكن API من لوحة البيانات

### خيار 3: Render (مجاني مع قيود)

```bash
./deploy-render.sh
```

### خيار 4: Vercel (الواجهة الأمامية فقط)

```bash
./deploy-vercel.sh
```

---

## 🔧 متغيرات البيئة (الإنتاج)

**ملف النموذج:** `.env.deploy.example`

**نسخ وتعبئة:**
```bash
cp .env.deploy.example .env.deploy
# ملء جميع القيم الفارغة
nano .env.deploy
```

**المتغيرات الأساسية:**
- `DATABASE_URL` - MySQL (مُدار أو VPS)
- `JWT_SECRET` - توليد: `openssl rand -hex 32`
- `CEX_USER_ID` - 162853244 (بالفعل مُعيّن)
- `STRIPE_SECRET_KEY` - من Stripe dashboard
- `PINATA_API_KEY` - من Pinata (IPFS)
- `POLYGON_RPC_URL` - https://polygon-rpc.com
- `AWS_ACCESS_KEY_ID` - (اختياري) للتخزين

---

## 💳 إعداد CEX.io كطريقة دفع

تمّ بالفعل إضافة:
- **معرّف المستخدم:** `162853244`
- **عنوان المحفظة:** (اختياري - سيتم إضافته عند الطلب)

**التفعيل:**
```bash
# في .env.deploy أو بيئة الإنتاج:
CEX_USER_ID=162853244
CEX_WALLET_ADDRESS=your_cex_wallet_address
CEX_API_KEY=your_cex_api_key  # (اختياري)
CEX_API_SECRET=your_cex_api_secret  # (اختياري)
```

---

## 📝 مراجعة سريعة للملفات الأساسية

| الملف | الغرض |
|------|-------|
| [docker-compose.yml](docker-compose.yml) | تعريف خدمات Docker |
| [Dockerfile](Dockerfile) | بناء صورة التطبيق |
| [.env.docker](.env.docker) | متغيرات بيئة آمنة للاختبار المحلي |
| [.env.deploy.example](.env.deploy.example) | نموذج متغيرات الإنتاج |
| [fly.toml](fly.toml) | إعدادات Fly.io |
| [package.json](package.json) | أوامر مهمة: `pnpm dev`, `pnpm build`, `pnpm test` |

---

## ✅ قائمة نشر سريعة

- [ ] تشغيل محلي: `docker compose up -d`
- [ ] اختبارات: `pnpm test`
- [ ] تغطية: `pnpm test -- --coverage`
- [ ] دفع إلى `main`: يُشغّل GitHub Actions تلقائياً
- [ ] التحقق من Pages: انتظر 2-3 دقائق
- [ ] اختيار منصة نشر خارجي
- [ ] ملء بيئة الإنتاج
- [ ] تشغيل سكريبت النشر
- [ ] تحديث DNS (إذا استخدمت نطاقك الخاص)
- [ ] اختبار الدفع و OAuth

---

## 🆘 المساعدة السريعة

| المشكلة | الحل |
|-------|------|
| MySQL غير متوفر محلياً | `docker compose up mysql -d` |
| الاختبارات فاشلة | `pnpm install` ثم `pnpm test` |
| النشر يفشل | تحقق من `FLY_ACCESS_TOKEN` أو التوكنات الأخرى |
| لا تطبيق عند 3000 | تحقق: `docker logs stampcoin-app` |

---

**تاريخ التحديث:** يناير 10، 2026  
**الحالة:** مُجهّز بالكامل للتشغيل المحلي والنشر الخارجي
