# 🏆 Fly.io Best Practices & Advanced Setup
# أفضل الممارسات والإعدادات المتقدمة

## 📋 قبل النشر

### 1. تحضير البيئة

```bash
# تحديث المتغيرات في fly.toml
[env]
  NODE_ENV = "production"
  VITE_OAUTH_PORTAL_URL = "https://yourdomain.fly.dev"
  VITE_APP_ID = "stampcoin-platform"
```

### 2. اختبار locally

```bash
# بناء صورة Docker
docker build -t stampcoin-platform .

# اختبار التشغيل
docker run -p 3000:3000 stampcoin-platform
```

### 3. التحقق من الملفات

```bash
# تأكد من وجود:
ls -la fly.toml          # ✅
ls -la Dockerfile        # ✅
ls -la .dockerignore    # ✅
```

---

## 🚀 استراتيجيات النشر المختلفة

### النشر الأساسي (Basic)

```bash
# تطبيق بسيط
flyctl deploy

# وقت النشر: 5-10 دقائق
# التكلفة: $5-15/month
```

### النشر للإنتاج (Production)

```bash
# في fly.toml
[[vm]]
  memory = "2gb"
  cpu_kind = "performance"
  cpus = 2

# إعادة النشر
flyctl deploy

# وقت النشر: 15-20 دقيقة
# التكلفة: $30-100/month
```

### النشر مع High Availability

```bash
# تقليل التوقفات
flyctl autoscale set min=2 max=10

# في fly.toml
[http_service]
  min_machines_running = 2
  auto_stop_machines = "off"

# التكلفة: $50-200/month
```

---

## 🔐 الأمان

### 1. إدارة الأسرار

**✅ الطريقة الصحيحة:**
```bash
# استخدم flyctl secrets
flyctl secrets set SECRET_KEY=value
```

**❌ لا تفعل:**
```bash
# لا تضع secrets في fly.toml
[env]
  SECRET_KEY = "value"  # ❌ خطر!
```

### 2. متغيرات البيئة

```bash
# List الأسرار
flyctl secrets list

# تحديث سر
flyctl secrets set API_KEY=newvalue

# حذف سر
flyctl secrets unset API_KEY
```

### 3. قفل SSH

```bash
# السماح فقط لـ IPs معينة
flyctl machines list
# ثم أضف firewall rules
```

### 4. تفعيل HTTPS

```toml
[http_service]
  force_https = true  # ✅ مفعل دائماً
```

---

## 📊 المراقبة والأداء

### 1. Logs والتتبع

```bash
# logs في الوقت الفعلي
flyctl logs --follow

# logs لآخر 100 سطر
flyctl logs --lines 100

# logs من تطبيق معين
flyctl logs -a stampcoin-db
```

### 2. Metrics

```bash
# عرض metrics
flyctl metrics

# تفاصيل الـ CPU
flyctl metrics --metric cpu

# تفاصيل الذاكرة
flyctl metrics --metric mem
```

### 3. Health Checks

تحقق من `/api/health`:
```bash
curl https://stampcoin-platform.fly.dev/api/health

# يجب أن ترد:
# {"status": "ok"}
```

### 4. Monitoring خارجي

استخدم خدمات مثل:
- **Sentry**: لـ error tracking
- **LogRocket**: لـ session replay
- **Uptime Robot**: لـ health monitoring

---

## 🗄️ إدارة قاعدة البيانات

### 1. الاتصال من الكمبيوتر المحلي

```bash
# المتغير الخاص بـ Database
flyctl secrets list | grep DATABASE_URL

# الاتصال المباشر
flyctl postgres connect -a stampcoin-db
```

### 2. Backups

```bash
# إنشاء backup يدوي
flyctl postgres backup create stampcoin-db

# عرض backups
flyctl postgres backups list stampcoin-db

# استرجاع من backup
flyctl postgres restore stampcoin-db --backup-id ID
```

### 3. Scaling قاعدة البيانات

```bash
# زيادة الذاكرة
flyctl postgres scale-count stampcoin-db --count 2

# تغيير نوع الـ VM
flyctl postgres update stampcoin-db --vm-size dedicated-cpu-1x
```

### 4. Migrations

```bash
# من داخل SSH
flyctl ssh console

# ثم في console:
npm run db:push
npm run db:seed
exit
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - run: flyctl deploy
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### GitLab CI

```yaml
deploy:
  image: node:18
  script:
    - npm install -g @flyio/cli
    - flyctl deploy
  only:
    - main
