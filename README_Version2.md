```markdown
# Stampcoin Platform — MVP (Next.js + Prisma + Payments)

محتوى بالعربية (ملخّص)
=====================
هذه نسخة MVP لمنصة "منصة الطوابع النادرة" — واجهة عربية RTL، backend بسيط عبر Next.js API Routes، قاعدة بيانات SQLite عبر Prisma، رفع صور محلي، تعليقات، مفضلات، صفحة اتصال، وتجهيزات لبوابات دفع Stripe وPayPal (placeholders + webhooks أمثلة).

ماذا يحتوي المشروع
- واجهة Next.js (pages-router) بالـ RTL (عربية)
- Prisma + SQLite (نماذج: User, Stamp, Contact, Comment, Favorite)
- رفع صور محليًا إلى `public/uploads`
- صفحات: الرئيسية، تفاصيل الطابع، لوحة إدارة (رفع طابع)، صفحة الاتصال
- التفاعل: تعليقات، مفضلات
- تكامل دفع اختباري: Stripe Checkout + webhook مثال، PayPal create-order مثال
- طرق دفع إضافية (مرجع للكريبتو: CEX.IO / Coinbase) كـ TODO

English summary
===============
This is an MVP for Stampcoin — Arabic RTL frontend with Next.js, Prisma (SQLite) backend, local image uploads, comments & favorites, contact form, and payment integrations placeholders for Stripe & PayPal (with webhook examples). Designed to run locally and be upgraded for production (S3/Cloudinary, Postgres, secure webhooks).

Quickstart (local)
==================
Requirements:
- Node.js 18+
- npm (or yarn)
- Git

1. Clone repo & create branch (example)
   git clone https://github.com/Stampcoin-platform/Stampcoin-platform.git
   cd Stampcoin-platform
   git checkout -b feature/integrate-payments-and-ui

2. Install dependencies
   npm install

3. Create .env (copy from .env.example)
   cp .env.example .env
   - Edit `.env` and set NEXT_PUBLIC_BASE_URL (http://localhost:3000), NEXT_PUBLIC_CONTACT_PHONE, and other placeholders.
   - For local testing you can keep DATABASE_URL="file:./dev.db".

4. Migrate and seed
   npx prisma migrate dev --name init
   npm run seed

5. Run dev server
   npm run dev
   Open http://localhost:3000

Environment variables (required)
- DATABASE_URL (e.g. file:./dev.db or postgres URL in production)
- JWT_SECRET
- NEXT_PUBLIC_BASE_URL (e.g. http://localhost:3000)
- NEXT_PUBLIC_CONTACT_PHONE (e.g. +4915216933122)
- STRIPE_SECRET_KEY (sk_test_...)
- STRIPE_PUBLISHABLE_KEY (pk_test_...)
- STRIPE_WEBHOOK_SECRET (from Stripe dashboard when you create webhook)
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- (Optional) CEXIO_API_KEY, CEXIO_API_SECRET, COINBASE_COMMERCE_API_KEY, SMTP_* for email notifications

Stripe webhook setup (basic)
1. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   https://your-domain.com/api/pay/stripe-webhook
2. Copy the signing secret and add to STRIPE_WEBHOOK_SECRET in your environment.

PayPal sandbox
1. developer.paypal.com → My Apps & Credentials → create app (sandbox/test)
2. Copy client id & secret → add to env.
3. Use `pages/api/pay/paypal-create-order.js` to create orders. The returned `approveUrl` redirects user to PayPal to approve.

Production recommendations
- Storage: Replace local uploads with S3 or Cloudinary (signed uploads).
- DB: Use Postgres in production (update DATABASE_URL and deploy migrations).
- Secrets: Use hosting provider secrets (Vercel Environment Variables, GitHub Secrets).
- Webhooks: Always verify signatures (Stripe & PayPal) and handle retries.
- Security: Validate file uploads (MIME type, extension, size), add rate limits, implement role-based access for admin/expert actions.

Testing payments
- Stripe: use test keys and test cards (4242 4242 4242 4242). Test webhook locally with `stripe-cli` or via tunnel (ngrok).
- PayPal: use sandbox accounts and app credentials from developer.paypal.com.

Files added / modified
- README.md, package.json, .env.example
- prisma/schema.prisma, prisma/seed.js
- lib/prisma.js
- styles/globals.css
- pages/* and components/*
- pages/api/* (stamps, upload, auth, contact, pay/stripe, pay/paypal, comments, favorite)

How to open a Pull Request (git + gh)
1. Create branch locally:
   git checkout -b feature/integrate-payments-and-ui
2. Add files, commit, push:
   git add .
   git commit -m "feat: integrate payments & UI MVP"
   git push -u origin feature/integrate-payments-and-ui
3. Open PR (GitHub web UI or gh CLI):
   gh pr create --title "feat: integrate payments & UI (MVP)" --base main --body "PR description..."

Support
- سأقدّم خطوات إعداد مفاتيح وwebhooks بعد فتح PR. عند النشر، أستطيع المساعدة في تبديل التخزين لـ Cloudinary/S3 وDB إلى Postgres، وكذلك تكامل CEX.IO أو Coinbase Commerce عند تزويدي بمفاتيح كـ Secrets (لا ترسل مفاتيح هنا).
```