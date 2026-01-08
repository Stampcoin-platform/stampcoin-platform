# 🚀 Quick Start Guide
# دليل البدء السريع

## 5 دقائق فقط!

### 1️⃣ تثبيت المتطلبات

```bash
# Node.js (تحقق من الإصدار)
node -v  # يجب أن يكون >= 18

# pnpm
npm install -g pnpm

# Docker
# تحميل من: https://www.docker.com/products/docker-desktop
docker --version
```

### 2️⃣ استنسخ المشروع

```bash
git clone https://github.com/yourusername/stampcoin-platform.git
cd stampcoin-platform
```

### 3️⃣ شغّل السكريبت التلقائي

```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

**يقوم السكريبت بـ:**
- ✅ تثبيت المتطلبات
- ✅ إعداد البيئة
- ✅ تشغيل Docker
- ✅ إعداد قاعدة البيانات
- ✅ ملء البيانات الأولية

### 4️⃣ افتح في المتصفح

```
http://localhost:5173
```

---

## 🌐 المواقع المتاحة

| الخدمة | URL | الوصف |
|---|---|---|
| **Frontend** | http://localhost:5173 | تطبيق React |
| **Backend** | http://localhost:3000 | خادم Node.js |
| **Health** | http://localhost:3000/api/health | فحص الصحة |
| **Database** | http://localhost:8080 | Adminer GUI |
| **Redis** | http://localhost:8081 | Redis Manager |
| **Email** | http://localhost:8025 | MailHog (البريد) |

---

## 📋 بيانات الدخول

```
Database:
  Host: localhost:3306
  User: stampcoin
  Password: stampcoin123
  Database: stampcoin

Redis:
  Host: localhost:6379
  Password: redis123

Adminer:
  Server: mysql
  User: stampcoin
  Password: stampcoin123
```

---

## 🛠️ الأوامر الأساسية

```bash
# تطوير (مع hot reload)
pnpm dev

# اختبار
pnpm test

# فحص الأكواد
pnpm lint

# بناء للإنتاج
pnpm build

# معاينة البناء
pnpm preview

# إدارة قاعدة البيانات
pnpm db:push      # تطبيق migrations
pnpm db:seed      # ملء البيانات
pnpm db:reset     # إعادة تعيين

# Docker
docker-compose up -d    # بدء الخدمات
docker-compose down     # إيقاف الخدمات
docker-compose logs -f  # عرض السجلات
```

---

## 🐛 حل المشاكل الشائعة

### ❌ خطأ: Command not found

```bash
# تأكد من تثبيت pnpm
npm install -g pnpm

# تحديث المسار
export PATH="$(pnpm store path)/../.bin:$PATH"
```

### ❌ خطأ: Port already in use

```bash
# البحث عن العملية على port 3000
lsof -i :3000

# قتل العملية
kill -9 PID
```

### ❌ خطأ: Docker not running

```bash
# شغّل Docker Desktop أو:
docker --version  # تحقق من التثبيت
```

### ❌ خطأ: Database connection failed

```bash
# تحقق من حالة Docker
docker-compose ps

# أعد تشغيل MySQL
docker-compose restart mysql

# انتظر 10 ثوان وأعد المحاولة
```

---

## 📚 الوثائق الكاملة

لمزيد من التفاصيل، اقرأ:

- [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) - دليل شامل
- [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md) - مرجع الأوامر
- [docker-compose.override.yml](docker-compose.override.yml) - إعدادات Docker

---

## 🎯 الخطوات التالية

بعد التشغيل الناجح:

1. 📖 اقرأ [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. 🔧 استكشف [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md)
3. 💻 ابدأ التطوير!
4. 🧪 اكتب اختبارات
5. 🎨 عدّل الواجهة
6. 📤 اضغط إلى GitHub

---

## ❓ أسئلة شائعة

**س: كم الوقت المطلوب للإعداد؟**
ج: 10-15 دقيقة مع السكريبت

**س: هل أحتاج إلى docker؟**
ج: نعم، لـ MySQL و Redis

**س: هل يمكن استخدام PostgreSQL؟**
ج: نعم، عدّل docker-compose.override.yml

**س: كيف أضيف حزم جديدة؟**
ج: `pnpm add package-name`

**س: كيف أشغّل الاختبارات؟**
ج: `pnpm test` أو `pnpm test:watch`

---

## 💡 نصائح

✅ استخدم VS Code مع Extensions المقترحة
✅ الملفات تُحدَّث تلقائياً (Hot Reload)
✅ استخدم DevTools للتصحيح
✅ اقرأ الأخطاء بحذر (رسائل مفيدة جداً)
✅ تحقق من السجلات عند المشاكل

---

## 🆘 احصل على المساعدة

1. **قراءة الأخطاء**: التفاصيل غالباً في الأخطاء
2. **قراءة السجلات**: `docker-compose logs -f`
3. **Google It**: معظم المشاكل لها حل على Stack Overflow
4. **اطلب المساعدة**: في المشروع أو المجتمع

---

**أنت الآن جاهز للتطوير!** 🎉

```bash
# البدء
pnpm dev

# والاستمتاع بـ:
# ✅ Hot Reload
# ✅ الفوري Testing
# ✅ Type Safety
# ✅ Modern Tools
```
