# عنوان / Title
feat: integrate payments & UI (MVP) — دمج واجهة وطرق دفع مبدئية (Stripe/PayPal)

---

## الوصف (بالعربية)
هذا Pull Request يضيف نسخة MVP كاملة لمنصة "منصة الطوابع النادرة" وتشمل:
- مشروع Next.js (pages-router) بواجهة عربية RTL وتحسينات واجهة أساسية.
- Prisma + SQLite مع نماذج: `User`, `Stamp`, `Contact`, `Comment`, `Favorite`.
- رفع صور محلي إلى `public/uploads`؛ صفحات: الرئيسية، تفاصيل الطابع، لوحة إدارة (رفع طوابع)، صفحة تواصل.
- تفاعل: تعليقات ومفضلات (favorites).
- تكاملات دفع أولية (placeholders/examples): Stripe Checkout مع endpoint وWebhook مثال، وPayPal create-order مثال.
- README مفصّل يشرح كيفية التشغيل محليًا، المتغيرات المطلوبة، وإعداد webhooks.
ملاحظة أمان: لا تتضمن التغييرات أي مفاتيح سرية — يجب إضافة مفاتيح Stripe/PayPal/CEX كمتغيرات بيئة أو كـ Secrets في GitHub/Vercel قبل استخدام الإنتاج.

---

## Description (English)
This Pull Request adds a runnable MVP for the Stampcoin platform:
- Next.js (pages router) RTL Arabic UI.
- Prisma + SQLite schema: `User`, `Stamp`, `Contact`, `Comment`, `Favorite`.
- Local image uploads to `public/uploads`; pages: index, stamp details, admin upload, contact.
- Interactions: comments and favorites.
- Payment integrations (placeholders/examples): Stripe Checkout + webhook example, PayPal create-order example.
- Comprehensive README with setup, migration, seeding, env variables, and webhook configuration instructions.
Security: No real API keys are committed. Add production keys as secrets in your hosting provider (Vercel/GitHub). See README for testing and deployment guidance.

---

## الملفات المضافة / Files added
- README.md  
- package.json  
- .env.example  
- prisma/schema.prisma  
- prisma/seed.js  
- lib/prisma.js  
- styles/globals.css  
- pages/_app.js  
- components/Header.jsx  
- components/Footer.jsx  
- components/StampCard.jsx  
- pages/index.js  
- pages/stamps/[id].js  
- pages/admin/upload.js  
- pages/contact.js  
- pages/api/upload.js  
- pages/api/stamps/index.js  
- pages/api/stamps/[id].js  
- pages/api/auth/register.js  
- pages/api/auth/login.js  
- pages/api/contact.js  
- pages/api/pay/stripe.js  
- pages/api/pay/stripe-webhook.js  
- pages/api/pay/paypal-create-order.js  
- pages/api/stamps/[id]/comments.js  
- pages/api/stamps/[id]/favorite.js

---

## طريقة التشغيل محليًا / How to run locally

