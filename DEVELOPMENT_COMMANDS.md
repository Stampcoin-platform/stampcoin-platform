# 🛠️ Development Commands Reference
# مرجع أوامر التطوير

## ⚡ الأوامر الأساسية

### البدء السريع

```bash
# تشغيل بأمر واحد (مع كل شيء)
pnpm dev

# أو شغّل في terminals منفصلة:
pnpm dev:server    # Backend فقط
pnpm dev:client    # Frontend فقط
```

### Docker

```bash
# بدء جميع الخدمات
docker-compose up -d

# عرض الحالة
docker-compose ps

# عرض السجلات
docker-compose logs -f

# إيقاف الخدمات
docker-compose down

# إعادة تشغيل
docker-compose restart

# حذف البيانات (إعادة تشغيل نظيفة)
docker-compose down -v
```

---

## 📦 إدارة المشروع

### Installation & Updates

```bash
# تثبيت المتطلبات
pnpm install

# تحديث المتطلبات
pnpm update

# إضافة حزمة جديدة
pnpm add package-name

# إضافة حزمة dev
pnpm add -D dev-package

# إزالة حزمة
pnpm remove package-name

# تنظيف cache
pnpm store prune
```

### Version Management

```bash
# عرض الإصدارات المثبتة
pnpm list

# عرض إصدارات قديمة
pnpm outdated

# تحديث تفاعلي
pnpm update --interactive
```

---

## 🏗️ البناء والإصدار

### Development Build

```bash
# بناء للتطوير (مع source maps)
pnpm build:dev

# معاينة البناء محلياً
pnpm preview
```

### Production Build

```bash
# بناء optimized للإنتاج
pnpm build

# بناء frontend فقط
pnpm build:client

# بناء backend فقط
pnpm build:server

# بناء العقود الذكية
pnpm hardhat compile
```

### Build Analysis

```bash
# تحليل حجم البناء
pnpm build:analyze

# تحليل الأداء
pnpm build:profile
```

---

## 🗄️ إدارة قاعدة البيانات

### Migrations

```bash
# عرض الـ migrations الحالية
pnpm db:migrate:status

# إنشاء migration جديد
pnpm db:migrate:create --name create_users_table

# تطبيق كل الـ migrations
pnpm db:push

# التراجع عن آخر migration
pnpm db:migrate:revert

# التراجع عن migration محددة
pnpm db:migrate:revert --name migration_name
```

### Data Management

```bash
# ملء البيانات الأولية
pnpm db:seed

# تصفية قاعدة البيانات
pnpm db:reset

# Backup
pnpm db:backup

# Restore
pnpm db:restore
```

### Database Access

```bash
# الاتصال المباشر بـ MySQL
docker exec -it stampcoin-mysql mysql -u stampcoin -pstampcoin123

# الاتصال بـ Redis
docker exec -it stampcoin-redis redis-cli

# فتح Adminer (GUI)
# http://localhost:8080
# Server: mysql
# User: stampcoin
# Password: stampcoin123
```

---

## ✅ الاختبارات

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

# تقرير التغطية
pnpm test:coverage:report
```

### اختبارات محددة

```bash
# اختبارات unit فقط
pnpm test --run unit

# اختبارات integration فقط
pnpm test --run integration

# اختبارات end-to-end فقط
pnpm test:e2e
```

### Performance Tests

```bash
# اختبارات الأداء
pnpm test:performance

# اختبارات الضغط
pnpm test:load
```

---

## 🔍 فحص الكود

### Linting & Formatting

```bash
# فحص الأخطاء
pnpm lint

# إصلاح تلقائي
pnpm lint:fix

# فحص TypeScript
pnpm type-check

# فحص الأنماط
pnpm style:check

# فحص الأمان
pnpm security:audit
```

### Code Formatting

```bash
# تنسيق مع Prettier
pnpm format

# فحص التنسيق
pnpm format:check
```

### Code Quality

```bash
# تحليل الكود
pnpm analyze:code

# التحقق من التعقيد
pnpm analyze:complexity

# تقرير شامل
pnpm analyze:full
```

---

## 🔗 API & Integration

### API Development

```bash
# توليد tRPC types
pnpm api:generate

# توليد API docs
pnpm api:docs

# اختبار API
pnpm api:test
```

### Smart Contracts

```bash
# تجميع العقود
pnpm hardhat compile

# اختبار العقود
pnpm hardhat test

# نشر محلي (localhost)
pnpm hardhat run scripts/deploy.ts --network localhost

# نشر على Sepolia
pnpm hardhat run scripts/deploy.ts --network sepolia

