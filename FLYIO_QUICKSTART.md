# 🚀 Fly.io Quick Start Guide
# دليل البدء السريع مع Fly.io

## ⚡ في 5 دقائق

### الخطوة 1: تثبيت Fly.io CLI

```bash
# Linux / WSL
curl -L https://fly.io/install.sh | sh

# macOS
brew install flyctl

# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### الخطوة 2: تسجيل الدخول

```bash
flyctl auth login
# سيفتح متصفح للدخول
```

### الخطوة 3: تشغيل السكريبت

```bash
cd /workspaces/Stampcoin-platform
chmod +x deploy-flyio.sh
./deploy-flyio.sh
```

### الخطوة 4: انتظر النشر

السكريبت سيقوم بـ:
- ✅ إنشاء التطبيق
- ✅ إضافة PostgreSQL
- ✅ إعداد البيانات
- ✅ النشر

**الوقت المتوقع**: 10-15 دقيقة

---

## 🎯 بعد النشر

### اختبر التطبيق

```bash
# URL التطبيق
https://stampcoin-platform.fly.dev

# Health check
curl https://stampcoin-platform.fly.dev/api/health

# الدخول للتطبيق
flyctl open
```

### الأوامر المفيدة

```bash
# عرض الـ logs
flyctl logs

# دخول console
flyctl ssh console

# إعادة تشغيل
flyctl restart

# عرض الحالة
flyctl status

# عرض الأداء
flyctl metrics
```

---

## 💡 نصائح

### إذا حدث خطأ

```bash
# عرض الـ logs بالتفصيل
flyctl logs --follow

# إعادة النشر
flyctl deploy --remote-only

# إعادة تشغيل
flyctl restart
```

### إضافة domain مخصص

```bash
# إضافة domain
flyctl certs create yourdomain.com

# تكوين DNS:
# CNAME: your-app.fly.dev
```

### Scaling

```bash
# زيادة عدد الـ instances
flyctl scale count 2

# زيادة الذاكرة
flyctl scale memory 2048
```

---

## 📊 المواصفات

| المميزة | القيمة |
|---|---|
| **الأداة** | Fly.io |
| **التطبيق** | stampcoin-platform |
| **قاعدة البيانات** | PostgreSQL |
| **المنطقة** | fra (فرانكفورت) |
| **الذاكرة** | 1 GB |
| **CPU** | Shared |
| **URL** | stampcoin-platform.fly.dev |
| **HTTPS** | ✅ مفعل |

---

## 📚 المزيد من المعلومات

- **الدليل الكامل**: [FLYIO_DEPLOYMENT_GUIDE.md](FLYIO_DEPLOYMENT_GUIDE.md)
- **Fly.io Docs**: https://fly.io/docs/
- **Dashboard**: https://fly.io/dashboard/

---

## ❓ أسئلة شائعة

### س: كم التكلفة؟
ج: $5/month free credit + استهلاك إضافي

### س: هل يمكن تغيير المنطقة؟
ج: نعم، عدل `REGION` في السكريبت

### س: كيف أضيف custom domain؟
ج: اتبع القسم "إضافة domain مخصص" أعلاه

### س: كيف أقوم بـ backup؟
ج: تلقائياً كل يوم، أو يدويًا عند الحاجة

---

**تم البدء!** 🎉
