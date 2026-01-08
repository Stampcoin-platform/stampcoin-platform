# 💻 Local Development Setup
# إعدادات التطوير المحلي

## ⚡ البدء السريع جداً (5 دقائق)

```bash
# 1. استنسخ المستودع
git clone https://github.com/yourusername/stampcoin-platform.git
cd stampcoin-platform

# 2. ثبّت المتطلبات
npm install -g pnpm
pnpm install

# 3. أنشئ ملف البيئة
cp .env.local.example .env.local

# 4. شغّل Docker
docker-compose up -d

# 5. شغّل التطبيق
pnpm dev

# 6. افتح المتصفح
http://localhost:5173
```

**الوقت**: 5-10 دقائق  
**السهولة**: ⭐⭐⭐⭐⭐

---

## 📋 المتطلبات

### المتطلبات الأساسية

```bash
# Node.js 18+
node --version    # >= 18.0.0

# pnpm
npm install -g pnpm
pnpm --version    # >= 8.0.0

# Docker
docker --version  # >= 20.0
docker-compose --version  # >= 2.0

# Git
git --version     # >= 2.0
```

### Installation

```bash
# Node.js (Linux/Mac)
curl -fsSL https://fnm.io/install | bash
fnm install 18
fnm use 18

# pnpm
npm install -g pnpm

# Docker (Desktop)
https://www.docker.com/products/docker-desktop

# WSL2 (Windows)
wsl --install
```

---

## 🗂️ بنية المشروع

```
stampcoin-platform/
├── client/              # React Frontend
│   ├── src/
│   │   ├── components/  # React Components
│   │   ├── hooks/       # Custom Hooks
│   │   ├── pages/       # Page Components
│   │   └── lib/         # Utilities
│   └── vite.config.ts
├── server/              # Node.js Backend
│   ├── api.ts           # tRPC Router
│   ├── db.ts            # Database
│   ├── seed-data.ts     # Seeding
│   └── routes/          # API Routes
├── shared/              # Shared Types
│   └── schema.ts        # Drizzle Schema
├── contracts/           # Smart Contracts
├── drizzle/             # Database Migrations
├── docker-compose.yml   # Docker Configuration
└── .env.local           # Local Environment
```

---

## 🐳 Docker Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: stampcoin-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: stampcoin
      MYSQL_USER: stampcoin
      MYSQL_PASSWORD: stampcoin123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache (Optional)
  redis:
    image: redis:7-alpine
    container_name: stampcoin-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

### شغّل Docker

```bash
# بدء الخدمات
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# إيقاف الخدمات
docker-compose down

# إعادة تشغيل
docker-compose restart

# حذف البيانات
docker-compose down -v
```

---

## 🔐 متغيرات البيئة

### .env.local (مثال)

```bash
# Frontend
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Stampcoin
VITE_APP_ID=stampcoin-dev

# Backend
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=mysql://stampcoin:stampcoin123@localhost:3306/stampcoin

# JWT
JWT_SECRET=your-secret-key-here-change-in-production

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=stampcoin-uploads

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

---

## 📦 Package Scripts

### Scripts المتاحة

```bash
# Development
pnpm dev              # شغّل dev server + backend

# Building
pnpm build            # بناء للإنتاج
pnpm build:client     # بناء frontend فقط
pnpm build:server     # بناء backend فقط

# Database
pnpm db:push          # تطبيق migrations
pnpm db:seed          # ملء البيانات الأولية
pnpm db:migrate       # إنشاء migration جديد

# Testing
pnpm test             # تشغيل الاختبارات
pnpm test:watch       # اختبارات مراقبة
pnpm test:coverage    # تقرير التغطية

# Linting
pnpm lint             # فحص الأكواد
pnpm lint:fix         # إصلاح تلقائي
pnpm type-check       # فحص أنواع TypeScript

# Preview
pnpm preview          # معاينة البناء المحلي

