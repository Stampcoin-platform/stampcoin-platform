# 🚀 دليل النشر على Fly.io
# Fly.io Deployment Guide

## المميزات | Features
- ✅ DNS تلقائي (yourdomain.fly.dev)
- ✅ SSL/TLS مجاني
- ✅ PostgreSQL مدمج
- ✅ Automatic scaling
- ✅ Global edge network
- ✅ $5 credit مجاني شهرياً

## التكلفة | Pricing
- **Free Tier**: $5/month credit
- **Starter**: $5-15/month (Web + Database)
- **Production**: $30-100+/month (HA setup)

---

## 📋 المتطلبات | Prerequisites

```bash
# 1. Fly.io CLI
curl -L https://fly.io/install.sh | sh

# 2. Docker (يجب أن يكون مثبتاً)
docker --version

# 3. Git
git --version
```

---

## 🎬 الخطوات السريعة | Quick Start

### الطريقة 1: السكريبت التلقائي (الأسهل)

```bash
chmod +x deploy-flyio.sh
./deploy-flyio.sh
```

السكريبت سيقوم بـ:
1. ✅ تسجيل الدخول لـ Fly.io
2. ✅ إنشاء التطبيق
3. ✅ إضافة PostgreSQL
4. ✅ إعداد البيئة
5. ✅ النشر

**الوقت**: 10-15 دقيقة

### الطريقة 2: اليدوي (التحكم الكامل)

#### خطوة 1: تسجيل الدخول
```bash
flyctl auth login
```

#### خطوة 2: إنشاء التطبيق
```bash
cd /workspaces/Stampcoin-platform
flyctl launch
# يسأل عن:
# - اسم التطبيق: stampcoin-platform
# - المنطقة: fra (أوروبا) أو us-west (أمريكا)
```

#### خطوة 3: إضافة قاعدة بيانات
```bash
# إنشاء PostgreSQL
flyctl postgres create \
  --name stampcoin-db \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --region fra

# ربط مع التطبيق
flyctl postgres attach stampcoin-db --app stampcoin-platform
```

#### خطوة 4: إعداد المتغيرات
```bash
# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)
flyctl secrets set JWT_SECRET=$JWT_SECRET

# Node Environment
flyctl secrets set NODE_ENV=production

# Stripe (اختياري)
flyctl secrets set STRIPE_SECRET_KEY=sk_live_...
flyctl secrets set STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS S3 (اختياري)
flyctl secrets set AWS_ACCESS_KEY_ID=AKIA...
flyctl secrets set AWS_SECRET_ACCESS_KEY=...
flyctl secrets set AWS_REGION=us-east-1
flyctl secrets set AWS_S3_BUCKET=stampcoin-uploads
```

#### خطوة 5: النشر
```bash
flyctl deploy
```

#### خطوة 6: تشغيل Migrations
```bash
# دخول console
flyctl ssh console

# في SSH console:
npm run db:push
npx tsx ./server/seed-stamp-data.ts
exit
```

#### خطوة 7: التحقق
```bash
# عرض التطبيق
flyctl open

# عرض الـ logs
flyctl logs
```

---

## 🔧 الإعدادات المتقدمة

### تحسين الأداء

في `fly.toml`:

```toml
[[vm]]
  memory = "2gb"           # زيادة الذاكرة
  cpu_kind = "performance" # CPU أسرع
  cpus = 2

[http_service]
  min_machines_running = 2  # HA setup
  auto_stop_machines = "off"
```

### إعادة التوجيه من domain مخصص

```bash
# إضافة domain
flyctl certs create yourdomain.com

# تكوين DNS (في provider)
# CNAME your-app.fly.dev

# التحقق
flyctl certs show yourdomain.com
```

### التوسع التلقائي

```bash
# تكوين scaling
flyctl autoscale set min=2 max=10
```

---

## 📊 أوامر مفيدة

```bash
# عرض حالة التطبيق
flyctl status

# عرض الـ logs
flyctl logs

# دخول SSH console
flyctl ssh console

# إعادة تشغيل
flyctl restart

# إعادة النشر
flyctl deploy

# عرض المتغيرات
flyctl secrets list

# تعديل متغير
flyctl secrets set MY_VAR=value

# حذف متغير
flyctl secrets unset MY_VAR

# Scaling
flyctl scale count 2  # عدد الـ instances
flyctl scale memory 512  # الذاكرة MB

# عرض الأداء
flyctl metrics
```

---

## 🗄️ إدارة قاعدة البيانات

### الاتصال بـ PostgreSQL

```bash
# من الكمبيوتر المحلي
flyctl postgres connect -a stampcoin-db

# أو SSH
flyctl ssh console -a stampcoin-platform
psql $DATABASE_URL
```

### Backup

```bash
# إنشاء backup
flyctl postgres backup create stampcoin-db

# قائمة الـ backups
flyctl postgres backups list stampcoin-db

# استرجاع من backup
flyctl postgres restore stampcoin-db --backup-id <id>
```

