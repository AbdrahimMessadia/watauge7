const express = require('express');
const router  = express.Router();
const db      = require('../models/database');
const gen     = require('../documents/generator');
const tpls    = require('../documents/templates');
const catalog = require('../documents/catalog');

// ── تنظيف المدخلات من XSS ────────────────────────────────────
function sanitize(obj) {
  if (typeof obj !== 'object' || !obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      // إزالة HTML tags الخطرة مع الإبقاء على النص
      out[k] = v.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim()
                .substring(0, 5000); // حد أقصى لكل حقل
    } else {
      out[k] = v;
    }
  }
  return out;
}

// قائمة الوثائق
router.get('/list', (req, res) => res.json({ success: true, catalog }));

// قالب وثيقة
router.get('/tpl/:t', (req, res) => {
  const type = req.params.t;
  if (!/^[a-z_]{2,50}$/.test(type))
    return res.status(400).json({ success: false, message: 'معرّف غير صحيح' });
  const t = tpls[type];
  if (!t) return res.status(404).json({ success: false, message: 'الوثيقة غير موجودة' });
  res.json({ success: true, template: t });
});

// توليد وثيقة
router.post('/gen/:t', (req, res) => {
  try {
    const type = req.params.t;
    if (!/^[a-z_]{2,50}$/.test(type))
      return res.status(400).json({ success: false, message: 'معرّف غير صحيح' });
    if (!tpls[type])
      return res.status(404).json({ success: false, message: 'نوع غير موجود' });

    const data = sanitize(req.body);
    const html = gen(type, data);

    let title = type;
    for (const cat of catalog) {
      const f = cat.docs.find(d => d.id === type);
      if (f) { title = f.title; break; }
    }

    db.prepare(
      'INSERT INTO saved_docs(user_id,doc_type,doc_title,doc_data) VALUES(?,?,?,?)'
    ).run(req.user.id, type, title, JSON.stringify(data));

    res.json({ success: true, html });
  } catch (e) {
    console.error('[GEN]', e.message);
    res.status(500).json({ success: false, message: 'خطأ في توليد الوثيقة' });
  }
});

// وثائقي المحفوظة
router.get('/mine', (req, res) => {
  const docs = db.prepare(
    'SELECT id,doc_type,doc_title,created_at FROM saved_docs WHERE user_id=? ORDER BY created_at DESC LIMIT 200'
  ).all(req.user.id);
  res.json({ success: true, docs });
});

// إعادة توليد وثيقة محفوظة
router.get('/mine/:id/view', (req, res) => {
  const doc = db.prepare(
    'SELECT doc_type,doc_data FROM saved_docs WHERE id=? AND user_id=?'
  ).get(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ success: false, message: 'الوثيقة غير موجودة' });
  try {
    const data = JSON.parse(doc.doc_data || '{}');
    const html = gen(doc.doc_type, data);
    res.json({ success: true, html });
  } catch (e) {
    res.status(500).json({ success: false, message: 'خطأ في إعادة التوليد' });
  }
});

// حذف وثيقة
router.delete('/mine/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ success: false });
  db.prepare('DELETE FROM saved_docs WHERE id=? AND user_id=?').run(id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
