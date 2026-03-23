# 🚀 دليل النشر المجاني لموقع وثيقتي

## 1️⃣ Replit (الأسهل — مجاني)

1. ادخل على replit.com وأنشئ حساباً
2. أنشئ Repl جديد → اختر Node.js
3. ارفع كل ملفات المشروع
4. في Secrets (المفاتيح السرية):
   - SESSION_SECRET = [سلسلة عشوائية 64 حرف]
   - ADMIN_KEY = [مفتاحك السري]
   - GMAIL_USER = بريدك
   - GMAIL_APP_PASS = كلمة مرور التطبيق
   - NODE_ENV = production
5. في .replit تأكد: run = "node server.js"
6. اضغط Run → الموقع يعمل على رابط مجاني

⚠️ للإبقاء على الموقع شغّالاً 24/7: استخدم UptimeRobot.com

---

## 2️⃣ Railway (مجاني بحد — الأفضل)

1. railway.app → ادخل بـ GitHub
2. New Project → Deploy from GitHub repo
3. أضف المتغيرات في Variables:
   - SESSION_SECRET, ADMIN_KEY, GMAIL_USER, GMAIL_APP_PASS, NODE_ENV=production
4. Start Command: node server.js
5. الموقع يعمل على: your-app.railway.app

---

## 3️⃣ Render (مجاني)

1. render.com → New Web Service
2. ربط مع GitHub repo
3. Build Command: npm install
4. Start Command: node server.js
5. أضف متغيرات البيئة
6. الموقع: your-app.onrender.com

---

## 4️⃣ نصائح أمان قبل النشر

```bash
# توليد SESSION_SECRET قوي:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- ✅ غيّر SESSION_SECRET إلى قيمة عشوائية
- ✅ غيّر ADMIN_KEY إلى مفتاح قوي
- ✅ تأكد NODE_ENV=production
- ✅ فعّل HTTPS (تلقائي في كل المنصات المذكورة)
- ✅ لا ترفع ملف .env إلى GitHub (أضفه في .gitignore)

---

## 5️⃣ ربط دومين مجاني

- freenom.com → .tk .ml .ga .cf مجانية
- أو استخدم Cloudflare لربط الدومين بالمنصة