# Smart Contracts
pnpm hardhat compile  # جمع العقود
pnpm hardhat test     # اختبار العقود
pnpm hardhat deploy   # نشر العقود
```

---

## 🚀 تشغيل التطبيق

### الطريقة 1: تشغيل موحد

```bash
# شغّل كل شيء بأمر واحد
pnpm dev

# يفتح:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - MySQL: localhost:3306
```

### الطريقة 2: تشغيل منفصل (في terminals متعددة)

```bash
# Terminal 1: Backend
cd server
pnpm dev

# Terminal 2: Frontend
cd client
pnpm dev

# Terminal 3: Database
docker-compose up mysql
```

### الطريقة 3: Docker فقط

```bash
# بناء صورة Docker
docker build -t stampcoin-platform .

# تشغيل Container
docker run -p 3000:3000 -p 5173:5173 stampcoin-platform

# مع docker-compose
docker-compose -f docker-compose.yml up
```

---

## 🗄️ إعداد قاعدة البيانات

### الخطوة 1: تشغيل MySQL

```bash
docker-compose up -d mysql
```

### الخطوة 2: تطبيق المخطط

```bash
pnpm db:push
```

### الخطوة 3: ملء البيانات الأولية

```bash
pnpm db:seed
```

### الخطوة 4: التحقق

```bash
# الاتصال بـ MySQL
docker exec -it stampcoin-mysql mysql -u stampcoin -p stampcoin

# في MySQL:
USE stampcoin;
SHOW TABLES;
SELECT COUNT(*) FROM stampArchive;
```

---

## 🔍 تصحيح الأخطاء

### Browser DevTools

```bash
# Chrome DevTools
F12 أو Ctrl+Shift+I

# Network Tab
- عرض requests
- فحص responses
- تتبع الأخطاء

# Console Tab
- عرض الأخطاء
- تشغيل JavaScript
```

### Server Logs

```bash
# عرض logs
pnpm dev

# مع تفاصيل أكثر
DEBUG=* pnpm dev

# logs قاعدة البيانات
docker-compose logs mysql
```

### Database Inspection

```bash
# الاتصال المباشر
docker exec -it stampcoin-mysql mysql -u stampcoin -p stampcoin

# أو استخدم GUI
# DBeaver: https://dbeaver.io
# MySQL Workbench: https://dev.mysql.com/downloads/workbench/
```

---

## 🧪 الاختبارات

### تشغيل الاختبارات

```bash
# كل الاختبارات
pnpm test

# اختبارات محددة
pnpm test auth.test.ts

# مع المراقبة
pnpm test:watch

# مع التغطية
pnpm test:coverage
```

### كتابة اختبارات جديدة

```typescript
// server/auth.test.ts
import { describe, it, expect } from 'vitest';
import { validateToken } from './auth';

describe('Auth', () => {
  it('should validate token', () => {
    const token = 'valid-token';
    expect(validateToken(token)).toBe(true);
  });
});
```

---

## 🔗 API Testing

### باستخدام cURL

```bash
# GET request
curl http://localhost:3000/api/health

# POST request
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'

# مع Authentication
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/user
```

### باستخدام Postman

```bash
# تحميل
https://www.postman.com/downloads/

# استيراد Collection
- اختر "Import"
- استورد ملف postman_collection.json
```

### باستخدام REST Client (VS Code)

```http
### Health Check
GET http://localhost:3000/api/health

### Get Stamps
GET http://localhost:3000/api/stamps

### Create Stamp
POST http://localhost:3000/api/stamps
Content-Type: application/json

{
  "title": "Test Stamp",
  "year": 2024
}
```

---

## 🎨 Frontend Development

### Structure

```
client/
├── src/
│   ├── components/      # React Components
│   ├── hooks/           # Custom Hooks
│   ├── pages/           # Page Components
│   ├── lib/             # Utilities
│   ├── styles/          # CSS/SCSS
│   └── main.tsx         # Entry Point
├── public/              # Static Assets
├── vite.config.ts       # Vite Config
└── package.json
```

### Hot Reload

```bash
# تشغيل Dev Server
pnpm dev