```

---

## 🌍 Custom Domain Setup

### 1. إضافة Domain

```bash
# مثال: yourdomain.com
flyctl certs create yourdomain.com

# تحقق من status
flyctl certs show yourdomain.com
```

### 2. تكوين DNS

إذا كان DNS provider:
- **Namecheap**: أضف CNAME إلى stampcoin-platform.fly.dev
- **GoDaddy**: أضف CNAME إلى stampcoin-platform.fly.dev
- **CloudFlare**: أضف CNAME مع Proxy مفعل

### 3. التحقق

```bash
# تحقق من SSL
curl -I https://yourdomain.com

# يجب أن ترى HTTP/2 200
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: Build fails

```bash
# عرض logs البناء
flyctl logs --build

# إعادة النشر
flyctl deploy --remote-only

# في الحالات القاسية:
flyctl restart
```

### المشكلة: Database connection

```bash
# تحقق من DATABASE_URL
flyctl secrets list | grep DATABASE

# اتصل مباشرة
flyctl postgres connect -a stampcoin-db

# أعد إرسال البيانات
flyctl postgres attach stampcoin-db --app stampcoin-platform
```

### المشكلة: Out of Memory

```bash
# عرض استخدام الذاكرة
flyctl metrics --metric mem

# زيادة الذاكرة
flyctl scale memory 2048

# إعادة تشغيل
flyctl restart
```

### المشكلة: Slow app

```bash
# تحليل الأداء
flyctl metrics

# زيادة CPU
flyctl scale count 2

# تحسين code:
# - استخدم caching
# - قلل queries
# - استخدم CDN
```

---

## 💰 تحسين التكلفة

### 1. تقليل الموارد

```bash
# استخدم shared CPU
[[vm]]
  cpu_kind = "shared"

# قلل الذاكرة
memory = "512mb"

# قلل عدد الـ instances
min_machines_running = 1
```

### 2. استخدم Caching

```
- Cache static assets
- استخدم Redis/Memcached
- قلل database queries
```

### 3. استخدم CDN

```bash
# استخدم Cloudflare مجاني
# أو BunnyCDN للسرعة الأفضل
```

### 4. Cleanup غير المستخدم

```bash
# احذف machines غير المستخدمة
flyctl machines list
flyctl machines delete <id>

# احذف apps قديمة
flyctl apps destroy stampcoin-old
```

---

## 🚨 قائمة تفقد الأمان

- [ ] تفعيل HTTPS (force_https = true)
- [ ] استخدام flyctl secrets (ليس fly.toml)
- [ ] تفعيل backups تلقائية
- [ ] monitoring منتظم للـ logs
- [ ] health checks مفعلة
- [ ] آخر تحديثات الأمان مثبتة
- [ ] database password آمن
- [ ] JWT secret قوي
- [ ] firewall rules مناسبة
- [ ] IP whitelisting (إن أمكن)

---

## 📈 قائمة الأداء

- [ ] استخدام caching
- [ ] تحسين database queries
- [ ] compression مفعل
- [ ] CDN مفعل
- [ ] images محسنة
- [ ] code splitting
- [ ] lazy loading
- [ ] minification
- [ ] gzip enabled
- [ ] بطيء requests متحسن

---

## 🎓 الموارد التعليمية

### الوثائق
- https://fly.io/docs/
- https://fly.io/docs/reference/configuration/
- https://fly.io/docs/postgres/

### Tutorials
- https://fly.io/docs/getting-started/
- https://fly.io/docs/languages-and-frameworks/

### Community
- https://community.fly.io
- https://discord.gg/flyio

---

## 🎉 خلاصة

### الخطوات الأساسية:
1. ✅ تثبيت Fly.io CLI
2. ✅ تسجيل الدخول
3. ✅ تشغيل السكريبت
4. ✅ اختبار التطبيق
5. ✅ monitoring

### الخطوات المتقدمة:
1. 🔧 إضافة custom domain
2. 🔒 تحسين الأمان
3. 📊 تفعيل monitoring
4. 🚀 CI/CD automation
5. 💰 تحسين التكلفة

---

**تم تحديثه**: 7 يناير 2026  
**الحالة**: ✅ جاهز للإنتاج
