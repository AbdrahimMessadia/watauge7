'use strict';
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const db       = require('../models/database');
const { sendOTPEmail, sendResetEmail, sendActivationEmail } = require('../services/email');

const saltHash  = s => crypto.createHash('sha256').update(s + (process.env.SESSION_SECRET || 'fallback')).digest('hex');
const getIP     = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '0.0.0.0';
const normEmail = e => String(e).trim().toLowerCase();
const isEmail   = e => /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/.test(e);
const genOTP    = () => crypto.randomInt(100000, 999999).toString();

function validatePassword(p) {
  if (!p || p.length < 8)  return 'كلمة السر يجب أن تكون 8 أحرف على الأقل';
  if (p.length > 128)       return 'كلمة السر طويلة جداً';
  if (!/[A-Za-z]/.test(p)) return 'يجب أن تحتوي على حرف لاتيني واحد على الأقل';
  if (!/[0-9]/.test(p))    return 'يجب أن تحتوي على رقم واحد على الأقل';
  return null;
}

const otpAttempts   = new Map();
const loginAttempts = new Map();

function checkOtpLimit(key) {
  const now = Date.now();
  const e = otpAttempts.get(key) || { count: 0, firstAt: now };
  if (now - e.firstAt > 3600000) { otpAttempts.set(key, { count: 1, firstAt: now }); return true; }
  if (e.count >= 5) return false;
  otpAttempts.set(key, { count: e.count + 1, firstAt: e.firstAt });
  return true;
}

function checkLoginLimit(ip) {
  const now = Date.now();
  const e = loginAttempts.get(ip) || { count: 0, firstAt: now };
  if (now - e.firstAt > 900000) { loginAttempts.set(ip, { count: 1, firstAt: now }); return true; }
  if (e.count >= 8) return false;
  loginAttempts.set(ip, { count: e.count + 1, firstAt: e.firstAt });
  return true;
}

function resetLoginLimit(ip) { loginAttempts.delete(ip); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpAttempts)   if (now - v.firstAt > 3600000) otpAttempts.delete(k);
  for (const [k, v] of loginAttempts) if (now - v.firstAt > 900000)  loginAttempts.delete(k);
}, 3600000);

// ── تسجيل
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, fp } = req.body;
    if (!email || !password || !name || !confirmPassword)
      return res.json({ success: false, message: 'جميع الحقول مطلوبة' });
    const norm = normEmail(email);
    if (!isEmail(norm)) return res.json({ success: false, message: 'صيغة البريد الإلكتروني غير صحيحة' });
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60)
      return res.json({ success: false, message: 'الاسم يجب أن يكون بين 2 و60 حرفاً' });
    if (password !== confirmPassword)
      return res.json({ success: false, message: 'كلمتا السر غير متطابقتين' });
    const pwErr = validatePassword(password);
    if (pwErr) return res.json({ success: false, message: pwErr });
    if (!checkOtpLimit(norm))
      return res.json({ success: false, message: 'تجاوزت الحد المسموح، حاول بعد ساعة' });
    const ipH = saltHash(getIP(req));
    const fpH = fp ? saltHash(String(fp).substring(0, 200)) : saltHash(getIP(req) + (req.headers['user-agent'] || ''));
    if (db.prepare('SELECT id FROM devices WHERE ip_hash=? OR fp=?').get(ipH, fpH))
      return res.json({ success: false, message: 'لا يمكن إنشاء أكثر من حساب من نفس الجهاز' });
    if (db.prepare('SELECT id FROM users WHERE email=?').get(norm))
      return res.json({ success: false, message: 'هذا البريد الإلكتروني مسجّل مسبقاً' });
    const otp = genOTP();
    const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM otp_codes WHERE email=? AND type=?').run(norm, 'register');
    db.prepare('INSERT INTO otp_codes(email,code,type,expires_at) VALUES(?,?,?,?)').run(norm, otp, 'register', exp);
    req.session.pendingReg = { email: norm, password, name: name.trim(), ipH, fpH };
    const result = await sendOTPEmail(norm, otp, name.trim());
    if (!result.success && !result.dev)
      return res.json({ success: false, message: 'فشل إرسال البريد، تحقق من الإيميل وحاول مرة أخرى' });
    const devPayload = process.env.EMAIL_DEV_MODE === 'true' ? { otp_dev: otp } : {};
    res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني', ...devPayload });
  } catch (e) {
    console.error('[REGISTER]', e.message);
    res.json({ success: false, message: 'خطأ في الخادم، حاول مرة أخرى' });
  }
});

