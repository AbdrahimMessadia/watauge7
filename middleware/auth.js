'use strict';
const db = require('../models/database');

function checkSession(req, res, next) {
  if (!req.session?.userId)
    return res.status(401).json({ error: 'غير مسجل الدخول', code: 'NOT_AUTH' });

  const user = db.prepare(
    'SELECT id,name,email,trial_end,sub_end,sub_type,is_active FROM users WHERE id=?'
  ).get(req.session.userId);

  if (!user)
    return res.status(401).json({ error: 'حساب غير موجود', code: 'NO_USER' });

  if (!user.is_active)
    return res.status(403).json({ error: 'الحساب موقوف من الإدارة', code: 'BANNED' });

  const now      = new Date();
  const trialEnd = new Date(user.trial_end);
  const subEnd   = user.sub_end ? new Date(user.sub_end) : null;

  if (now > trialEnd && (!subEnd || now > subEnd))
    return res.status(403).json({ error: 'انتهت فترة الاشتراك', code: 'EXPIRED' });

  req.user = user;
  next();
}

module.exports = { checkSession };