# الملفات تُحدَّث تلقائياً عند الحفظ
# لا تحتاج إلى إعادة تشغيل يدوية
```

### Styling

```bash
# Tailwind CSS
# ملف تكوين: tailwind.config.js

# أو CSS Modules
# الملفات: component.module.css
```

---

## 🔧 Backend Development

### Structure

```
server/
├── api.ts               # tRPC Router
├── db.ts                # Database Setup
├── auth.ts              # Authentication
├── routes/              # API Routes
└── middleware/          # Middleware
```

### API Development (tRPC)

```typescript
// server/api.ts
import { router, publicProcedure } from './trpc';

export const appRouter = router({
  hello: publicProcedure
    .input(z.string())
    .query(({ input }) => {
      return `Hello ${input}`;
    }),
});
```

### Middleware

```typescript
// مثال: Authentication Middleware
export const protectedProcedure = publicProcedure
  .use(async (opts) => {
    const token = opts.ctx.headers.authorization;
    if (!token) throw new Error('Unauthorized');
    return opts.next();
  });
```

---

## 📱 Mobile Testing

### Responsive Design

```bash
# Chrome DevTools
- Ctrl+Shift+M
- اختر Device
- اختبر على مختلف الأحجام
```

### Local Network Access

```bash
# احصل على IP محلي
ipconfig getifaddr en0   # macOS
ip addr show            # Linux

# افتح في الهاتف
http://192.168.x.x:5173
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: Port already in use

```bash
# البحث عن العملية
lsof -i :3000
lsof -i :5173

# قتل العملية
kill -9 PID

# أو استخدم port مختلف
PORT=3001 pnpm dev
```

### مشكلة: Database connection failed

```bash
# تحقق من Docker
docker-compose ps

# أعد تشغيل MySQL
docker-compose restart mysql

# تحقق من credentials في .env.local
```

### مشكلة: Dependencies issues

```bash
# امسح cache
rm -rf node_modules pnpm-lock.yaml

# أعد التثبيت
pnpm install

# تحديث
pnpm update
```

### مشكلة: Build errors

```bash
# تحقق من الأخطاء
pnpm type-check
pnpm lint

# أصلح الأخطاء
pnpm lint:fix

# أعد البناء
pnpm build
```

---

## 🚀 الإنتاجية

### VS Code Extensions

```
مقترحة للتطوير:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Database Client
- REST Client
- GitLens
- Thunder Client
```

### Terminal Tips

```bash
# alias سريع
alias pnpm-dev="pnpm dev"
alias pnpm-test="pnpm test"
alias pnpm-build="pnpm build"

# في ~/.bashrc أو ~/.zshrc
```

### Git Workflow

```bash
# إنشاء branch
git checkout -b feature/my-feature

# Commits
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature

# Pull Request
# افتح على GitHub
```

---

## 📚 الموارد

### الوثائق
- [Vite](https://vitejs.dev)
- [React](https://react.dev)
- [tRPC](https://trpc.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind](https://tailwindcss.com)

### أدوات
- [VS Code](https://code.visualstudio.com)
- [Postman](https://www.postman.com)
- [DBeaver](https://dbeaver.io)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## ✅ Checklist للبدء

- [ ] Node.js 18+ مثبت
- [ ] pnpm مثبت
- [ ] Docker مثبت
- [ ] المستودع مستنسخ
- [ ] `pnpm install` تم تنفيذه
- [ ] `.env.local` تم إنشاؤه
- [ ] `docker-compose up -d` تم تنفيذه
- [ ] `pnpm db:push` تم تنفيذه
- [ ] `pnpm dev` يعمل بنجاح
- [ ] http://localhost:5173 يفتح في المتصفح

---

## 🎉 جاهز!

أنت الآن جاهز للتطوير المحلي!

```bash
# البدء
pnpm dev

# والاستمتاع بـ:
# ✅ Hot Reload
# ✅ Fast Development
# ✅ Full Type Safety
# ✅ Database Persistence
```

---

**تم التحديث**: 7 يناير 2026  
**الحالة**: ✅ جاهز للتطوير المحلي
