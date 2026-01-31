# StampCoin Platform — Rare Digital Stamps on Blockchain

حل متكامل لتحويل الطوابع النادرة إلى أصول رقمية موثّقة وقابلة للتداول على Polygon مع سوق NFT، مصادقة خبراء، وأرشيف رقمي دائم.

![CI](https://img.shields.io/github/actions/workflow/status/Stampcoin-platform/Stampcoin-platform/ci.yml?label=CI)
![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/Stampcoin-platform/Stampcoin-platform/main/badges/coverage.json)
[View Coverage Report](https://stampcoin-platform.github.io/Stampcoin-platform/coverage/)

## بوابة المستثمر
- Investor Portal (GitHub Pages): https://stampcoin-platform.github.io/Stampcoin-platform/
- يتضمن: One‑Pager، Deck، Roadmap، FAQ، وتقرير التغطية.
![Node](https://img.shields.io/badge/node-20.x-brightgreen)
![Status](https://img.shields.io/badge/status-Ready%20to%20Demo-blue)
![License](https://img.shields.io/badge/license-Proprietary-orange)

## لمحة سريعة
- واجهة React 19 (Vite + Tailwind) + tRPC + Express
- Drizzle ORM مع MySQL، ودعم Redis/Storage/IPFS
- تكامل Polygon وIPFS، مسارات سكّ NFT وخدمات توثيق الخبراء
- أدوات نشر آلية وملفات تشغيل على IONOS / Fly.io / Railway

## التشغيل المحلي (مجاناً)
1) تثبيت المتطلبات: Node 20، pnpm
2) نسخ القيم من `.env.deploy.example` إلى `.env.local` واستعمال مفاتيح تجريبية (Stripe/CEX/Polygon testnet)
3) أوامر:

```bash
pnpm install
pnpm dev            # Frontend + Backend (التطوير)
```

ملاحظة: وضع العرض التجريبي مفعّل عبر `DEMO_MODE=true` لتعطيل أي استدعاءات مدفوعة واستعمال مفاتيح/شبكات اختبار.

## البنية
- الواجهة: `client/src`
- الخادم: `server`
- المشترك: `shared`
- قاعدة البيانات: `drizzle/schema.ts` (المصدر الأساسي)

## لماذا الآن؟
- محتوى ثقافي عميق (Philately) + Web3 يفتح سيولة عالمية جديدة
- ملكية رقمية قابلة للتحقق + أرشفة دائمة على IPFS
- تجربة استخدام مبسطة (tRPC + React) وعمليات آمنة (JWT/Role/Router)

## للمستثمرين
- One‑Pager: انظر [INVESTOR_ONE_PAGER.md](INVESTOR_ONE_PAGER.md)
- Deck مختصر: انظر [PITCH_DECK.md](PITCH_DECK.md)
- الأسئلة الشائعة: انظر [INVESTOR_FAQ.md](INVESTOR_FAQ.md)
- خارطة الطريق: انظر [ROADMAP.md](ROADMAP.md)
- غرفة البيانات: انظر [DATA_ROOM_CHECKLIST.md](DATA_ROOM_CHECKLIST.md)
- المقاييس والتحليلات: انظر [METRICS_AND_ANALYTICS.md](METRICS_AND_ANALYTICS.md)

## العرض التجريبي
اتبع [DEMO_PLAYBOOK.md](DEMO_PLAYBOOK.md) لتشغيل سيناريو Demo سريع (بدون مزودات مدفوعة) وإظهار سكّ وشراء NFT تجريبي.

## الجودة والبنى التحتية
- CI مجّاني عبر GitHub Actions: typecheck + tests (اختياري)
- سكربتات نشر: IONOS / Fly.io / Railway

## تواصل
- بريد: stampcoin.contact@gmail.com
- موقع: https://stampcoin-platform.fly.dev
# StampCoin Platform 🪙

**© 2024-2026 Stampcoin Platform - Proprietary and Confidential**

منصة ثورية لتداول الطوابع الرقمية كـ NFTs مدعومة بتقنية Blockchain.

A revolutionary blockchain-powered NFT marketplace for rare stamp collecting and trading.

> ⚠️ **NOTICE:** This is proprietary software. All rights reserved. Unauthorized use is prohibited.  
> 📋 See [LICENSE](LICENSE), [COPYRIGHT](COPYRIGHT), and [INTELLECTUAL_PROPERTY.md](INTELLECTUAL_PROPERTY.md) for details.

## 🌟 الحالة الحالية | Current Status

✅ **جاهز للنشر 100%** | Production Ready  
✅ **50 طابعًا تاريخيًا محملة** | 50 Historical Stamps Loaded  
✅ **عملة StampCoin (STMP) مُهيأة** | StampCoin Currency Configured  
✅ **جميع الأنظمة تعمل** | All Systems Operational

## 🚀 نشر سريع | Quick Deploy

```bash
# Railway (الموصى به | Recommended)
./deploy-railway.sh

# Render.com
./deploy-render.sh

# Vercel + PlanetScale
./deploy-vercel.sh
```

📚 **[دليل النشر الكامل](PRODUCTION_DEPLOYMENT_GUIDE.md)** | Full Deployment Guide  
⚡ **[دليل النشر السريع](QUICK_DEPLOY.md)** | Quick Deploy Guide

## 📋 الميزات | Features

### الأساسية | Core
- **مكتبة طوابع رقمية** - 50 طابعًا تاريخيًا (1840-1999)
- **نظام NFT** - تحويل الطوابع إلى NFTs على Polygon
- **تداول آمن** - نظام دفع Stripe متكامل
- **عملة StampCoin** - 500,000 STMP بسعر $0.50
- **مصادقة متقدمة** - نظام JWT آمن
- **واجهة متجاوبة** - تعمل على جميع الأجهزة

### المتقدمة | Advanced
- **شبكة الخبراء** - نظام تقييم وتوثيق الطوابع
- **إدارة الشراكات** - نظام كامل لإدارة الشركاء
- **ذكاء اصطناعي** - كشف التزييف والتحقق
- **IPFS Storage** - تخزين لامركزي للبيانات
- **التحليلات** - لوحة تحكم إدارية شاملة

## 🛠️ التقنيات | Tech Stack

### Frontend
- **React 19** + TypeScript 5.9
- **Vite 6** - Build tool
- **TailwindCSS 4** - Styling
- **tRPC** - Type-safe APIs
- **Wouter** - Routing (7.7 KB)
- **shadcn/ui** - Component library

### Backend
- **Node.js 22**
- **Express** - Web server
- **tRPC v11** - API layer
- **Drizzle ORM** - Database
- **MySQL 8** - Production database

### Blockchain
- **ethers.js 6** - Web3 integration
- **Polygon Network** - L2 scaling
- **IPFS/Pinata** - Decentralized storage
- **Smart Contracts** - ERC-721 NFTs

### Cloud & DevOps
- **Railway/Render/Vercel** - Hosting options
- **AWS S3** - File storage
- **Stripe** - Payment processing
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## 📊 قاعدة البيانات | Database

### الإحصائيات | Statistics
- ✅ **50 طابعًا** من 28 دولة
- ✅ **الفترة**: 1840-1999 (160 سنة)
- ✅ **القيمة**: $5 - $200M
- ✅ **عملة**: StampCoin (500K STMP)

### التصنيفات | Categories
- 🏆 **Legendary**: 5 طوابع (قيمة حتى $200M)
- 💎 **Very Rare**: 5 طوابع
- ⭐ **Rare**: 11 طابعًا
- 🔸 **Uncommon**: 18 طابعًا
- 📮 **Common**: 11 طابعًا

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AzadZedan/Stampcoin-platform.git
   cd Stampcoin-platform
   ```

2. **Install dependencies**
   ```bash
  npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory (see `.env.example` for the full list):
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   CDN_BASE_URL=
   
   # Session / Auth
   JWT_SECRET=your-random-secret-key
   OWNER_OPEN_ID=your-owner-open-id
   OAUTH_SERVER_URL=https://oauth.example.com
   VITE_OAUTH_PORTAL_URL=http://localhost:4000
   VITE_APP_ID=stampcoin-platform
   
   # Analytics (Umami)
   VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
   VITE_ANALYTICS_WEBSITE_ID=your-website-id
   
   # Node
   NODE_ENV=development
   PORT=3000
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Run development server**
   ```bash
  npm run dev
   ```

   The app will be available at http://localhost:3000

## 🏗️ Build & Deploy

### Build for production
```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build

# Start production server (will build if not already built via prestart)
npm start
```

### Deploy to Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**
   ```bash
   fly auth login
   ```

3. **Deploy**
   ```bash
   fly deploy -a stampcoin-platform
   ```

4. **Set environment variables**
   ```bash
   fly secrets set DATABASE_URL="mysql://..." -a stampcoin-platform
   fly secrets set STRIPE_SECRET_KEY="sk_..." -a stampcoin-platform
   fly secrets set JWT_SECRET="your-secret" -a stampcoin-platform
   # ... add all other secrets
   ```

## 📁 Project Structure

```
stampcoin-platform/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Backend Express app
│   ├── _core/            # Core server functionality
│   │   ├── index.ts      # Server entry point
│   │   ├── oauth.ts      # OAuth authentication
│   │   ├── trpc.ts       # tRPC setup
│   │   └── vite.ts       # Vite integration
│   ├── db.ts             # Database operations
│   ├── routers.ts        # API routes
│   ├── storage.ts        # S3 storage
│   └── stripe-webhook.ts # Stripe webhooks
├── drizzle/              # Database schema & migrations
├── shared/               # Shared types & constants
├── .github/workflows/    # CI/CD workflows
├── Dockerfile            # Docker configuration
├── fly.toml              # Fly.io configuration
└── package.json          # Dependencies
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run check

# Format code
npm run format
```

## 🔒 Security

This project follows strict security best practices:

- **Command Execution**: Array-based arguments to prevent shell injection ([docs/SECURE_COMMAND_EXECUTION.md](docs/SECURE_COMMAND_EXECUTION.md))
- **Input Validation**: Zod schemas for all user inputs
- **Authentication**: JWT-based secure authentication
- **Secrets Management**: Environment variables only (never commit secrets)
- **CodeQL Analysis**: Automated security scanning via GitHub Actions

**Security Resources:**
- [Security Policy](SECURITY.md) - Reporting vulnerabilities
- [Command Execution Guidelines](docs/SECURE_COMMAND_EXECUTION.md) - Secure coding practices
- [Command Execution Examples](docs/SECURE_COMMAND_EXAMPLES.md) - Practical examples

**For security issues:** security@stampcoin.platform

## 🔧 Scripts

- `npm dev` - Start development server
- `npm build` - Build backend
- `npm build:frontend` - Build frontend
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run check` - Type check
- `npm run format` - Format code
- `npm run db:push` - Push database schema

## 🐛 Troubleshooting

### OAuth Errors
If you see "OAUTH_SERVER_URL is not configured", this is normal if you're not using OAuth authentication. The app will work without it.

### Database Connection Issues
Make sure your DATABASE_URL is correct and the database is accessible from your deployment environment.

### Stripe Webhook Issues
For local development, use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Build Errors
Clear cache and rebuild:
```bash
rm -rf node_modules dist client/dist
npm install
npm run build:frontend
npm run build
```

## 📄 License & Copyright

**© 2024-2026 Stampcoin Platform. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, modification,
distribution, or use of this software, via any medium, is strictly prohibited 
without express written permission.

**License:** UNLICENSED - Proprietary Software  
**See:** [LICENSE](LICENSE) and [COPYRIGHT](COPYRIGHT) files for complete terms

📋 **[Full Intellectual Property Documentation](INTELLECTUAL_PROPERTY.md)**

### ⚠️ Important Notice

- ✅ This is **proprietary software** - not open source
- ❌ **No redistribution** without written permission
- ❌ **No commercial use** without license agreement
- ❌ **No reverse engineering** or decompilation
- ❌ **No trademark usage** without authorization

For licensing inquiries: **legal@stampcoin.platform**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For major contributions, please contact us first to discuss the proposed changes.

## 📧 Contact

- **General:** info@stampcoin.platform
- **Legal/Licensing:** legal@stampcoin.platform
- **Partnerships:** partners@stampcoin.platform
- **Support:** support@stampcoin.platform
- **Website:** https://stampcoin.platform
- **Repository:** https://github.com/Stampcoin-platform/Stampcoin-platform

## 🙏 Acknowledgments

Built with modern web technologies and deployed on Fly.io infrastructure.

---

**Made with ❤️ by the StampCoin Team**