// ── تأكيد OTP التسجيل
router.post('/verify-otp', (req, res) => {
  try {
    const { otp } = req.body;
    const p = req.session.pendingReg;
    if (!p) return res.json({ success: false, message: 'انتهت الجلسة، أعد التسجيل' });
    if (!otp || !/^\d{6}$/.test(String(otp)))
      return res.json({ success: false, message: 'رمز التحقق يجب أن يكون 6 أرقام' });
    const rec = db.prepare('SELECT * FROM otp_codes WHERE email=? AND code=? AND type=? AND used=0').get(p.email, String(otp), 'register');
    if (!rec) return res.json({ success: false, message: 'رمز التحقق غير صحيح' });
    if (new Date() > new Date(rec.expires_at)) return res.json({ success: false, message: 'انتهت صلاحية الرمز' });
    db.prepare('UPDATE otp_codes SET used=1 WHERE id=?').run(rec.id);
    const hash     = bcrypt.hashSync(p.password, 12);
    const trialEnd = new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString();
    const r = db.prepare('INSERT INTO users(email,password,name,ip_hash,device_fp,trial_end,sub_type) VALUES(?,?,?,?,?,?,?)').run(p.email, hash, p.name, p.ipH, p.fpH, trialEnd, 'trial');
    db.prepare('INSERT INTO devices(ip_hash,fp,user_id) VALUES(?,?,?)').run(p.ipH, p.fpH, r.lastInsertRowid);
    const userId = r.lastInsertRowid;
    req.session.regenerate(err => {
      if (err) return res.json({ success: false, message: 'خطأ في الجلسة' });
      req.session.userId = userId;
      res.json({ success: true, message: '✅ تم إنشاء حسابك! فترة تجريبية 15 يوماً' });
    });
  } catch (e) {
    console.error('[VERIFY-OTP]', e.message);
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── تسجيل الدخول
router.post('/login', (req, res) => {
  try {
    const ip = getIP(req);
    if (!checkLoginLimit(ip)) return res.json({ success: false, message: 'محاولات كثيرة، انتظر 15 دقيقة' });
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'البريد وكلمة السر مطلوبان' });
    const norm = normEmail(email);
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(norm);
    const dummyHash = '$2a$12$dummyhashtopreventtimingattacksonnonexistentusers12';
    const hashToCompare = user ? user.password : dummyHash;
    const match = bcrypt.compareSync(String(password).substring(0, 128), hashToCompare);
    if (!user || !match || !user.is_active) {
      return res.json({ success: false, message: user && !user.is_active ? 'الحساب موقوف من الإدارة' : 'البريد الإلكتروني أو كلمة السر خاطئة' });
    }
    resetLoginLimit(ip);
    const now = new Date(), te = new Date(user.trial_end), se = user.sub_end ? new Date(user.sub_end) : null;
    const expired = now > te && (!se || now > se);
    const userId = user.id, userName = user.name;
    req.session.regenerate(err => {
      if (err) return res.json({ success: false, message: 'خطأ في الجلسة' });
      req.session.userId = userId;
      res.json({ success: true, expired, name: userName });
    });
  } catch (e) {
    console.error('[LOGIN]', e.message);
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── نسيت كلمة السر
router.post('/forgot-password', async (req, res) => {
  try {
    const norm = normEmail(req.body.email || '');
    if (!isEmail(norm)) return res.json({ success: false, message: 'بريد إلكتروني غير صحيح' });
    if (!checkOtpLimit('rst_' + norm)) return res.json({ success: false, message: 'تجاوزت الحد المسموح، حاول بعد ساعة' });
    const user = db.prepare('SELECT id,name FROM users WHERE email=?').get(norm);
    if (!user) return res.json({ success: true, message: 'إذا كان البريد مسجلاً، ستصله رسالة' });
    const otp = genOTP();
    const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM otp_codes WHERE email=? AND type=?').run(norm, 'reset');
    db.prepare('INSERT INTO otp_codes(email,code,type,expires_at) VALUES(?,?,?,?)').run(norm, otp, 'reset', exp);
    req.session.pendingReset = { email: norm };
    const result = await sendResetEmail(norm, otp, user.name);
    if (!result.success && !result.dev)
      return res.json({ success: false, message: 'فشل إرسال البريد، حاول مرة أخرى' });
    const devPayload = process.env.EMAIL_DEV_MODE === 'true' ? { otp_dev: otp } : {};
    res.json({ success: true, message: 'تم إرسال رمز إعادة التعيين إلى بريدك', ...devPayload });
  } catch (e) {
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── تأكيد رمز إعادة التعيين
router.post('/verify-reset', (req, res) => {
  try {
    const { otp } = req.body;
    const p = req.session.pendingReset;
    if (!p) return res.json({ success: false, message: 'انتهت الجلسة، أعد الطلب' });
    if (!otp || !/^\d{6}$/.test(String(otp)))
      return res.json({ success: false, message: 'رمز التحقق يجب أن يكون 6 أرقام' });
    const rec = db.prepare('SELECT * FROM otp_codes WHERE email=? AND code=? AND type=? AND used=0').get(p.email, String(otp), 'reset');
    if (!rec) return res.json({ success: false, message: 'رمز التحقق غير صحيح' });
    if (new Date() > new Date(rec.expires_at)) return res.json({ success: false, message: 'انتهت صلاحية الرمز' });
    db.prepare('UPDATE otp_codes SET used=1 WHERE id=?').run(rec.id);
    req.session.pendingReset.verified = true;
    res.json({ success: true, message: 'الرمز صحيح، أدخل كلمة السر الجديدة' });
  } catch (e) {
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── إعادة تعيين كلمة السر
router.post('/reset-password', (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const p = req.session.pendingReset;
    if (!p || !p.verified) return res.json({ success: false, message: 'يجب تأكيد الرمز أولاً' });
    if (!password || password !== confirmPassword)
      return res.json({ success: false, message: 'كلمتا السر غير متطابقتين' });
    const pwErr = validatePassword(password);
    if (pwErr) return res.json({ success: false, message: pwErr });
    const hash = bcrypt.hashSync(password, 12);
    db.prepare('UPDATE users SET password=? WHERE email=?').run(hash, p.email);
    req.session.pendingReset = null;
    res.json({ success: true, message: '✅ تم تغيير كلمة السر بنجاح، يمكنك الدخول الآن' });
  } catch (e) {
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── تفعيل الاشتراك
router.post('/activate', (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'سجّل دخولك أولاً' });
  try {
    const code = (req.body.code || '').toString().trim().toUpperCase();
    if (!code || !/^WQ-[A-Z0-9-]{4,30}$/.test(code))
      return res.json({ success: false, message: 'صيغة الرمز غير صحيحة' });
    const act = db.prepare('SELECT * FROM activation_codes WHERE code=? AND used=0').get(code);
    if (!act) return res.json({ success: false, message: 'الرمز غير صحيح أو مستخدم مسبقاً' });
    const now  = new Date();
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId);
    const base = (user.sub_end && new Date(user.sub_end) > now) ? new Date(user.sub_end) : now;
    const newEnd = new Date(base.getTime() + act.days * 86400000);
    db.prepare('UPDATE users SET sub_end=?,sub_type=? WHERE id=?').run(newEnd.toISOString(), act.type, req.session.userId);
    db.prepare('UPDATE activation_codes SET used=1,used_by=?,used_at=CURRENT_TIMESTAMP WHERE id=?').run(req.session.userId, act.id);

    // إرسال إيميل تأكيد التفعيل (بدون انتظار)
    const actUser = db.prepare('SELECT email, name FROM users WHERE id=?').get(req.session.userId);
    if (actUser) sendActivationEmail(actUser.email, actUser.name, newEnd, act.type).catch(() => {});

    res.json({ success: true, message: `✅ تم التفعيل! صالح حتى ${newEnd.toLocaleDateString('ar-DZ')}`, endDate: newEnd });
  } catch (e) {
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});

// ── معلومات المستخدم
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  const u = db.prepare('SELECT id,email,name,trial_end,sub_end,sub_type FROM users WHERE id=? AND is_active=1').get(req.session.userId);
  if (!u) { req.session.destroy(() => {}); return res.json({ loggedIn: false }); }
  const now = new Date(), te = new Date(u.trial_end), se = u.sub_end ? new Date(u.sub_end) : null;
  const activeEnd = (se && se > te) ? se : te;
  const expired   = now > activeEnd;
  const daysLeft  = expired ? 0 : Math.ceil((activeEnd - now) / 86400000);
  res.json({ loggedIn: true, ...u, expired, daysLeft });
});

// ── تسجيل الخروج
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('wq_sid');
    res.json({ success: true });
  });
});

module.exports = router;

// ── تغيير كلمة السر (من داخل الحساب)
router.post('/change-password', (req, res) => {
  if (!req.session.userId)
    return res.json({ success: false, message: 'سجّل دخولك أولاً' });
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword)
      return res.json({ success: false, message: 'جميع الحقول مطلوبة' });

    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId);
    if (!user) return res.json({ success: false, message: 'المستخدم غير موجود' });

    if (!bcrypt.compareSync(String(currentPassword).substring(0, 128), user.password))
      return res.json({ success: false, message: '❌ كلمة السر الحالية غير صحيحة' });

    if (newPassword !== confirmPassword)
      return res.json({ success: false, message: 'كلمتا السر الجديدتان غير متطابقتين' });

    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.json({ success: false, message: pwErr });

    if (bcrypt.compareSync(String(newPassword).substring(0, 128), user.password))
      return res.json({ success: false, message: 'كلمة السر الجديدة يجب أن تختلف عن القديمة' });

    const hash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.session.userId);

    res.json({ success: true, message: '✅ تم تغيير كلمة السر بنجاح' });
  } catch (e) {
    console.error('[CHANGE-PASS]', e.message);
    res.json({ success: false, message: 'خطأ في الخادم' });
  }
});
