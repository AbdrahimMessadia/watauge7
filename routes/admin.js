'use strict';
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

function auth(req, res, next) {
  const KEY = process.env.ADMIN_KEY;
  const key = req.headers['x-admin-key'];
  if (!KEY || KEY.length < 6) {
    return res.status(500).json({ error: 'ADMIN_KEY غير محدد في .env' });
  }
  if (!key || key.trim() !== KEY.trim()) {
    return res.status(403).json({ error: 'مفتاح الأدمن خاطئ' });
  }
  next();
}

// توليد رموز تفعيل
router.post('/gen-codes', auth, (req, res) => {
  const { type, count = 1 } = req.body;
  const days = { monthly: 30, '3months': 90, yearly: 365 }[type];
  if (!days) return res.json({ error: 'النوع غير صحيح (monthly | 3months | yearly)' });
  const n = Math.min(Math.max(parseInt(count) || 1, 1), 100);
  const codes = [];
  for (let i = 0; i < n; i++) {
    const c = `WQ-${type.slice(0,3).toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`;
    db.prepare('INSERT INTO activation_codes(code,type,days) VALUES(?,?,?)').run(c, type, days);
    codes.push(c);
  }
  res.json({ success: true, codes });
});

// قائمة الرموز
router.get('/codes', auth, (req, res) => {
  const codes = db.prepare('SELECT * FROM activation_codes ORDER BY created_at DESC').all();
  res.json({ success: true, codes });
});

// حذف رمز
router.delete('/codes/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'معرّف غير صحيح' });
  db.prepare('DELETE FROM activation_codes WHERE id=?').run(id);
  res.json({ success: true });
});

// الإحصاءات
router.get('/stats', auth, (req, res) => {
  res.json({
    success:   true,
    users:     db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    active:    db.prepare("SELECT COUNT(*) as c FROM users WHERE (trial_end>datetime('now') OR sub_end>datetime('now')) AND is_active=1").get().c,
    banned:    db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active=0').get().c,
    docs:      db.prepare('SELECT COUNT(*) as c FROM saved_docs').get().c,
    usedCodes: db.prepare('SELECT COUNT(*) as c FROM activation_codes WHERE used=1').get().c,
    freeCodes: db.prepare('SELECT COUNT(*) as c FROM activation_codes WHERE used=0').get().c,
  });
});

// قائمة المستخدمين
router.get('/users', auth, (req, res) => {
  const users = db.prepare(
    'SELECT id,email,name,sub_type,trial_end,sub_end,is_active,created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, users });
});

// إيقاف / تفعيل مستخدم
router.patch('/users/:id/toggle', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'معرّف غير صحيح' });
  const user = db.prepare('SELECT is_active FROM users WHERE id=?').get(id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const newStatus = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active=? WHERE id=?').run(newStatus, id);
  res.json({ success: true, is_active: newStatus });
});

// حذف مستخدم (مع وثائقه)
router.delete('/users/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'معرّف غير صحيح' });
  db.prepare('DELETE FROM saved_docs WHERE user_id=?').run(id);
  db.prepare('DELETE FROM devices WHERE user_id=?').run(id);
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ success: true });
});

// منح اشتراك يدوياً
router.post('/users/:id/grant', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'معرّف غير صحيح' });
  const { days, type } = req.body;
  if (!days || days < 1) return res.json({ error: 'عدد الأيام غير صحيح' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const now  = new Date();
  const base = (user.sub_end && new Date(user.sub_end) > now) ? new Date(user.sub_end) : now;
  const newEnd = new Date(base.getTime() + days * 86400000);
  db.prepare('UPDATE users SET sub_end=?,sub_type=? WHERE id=?')
    .run(newEnd.toISOString(), type || 'monthly', id);
  res.json({ success: true, endDate: newEnd });
});

module.exports = router;