1. انسخ ملف المتغيرات البيئية:
   cp .env.example .env
   ثم عدّل القيم المناسبة (مثلاً: NEXT_PUBLIC_BASE_URL=http://localhost:3000، NEXT_PUBLIC_CONTACT_PHONE).

2. ثبت الحزم:
   npm install

3. نفّذ المهاجرات (migrations) وأنشئ قاعدة البيانات:
   npx prisma migrate dev --name init

4. شغّل seed لإنشاء بيانات تجريبية:
   npm run seed

5. شغّل الخادم في طور التطوير:
   npm run dev

6. افتح المتصفح على:
   http://localhost:3000

---

## المتغيرات البيئية المطلوبة / Environment variables required
- DATABASE_URL (مثال محلي: `file:./dev.db` أو Postgres URL للإنتاج)  
- JWT_SECRET  
- NEXT_PUBLIC_BASE_URL (مثال: `http://localhost:3000`)  
- NEXT_PUBLIC_CONTACT_PHONE (مثال: `+4915216933122`)  

Stripe:
- STRIPE_SECRET_KEY  
- STRIPE_PUBLISHABLE_KEY  
- STRIPE_WEBHOOK_SECRET (Signing secret من Stripe dashboard عند إنشاء webhook)

PayPal:
- PAYPAL_CLIENT_ID  
- PAYPAL_CLIENT_SECRET

اختياري/تكميلي:
- CEXIO_API_KEY, CEXIO_API_SECRET أو COINBASE_COMMERCE_API_KEY (للدفع بالكريبتو)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (لإشعارات البريد)

> ملاحظة أمنية: لا ترفع ملف `.env` إلى المستودع. استخدم Secrets في GitHub / Vercel.

---

## إعداد Webhooks / Webhook setup

Stripe (أساسيات):
1. في لوحة Stripe → Developers → Webhooks → Add endpoint  
   Endpoint URL: `https://<your-domain>/api/pay/stripe-webhook`  
2. اختَر الحدث: `checkout.session.completed` (وأي أحداث إضافية تحتاجها).  
3. انسخ Signing secret وأضفه إلى `STRIPE_WEBHOOK_SECRET` في Secrets.

اختبار محلي للـ Webhook:
- استخدم `stripe-cli` أو نفق مثل `ngrok`:
  stripe listen --forward-to localhost:3000/api/pay/stripe-webhook

PayPal:
1. في developer.paypal.com → My Apps & Credentials → أنشئ تطبيق sandbox → انسخ Client ID وSecret.  
2. استخدم النقاط المرجعية في `pages/api/pay/paypal-create-order.js` والتي تختار sandbox أو live اعتمادًا على NODE_ENV.  
3. (اختياري) فعل Webhooks من لوحة PayPal ووجِّهها إلى endpoint مناسب إذا رغبت بإشعارات تلقائية.

---

## كيفية اختبار المدفوعات / Testing payments

Stripe (sandbox/test):
- استخدم مفاتيح اختبار `sk_test_...` و `pk_test_...`.  
- بطاقة اختبار شائعة: 4242 4242 4242 4242 (أي تاريخ صلاحية مستقبلي وCVV أي رقم).  
- تحقق من إنشاء جلسة Checkout وأن webhook يصل ويعالج `checkout.session.completed`.

PayPal (sandbox):
- أنشئ حسابات sandbox ومستخدم تجريبي عبر developer.paypal.com.  
- استخدم `pages/api/pay/paypal-create-order.js` للحصول على `approveUrl` ثم اكمل العملية عبر حساب sandbox.

---

## ملاحظات أمنية وإرشادات للإنتاج / Security & Production notes
- لا تُخزن مفاتيح API في الكود أو في المستودع العام. استخدم Secrets في مزود الاستضافة (Vercel/GitHub Actions).  
- استبدل التخزين المحلي للصور بـ S3 أو Cloudinary قبل وضع النظام حيًّا.  
- استبدل SQLite بـ Postgres في البيئات الإنتاجية. حدّث `DATABASE_URL` وشغّل المهاجرات.  
- تحقق دائمًا من توقيع webhooks (Stripe/PayPal) كما في الملفات المضافة.  
- أضِف تحققًا لحجم ونوع الملفات عند الرفع (MIME type وsize limit).  
- أضِف نظام أدوار وصلاحيات (admin) قبل السماح بإنشاء/تعديل/حذف الطوابع علنًا.  
- ضع قيودًا على معدل الطلبات (rate limiting) ودرِّب النظام على التعامل مع حالات الفشل في الشبكة/المدفوعات.

---

## خطوات ما بعد فتح PR / After PR is created
- الرجاء لصق رابط الـ PR هنا لأقوم بمراجعة السريعة للملفات، التأكد من عدم وجود تعارضات مع الفرع `main`، واقتراح تحسينات أمنية أو وظيفية إن لزم.  
- بعد المراجعة أستطيع المساعدة في: إعداد CI/CD، التحويل إلى S3/Postgres، وبناء نموذج أوامر/سجلات للطلبات (orders/transactions).

---

شكراً — انسخ هذا النص كـ `PR_BODY.md` أو الصقه مباشرة في وصف الـ Pull Request عند فتحه. سأتابع مراجعة الفرع فور تزويدي برابط الـ PR.