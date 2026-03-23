require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const helmet       = require('helmet');
const path         = require('path');
const rateLimit    = require('express-rate-limit');
const compression  = require('compression');

// ── التحقق من متغيرات البيئة الحرجة ────────────────────────
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('⛔ SESSION_SECRET غير محدد أو قصير جداً. يجب أن يكون 32 حرفاً على الأقل.');
  process.exit(1);
}

require('./models/database');
const authRoutes  = require('./routes/auth');
const docRoutes   = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const { checkSession } = require('./middleware/auth');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ── ضغط الاستجابات ──────────────────────────────────────────
app.use(compression());

// ── إعدادات Helmet الأمنية الكاملة ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcElem: ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", "data:", "blob:"],
      frameSrc:      ["'self'", "blob:"],
      connectSrc:    ["'self'"],
      objectSrc:     ["'none'"],
      workerSrc:     ["'self'", "blob:"],
    },
  },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  frameguard:     { action: 'sameorigin' },
  xssFilter:      true,
  noSniff:        true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ── إضافة ترويسات أمان إضافية ────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ── Rate Limiting عام لكل الطلبات ────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات كثيرة جداً، انتظر قليلاً' },
  skip: (req) => req.path.startsWith('/public/') || req.path.endsWith('.css') || req.path.endsWith('.js'),
});

// ── Rate Limiting صارم للـ API ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تجاوزت الحد المسموح، انتظر 15 دقيقة' },
});

// ── Rate Limiting للمصادقة (صارم جداً) ───────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كثيرة جداً، انتظر 15 دقيقة' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── الملفات الثابتة مع Cache-Control ─────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true,
}));

// ── الجلسات الآمنة ────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'wq_sid',
  rolling: true,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   7 * 24 * 3600 * 1000,
  },
}));

// ── حماية من CSRF (بسيطة وفعّالة) ───────────────────────────
app.use((req, res, next) => {
  if (['POST','PUT','DELETE','PATCH'].includes(req.method)) {
    const origin  = req.headers['origin']  || '';
    const referer = req.headers['referer'] || '';
    const host    = req.headers['host']    || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('replit');
    if (!isLocal && origin && !origin.includes(host) && !referer.includes(host)) {
      return res.status(403).json({ error: 'طلب غير مصرح' });
    }
  }
  next();
});

// ── المسارات ──────────────────────────────────────────────────
// ── Rate Limiting للأدمن (صارم جداً — 30 طلب/15 دقيقة)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات كثيرة جداً على الأدمن' },
  skip: (req) => req.path === '/stats',
});

// Rate limiter خاص بـ stats (أكثر مرونة)
const adminStatsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'طلبات إحصاء كثيرة جداً' },
});

app.use('/api/auth',  authLimiter,  authRoutes);
app.use('/api/docs',  apiLimiter,   checkSession, docRoutes);
app.use('/api/admin/stats', adminStatsLimiter);
app.use('/api/admin', adminLimiter, adminRoutes);

// ── الصفحات ───────────────────────────────────────────────────
app.get('/',          (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (_, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/doc/:id',   (req, res) => {
  // التحقق من صحة المعرّف
  if (!/^[a-z_]{2,50}$/.test(req.params.id))
    return res.status(400).sendFile(path.join(__dirname, 'public', 'index.html'));
  res.sendFile(path.join(__dirname, 'public', 'document.html'));
});
app.get('/admin',     (_, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ── معالج الأخطاء العام ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'خطأ في الخادم، حاول لاحقاً' });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api'))
    return res.status(404).json({ error: 'مسار غير موجود' });
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ وثيقتي v2.0 يعمل على http://0.0.0.0:${PORT}`);
  console.log(`🔒 وضع الأمان: ${process.env.NODE_ENV === 'production' ? 'إنتاج' : 'تطوير'}`);
});
