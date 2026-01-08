# دليل التثبيت والتكوين
## Installation & Setup Guide

---

## متطلبات التثبيت

### البرامج المطلوبة:
- Node.js 18+ (مع npm أو pnpm)
- MySQL 8+
- Git

### الحزم الإضافية:
```bash
npm install
# أو
pnpm install
```

---

## خطوات التثبيت

### 1. نسخ قاعدة البيانات

```sql
-- إنشاء جداول التوثيق والتداول
CREATE TABLE authenticated_stamps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  stamp_name VARCHAR(255) NOT NULL,
  stamp_country VARCHAR(100) NOT NULL,
  -- ... (انظر ملف Schema)
);

CREATE TABLE stamp_listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stamp_id INT NOT NULL,
  seller_id VARCHAR(255) NOT NULL,
  -- ... (انظر ملف Schema)
);

-- والجداول الأخرى...
```

### 2. تكوين متغيرات البيئة

أنشئ ملف `.env.local`:

```env
# قاعدة البيانات
DATABASE_URL="mysql://user:password@localhost:3306/stampcoin_trading"

# IPFS
PINATA_JWT="your_jwt_token"
PINATA_API_KEY="your_api_key"
PINATA_API_SECRET="your_api_secret"

# NFT Storage
NFT_STORAGE_API_KEY="your_api_key"

# Web3
POLYGON_RPC_URL="https://polygon-rpc.com"
NFT_CONTRACT_ADDRESS="0x0E903614e8Fb61B5D36734D7B435088C5d68B963"
DEPLOYER_PRIVATE_KEY="your_private_key"

# Stripe (اختياري)
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."

# التطبيق
BASE_URL="http://localhost:5173"
API_URL="http://localhost:3000"
```

### 3. تشغيل الخادم

```bash
# تطوير
npm run dev

# إنتاج
npm run build
npm run start
```

### 4. تشغيل قاعدة البيانات

```bash
# ترحيل قاعدة البيانات
npm run migrate

# ملء البيانات التجريبية (اختياري)
npm run seed
```

---

## التحقق من التثبيت

### اختبار الواجهات:

1. **صفحة التوثيق**:
   ```
   http://localhost:5173/authenticate-stamp
   ```

2. **سوق التداول**:
   ```
   http://localhost:5173/trading
   ```

3. **الرصيد الاحتياطي**:
   ```
   http://localhost:5173/escrow
   ```

4. **تتبع الشحن**:
   ```
   http://localhost:5173/shipping
   ```

### اختبار API:

```bash
# إنشاء طابع جديد
curl -X POST http://localhost:3000/trpc/stampAuth.createStamp \
  -H "Content-Type: application/json" \
  -d '{
    "stampName": "اختبار",
    "stampCountry": "السعودية",
    "stampCondition": "mint",
    "estimatedValue": "100",
    "rarity": "rare"
  }'

# الحصول على الطابع
curl http://localhost:3000/trpc/stampAuth.getStamp?stampId=1
```

---

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات

```bash
# تحقق من بيانات الاتصال
mysql -u user -p -h localhost

# أعد إنشاء قاعدة البيانات
DROP DATABASE stampcoin_trading;
CREATE DATABASE stampcoin_trading;
```

### خطأ في IPFS

```bash
# تحقق من مفاتيح Pinata
curl https://api.pinata.cloud/data/testAuthentication \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET"
```

### خطأ في NFT

```bash
# تحقق من العقد الذكي
curl "$POLYGON_RPC_URL" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_chainId",
    "params": []
  }'
```

---

## الاختبار التلقائي

```bash
# تشغيل اختبارات الوحدة
npm test

# تشغيل اختبارات التكامل
npm run test:integration

# تقرير التغطية
npm run test:coverage
```

---

## النشر

### النشر على Render:

```bash
# تعيين متغيرات البيئة
heroku config:set DATABASE_URL="mysql://..."

# نشر التطبيق
git push heroku main
```

### النشر على Fly.io:

```bash
# تسجيل الدخول
fly auth login

# نشر التطبيق
fly deploy
```

---

## الرقابة والصيانة

### سجلات الخادم:

```bash
# عرض السجلات
npm run logs

# اتباع السجلات المباشرة
npm run logs --follow
```

### نسخ احتياطي من قاعدة البيانات:

```bash
# تصدير
mysqldump -u user -p stampcoin_trading > backup.sql

# استيراد
mysql -u user -p stampcoin_trading < backup.sql
```

---

**آخر تحديث**: 2024
**الإصدار**: 1.0