# توثيق الحقول
pnpm hardhat verify CONTRACT_ADDRESS "constructor args"
```

---

## 🐛 التصحيح

### Debugging

```bash
# تشغيل مع debug mode
DEBUG=stampcoin:* pnpm dev

# debug backend فقط
DEBUG=stampcoin:server:* pnpm dev:server

# debug frontend فقط
DEBUG=stampcoin:client:* pnpm dev:client

# debug database queries
DEBUG=stampcoin:db:* pnpm dev
```

### Logging

```bash
# تفعيل جميع الـ logs
LOG_LEVEL=debug pnpm dev

# logs SQL فقط
DEBUG_SQL=true pnpm dev

# logs الطلبات فقط
LOG_REQUESTS=true pnpm dev
```

### Browser DevTools

```bash
# فتح DevTools في Chrome
F12 أو Ctrl+Shift+I

# Console
Ctrl+` (في بعض المتصفحات)

# Network Inspector
F12 > Network

# React DevTools (إذا كانت مثبتة)
Component Inspector يفتح مباشرة
```

---

## 📊 المراقبة والأداء

### Performance Monitoring

```bash
# عرض الأداء
pnpm perf:monitor

# تقرير الأداء
pnpm perf:report

# تحليل البطء
pnpm perf:analyze
```

### System Monitoring

```bash
# عرض استهلاك الموارد
docker stats

# عرض logs مفصلة
docker-compose logs --follow

# عرض logs service معين
docker-compose logs --follow mysql
```

### Bundle Analysis

```bash
# تحليل حجم الـ bundle
pnpm bundle:analyze

# تقرير مفصل
pnpm bundle:report

# مقارنة الأحجام
pnpm bundle:compare
```

---

## 🔐 الأمان

### Security Checks

```bash
# فحص الأمان
pnpm security:audit

# تحديث الأمان
pnpm security:fix

# فحص الحزم الخطرة
pnpm security:check
```

### Secret Management

```bash
# توليد JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# توليد Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# اختبار JWT
pnpm jwt:test --secret "your-secret"
```

---

## 📈 النشر والإصدار

### Pre-Deployment

```bash
# التحقق الشامل
pnpm check

# فحص الجودة
pnpm quality:check

# اختبار كل شيء
pnpm test:all

# بناء نهائي
pnpm build
```

### Version Management

```bash
# عرض الإصدار الحالي
pnpm version

# زيادة patch version
pnpm version:patch

# زيادة minor version
pnpm version:minor

# زيادة major version
pnpm version:major
```

### Git Workflow

```bash
# فحص الملفات المتغيرة
git status

# عرض الفروقات
git diff

# إضافة ملفات
git add .

# commit
git commit -m "feat: add new feature"

# push
git push origin main

# pull request
# افتح على GitHub
```

---

## 🎯 سكريبتات مفيدة

### عدة أوامر معاً

```bash
# تطوير + اختبارات
pnpm dev & pnpm test:watch

# بناء + معاينة
pnpm build && pnpm preview

# فحص شامل + بناء
pnpm lint:fix && pnpm type-check && pnpm test && pnpm build
```

### Alias سريعة

أضف في `~/.bashrc` أو `~/.zshrc`:

```bash
alias pnpm-dev="pnpm dev"
alias pnpm-build="pnpm build"
alias pnpm-test="pnpm test"
alias pnpm-lint="pnpm lint"
alias docker-logs="docker-compose logs -f"
alias docker-stop="docker-compose down"
```

---

## 🆘 استكشاف الأخطاء الشائعة

### خطأ: Port already in use

```bash
# البحث عن العملية
lsof -i :3000

# قتل العملية
kill -9 PID

# أو استخدم port مختلف
PORT=3001 pnpm dev
```

### خطأ: ENOENT (file not found)

```bash
# تأكد من أن المسار صحيح
ls -la file-path

# أعد تثبيت المتطلبات
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### خطأ: Database connection failed

```bash
# تحقق من Docker
docker-compose ps

# أعد تشغيل MySQL
docker-compose restart mysql

# عرض logs
docker-compose logs mysql
```

### خطأ: Module not found

```bash
# تحديث المتطلبات
pnpm install

# حذف cache TypeScript
rm -rf dist .next

# إعادة البناء
pnpm build
```

---

## 📚 المزيد من المساعدة

### الأوامر المتاحة

```bash
# عرض جميع الأوامر
pnpm run

# عرض المساعدة
pnpm help
```

### الموارد

- [pnpm docs](https://pnpm.io/)
- [Node.js docs](https://nodejs.org/)
- [Docker docs](https://docs.docker.com/)
- [MySQL docs](https://dev.mysql.com/doc/)

---

**آخر تحديث**: 7 يناير 2026  
**الحالة**: ✅ جاهز