### الصيانة

```bash
# فحص الصحة
flyctl postgres status stampcoin-db

# إعادة تشغيل
flyctl restart -a stampcoin-db
```

---

## 🐛 حل المشاكل

### مشكلة: Database connection failed
```bash
# تحقق من DATABASE_URL
flyctl secrets list

# تحقق من حالة DB
flyctl postgres status stampcoin-db

# إعادة الاتصال
flyctl postgres detach stampcoin-db --app stampcoin-platform
flyctl postgres attach stampcoin-db --app stampcoin-platform
```

### مشكلة: Build failed
```bash
# عرض الـ logs بالتفصيل
flyctl logs --build

# إعادة النشر مع --remote-only
flyctl deploy --remote-only
```

### مشكلة: Out of memory
```bash
# زيادة الذاكرة
flyctl scale memory 2048

# تحقق من الاستخدام
flyctl ssh console
free -h
top
```

### مشكلة: App crashes
```bash
# عرض الـ logs
flyctl logs

# إعادة تشغيل
flyctl restart

# تفاصيل الـ machines
flyctl machines list
flyctl machines status <id>
```

---

## 📈 المراقبة

### Fly.io Dashboard
```
https://fly.io/dashboard
```

### Logs & Metrics
```bash
# Logs in real-time
flyctl logs --follow

# Metrics
flyctl metrics
```

### Uptime Monitoring
استخدم خدمة مثل:
- Uptime Robot
- Better Stack
- Pingdom

Monitor URL: `https://yourdomain.fly.dev/api/health`

---

## 🔒 الأمان

### تمكين HTTPS
```toml
[http_service]
  force_https = true
```

### تحديد IP مسموحة
```bash
# إضافة firewall rule
flyctl ips allocate-v4
flyctl ips allocate-v6
```

### Secret Management
```bash
# لا تكتب secrets في fly.toml
# استخدم flyctl secrets set بدلاً من ذلك

# قائمة الـ secrets (بدون القيم)
flyctl secrets list
```

---

## 💡 نصائح مهمة

### 1. استخدم PostgreSQL بدلاً من MySQL
لأن Fly.io يوفر PostgreSQL مدمجاً

### 2. ارفع schema.ts لـ PostgreSQL
ملف `deploy-render.sh` يحتوي على تعليمات التحويل

### 3. استخدم Health Checks
```toml
[[http_service.http_checks]]
  interval = "15s"
  timeout = "2s"
  grace_period = "5s"
  method = "get"
  path = "/api/health"
```

### 4. فعّل Backups
```bash
flyctl postgres backup create stampcoin-db
# أو enable auto-backups
```

### 5. استخدم Build Secrets
```bash
flyctl secrets set --scope release MY_BUILD_SECRET=value
```

---

## 📊 المقارنة: Fly vs البدائل

| المميزة | Fly.io | Railway | Render |
|---|---|---|---|
| **DNS مجاني** | ✅ | ✅ | ✅ |
| **Database مدمج** | ✅ | ✅ | ✅ |
| **Credit مجاني** | $5/م | $5/م | ✅ Free |
| **Global Network** | ✅ | ❌ | ✅ |
| **Serverless** | ❌ | ❌ | ✅ |
| **سهولة الإعداد** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ✅ Checklist قبل النشر

- [ ] Fly.io CLI مثبتة
- [ ] GitHub repo مدفوع
- [ ] fly.toml موجود
- [ ] Dockerfile موجود
- [ ] Database محدد (PostgreSQL)
- [ ] Environment variables جاهزة
- [ ] Domain option (optional)

---

## 🎯 الخطوات التالية

### بعد النشر:
1. [ ] اختبر `/api/health`
2. [ ] اختبر الصفحات الرئيسية
3. [ ] فعّل monitoring
4. [ ] أضف domain مخصص
5. [ ] قم بـ scaling حسب الحاجة

### للإنتاج:
1. [ ] ضعّف auto-stop
2. [ ] أضف HA (2+ instances)
3. [ ] فعّل backups
4. [ ] أضف monitoring service
5. [ ] وثّق العملية

---

## 📞 الدعم

### الوثائق
- https://fly.io/docs/
- https://fly.io/docs/postgres/

### Community
- Discord: https://discord.gg/flyio
- GitHub: https://github.com/superfly

### الدعم المباشر
- https://fly.io/dashboard → Help

---

## 🎉 تم!

أنت الآن جاهز للنشر على Fly.io!

```bash
# الخطوة الأولى
chmod +x deploy-flyio.sh
./deploy-flyio.sh

# أو اتبع الخطوات اليدوية أعلاه
```

**التطبيق سيكون live في 10-15 دقيقة!** 🚀

---

**تم إنشاؤه**: 7 يناير 2026  
**الحالة**: ✅ جاهز للنشر  
**آخر تحديث**: 7 يناير 2026
