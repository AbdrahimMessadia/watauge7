'use strict';
// services/email.js — إرسال البريد عبر Resend API
const https = require('https');

async function sendViaResend(to, subject, html) {
  if (process.env.EMAIL_DEV_MODE === 'true') {
    console.log(`[EMAIL-DEV] إلى ${to} | ${subject}`);
    return { success: true, dev: true };
  }

  const body = JSON.stringify({
    from: 'وثيقتي <onboarding@resend.dev>',
    to,
    subject,
    html
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`[RESEND] ✅ إيميل أُرسل إلى ${to}`);
          resolve({ success: true });
        } else {
          console.error('[RESEND ERROR]', res.statusCode, data);
          resolve({ success: false, error: data });
        }
      });
    });
    req.on('error', (e) => {
      console.error('[RESEND]', e.message);
      resolve({ success: false, error: e.message });
    });
    req.write(body);
    req.end();
  });
}

function baseTemplate(content) {
  return `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#04080F;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04080F;padding:40px 16px">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%">
  <tr><td align="center" style="padding-bottom:28px">
    <p style="margin:0;font-size:26px;font-weight:900;color:#E8C97A">📄 وثيقتي</p>
  </td></tr>
  <tr><td style="background:#0A1628;border:1px solid rgba(201,168,76,0.22);border-radius:20px;padding:36px 32px">
    ${content}
  </td></tr>
  <tr><td align="center" style="padding-top:24px">
    <p style="margin:0;font-size:11px;color:#3A4A60">© 2025 وثيقتي — منصة الوثائق الرسمية الجزائرية 🇩🇿</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function otpBlock(code, color='#E8C97A', border='rgba(201,168,76,0.4)') {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:26px 0">
    <div style="background:rgba(201,168,76,0.07);border:2px solid ${border};border-radius:16px;padding:24px 36px;display:inline-block">
      <p style="margin:0 0 6px;font-size:11px;color:#8A9AB8;letter-spacing:2px">رمز التحقق</p>
      <p style="margin:0;font-size:48px;font-weight:900;color:${color};letter-spacing:10px;font-family:'Courier New',monospace;direction:ltr">${code}</p>
    </div>
  </td></tr></table>`;
}

function warningBlock(msg) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr>
    <td style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:14px 16px">
      <p style="margin:0;font-size:13px;color:#8A9AB8;line-height:1.8">${msg}</p>
    </td></tr></table>`;
}

async function sendOTPEmail(email, code, name) {
  return sendViaResend(
    email,
    `${code} — رمز التحقق في وثيقتي`,
    baseTemplate(`
      <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#E8E4D8">مرحباً ${name} 👋</p>
      <p style="margin:0 0 28px;font-size:14px;color:#8A9AB8;line-height:1.8">لإكمال إنشاء حسابك في وثيقتي، استخدم رمز التحقق أدناه:</p>
      ${otpBlock(code)}
      ${warningBlock('⏱️ <b style="color:#E8C97A">الرمز صالح 10 دقائق فقط</b><br/>🔒 لا تشارك هذا الرمز مع أي شخص')}
      <p style="margin:0;font-size:12px;color:#3A4A60">إذا لم تطلب هذا، تجاهل هذا البريد بأمان.</p>
    `)
  );
}

async function sendResetEmail(email, code, name) {
  return sendViaResend(
    email,
    `${code} — رمز إعادة تعيين كلمة السر`,
    baseTemplate(`
      <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#E8E4D8">إعادة تعيين كلمة السر 🔑</p>
      <p style="margin:0 0 28px;font-size:14px;color:#8A9AB8;line-height:1.8">مرحباً ${name || ''}، طلبت إعادة تعيين كلمة السر. استخدم الرمز أدناه:</p>
      ${otpBlock(code, '#E74C3C', 'rgba(231,76,60,0.4)')}
      ${warningBlock('⏱️ <b style="color:#E74C3C">الرمز صالح 10 دقائق فقط</b><br/>🔒 إذا لم تطلب هذا، تجاهل البريد')}
    `)
  );
}

async function sendActivationEmail(email, name, endDate, subType) {
  const typeNames = { monthly: 'شهري', '3months': 'ثلاثة أشهر', yearly: 'سنوي' };
  const typeLabel = typeNames[subType] || subType;
  return sendViaResend(
    email,
    `✅ تم تفعيل اشتراكك في وثيقتي`,
    baseTemplate(`
      <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#E8E4D8">مبروك ${name}! 🎉</p>
      <p style="margin:0 0 28px;font-size:14px;color:#8A9AB8;line-height:1.8">تم تفعيل اشتراكك بنجاح.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0">
        <div style="background:rgba(46,204,113,0.07);border:2px solid rgba(46,204,113,0.35);border-radius:16px;padding:24px 36px;display:inline-block">
          <p style="margin:0 0 8px;font-size:12px;color:#8A9AB8">نوع الاشتراك</p>
          <p style="margin:0 0 14px;font-size:28px;font-weight:900;color:#2ECC71">${typeLabel}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#8A9AB8">صالح حتى</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#E8C97A">${new Date(endDate).toLocaleDateString('ar-DZ', {year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </td></tr></table>
    `)
  );
}

module.exports = { sendOTPEmail, sendResetEmail, sendActivationEmail };
