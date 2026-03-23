'use strict';
const tpls = require('./templates');

const v = (x, fb='___________') => (x && String(x).trim()) ? String(x).trim() : fb;
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function fmtDate(d){
  if(!d) return today();
  try{ const dt=new Date(d); if(isNaN(dt)) return String(d); return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`; }catch{return String(d);}
}
function today(){ return fmtDate(new Date().toISOString()); }

// ── الورقة الرسمية الجزائرية الأصيلة ─────────────────────────
function shell(title, body, city, date, opts={}) {
  const {noSig=false, twoSigs=false, leftSig='الطرف الأول', rightSig='الطرف الثاني', extraFooter=''} = opts;
  const cityDate = `${v(city,'في')}، في ${fmtDate(date)||today()}`;
  const sigBlock = noSig ? '' : twoSigs ? `
<div style="display:flex;justify-content:space-between;margin-top:60px;page-break-inside:avoid">
  <div style="text-align:center;width:44%">
    <p style="font-weight:700;margin-bottom:4px">${leftSig}</p>
    <p style="font-size:11pt;color:#444;margin-bottom:38px">الاسم وتاريخ التوقيع</p>
    <div style="border-bottom:1px solid #000;width:80%;margin:0 auto 6px"></div>
    <p style="font-size:10pt;color:#555">الإمضاء والبصمة</p>
  </div>
  <div style="text-align:center;width:44%">
    <p style="font-weight:700;margin-bottom:4px">${rightSig}</p>
    <p style="font-size:11pt;color:#444;margin-bottom:38px">الاسم وتاريخ التوقيع</p>
    <div style="border-bottom:1px solid #000;width:80%;margin:0 auto 6px"></div>
    <p style="font-size:10pt;color:#555">الإمضاء والبصمة</p>
  </div>
</div>` : `
<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:60px;page-break-inside:avoid">
  <div style="text-align:center;width:44%">
    <p style="font-size:11pt;color:#444;margin-bottom:38px">التوقيع والبصمة</p>
    <div style="border-bottom:1px solid #000;width:80%;margin:0 auto 6px"></div>
    <p style="font-size:10pt;color:#555">الإمضاء</p>
  </div>
  <div style="text-align:center;width:44%">
    <p style="font-size:11pt;color:#333">${cityDate}</p>
    <div style="border-bottom:1px solid #000;width:80%;margin:16px auto 6px"></div>
    <p style="font-size:10pt;color:#555">التاريخ والمكان</p>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Amiri',serif;font-size:14.5pt;line-height:2;color:#000;background:#fff;padding:18mm 22mm;direction:rtl;max-width:210mm;margin:0 auto}
.header{text-align:center;padding-bottom:12px;margin-bottom:24px;border-bottom:2px solid #000;position:relative}
.header::after{content:'';display:block;border-bottom:1px solid #000;margin-top:3px}
.bismillah{font-size:15pt;font-weight:700;font-family:'Amiri',serif;margin-bottom:4px}
.republic{font-size:12.5pt;font-weight:700;letter-spacing:0.5px}
.motto{font-size:10.5pt;color:#222;margin-top:2px}
h1{text-align:center;font-size:16pt;font-weight:700;text-decoration:underline;text-underline-offset:7px;margin:22px 0 26px;font-family:'Amiri',serif;line-height:1.5}
p{margin:7px 0;text-align:justify;text-justify:inter-word}
.indent{text-indent:2cm}
.bold{font-weight:700}
.ul{text-decoration:underline;text-underline-offset:3px}
.center{text-align:center}
.art{font-weight:700;text-decoration:underline;text-underline-offset:3px;font-size:14pt}
.section-title{font-weight:700;text-decoration:underline;text-align:center;margin:16px 0 10px;font-size:14.5pt}
table{width:100%;border-collapse:collapse;margin:14px 0;font-family:'Cairo',sans-serif;font-size:11pt}
th{background:#000;color:#fff;padding:8px 12px;text-align:right;font-weight:700}
td{padding:7px 12px;border:1px solid #666}
tr:nth-child(even) td{background:#f5f5f5}
.total-row td{font-weight:700;border-top:2px solid #000;background:#eee}
hr.doc-hr{border:none;border-top:1px solid #888;margin:14px 0}
@media print{body{padding:12mm 18mm;font-size:13.5pt}@page{size:A4 portrait;margin:0}.no-print{display:none}h1{margin:14px 0 18px}
/* منع كسر العناصر المهمة عند الطباعة */
p,table,hr.doc-hr{page-break-inside:avoid}
.section-title{page-break-after:avoid}
h1,h2,h3{page-break-after:avoid}
/* التأكد أن التوقيعات في نفس الصفحة */
div[style*="page-break-inside:avoid"]{page-break-inside:avoid!important}
/* إخفاء روابط الخطوط عند الطباعة لتسريعها */
}
</style>
</head>
<body>
<div class="header">
  <div class="bismillah">بسم الله الرحمن الرحيم</div>
  <div class="republic">الجمهورية الجزائرية الديمقراطية الشعبية</div>
  <div class="motto">شعبي — ديمقراطي — اجتماعي</div>
</div>
<h1>${title}</h1>
${body}
${sigBlock}
${extraFooter}
</body>
</html>`;
}

// ── السيرة الذاتية
function gen_cv(d){
  const skills=(d.skills||'العمل الجماعي\nالتواصل الفعّال\nإتقان الحاسوب').split('\n').filter(s=>s.trim());
  const langs=(d.languages||'العربية: ممتاز\nالفرنسية: جيد').split('\n').filter(l=>l.trim());
  const certs=(d.certifications||'').split('\n').filter(c=>c.trim());
  const eduLines=(d.education||'').split('||').map(l=>l.trim()).filter(Boolean);
  const expLines=(d.experience||'').split('||').map(l=>l.trim()).filter(Boolean);

  function buildEdu(){
    if(!eduLines.length&&d.degree) return `<div class="cv-item"><div class="cv-item-title">${v(d.degree)}</div><div class="cv-item-sub">${v(d.school,'')} ${d.gradYear?'— '+d.gradYear:''} ${d.specialty?'| '+d.specialty:''}</div></div>`;
    return eduLines.map(line=>{const p=line.split('|').map(x=>x.trim());return`<div class="cv-item"><div class="cv-item-title">${p[0]||''}</div><div class="cv-item-sub">${p[1]||''} ${p[2]?'— '+p[2]:''}</div></div>`;}).join('');
  }
  function buildExp(){
    if(!expLines.length) return '<p style="color:#666;font-size:9.5pt">لا توجد خبرة مهنية مذكورة</p>';
    return expLines.map(line=>{const p=line.split('|').map(x=>x.trim());return`<div class="cv-item"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px"><div class="cv-item-title">${p[0]||''}</div><div style="font-size:9pt;color:#888;white-space:nowrap">${p[2]||''}</div></div><div class="cv-item-sub">${p[1]||''}</div>${p[3]?`<div class="cv-desc">${p[3]}</div>`:''}</div>`;}).join('');
  }

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet"/>
<style>*{margin:0;padding:0;box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Cairo',sans-serif;background:#fff;color:#111;direction:rtl;font-size:10pt;line-height:1.6}.cv-wrap{display:flex;min-height:297mm}.cv-side{width:210px;background:#1a2a4a;color:#fff;padding:26px 16px;flex-shrink:0;display:flex;flex-direction:column;gap:0}.cv-avatar{width:80px;height:80px;border-radius:50%;background:rgba(201,168,76,0.2);border:3px solid #c9a84c;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 12px}.cv-name{font-size:14pt;font-weight:900;color:#e8c97a;text-align:center;line-height:1.3;margin-bottom:4px}.cv-jobtitle{font-size:9pt;color:#aac4e8;text-align:center;margin-bottom:18px}.side-section{margin-bottom:18px}.side-sec-title{font-size:8pt;font-weight:700;color:#c9a84c;border-bottom:1px solid rgba(201,168,76,0.35);padding-bottom:3px;margin-bottom:8px;letter-spacing:1px}.side-info{font-size:8.5pt;color:#c8d8ec;margin-bottom:5px;line-height:1.55;word-break:break-word;display:flex;gap:5px;align-items:flex-start}.lang-row{display:flex;justify-content:space-between;font-size:8.5pt;color:#c8d8ec;margin-bottom:4px}.lang-bar{height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin-top:2px}.lang-fill{height:100%;background:linear-gradient(90deg,#c9a84c,#e8c97a);border-radius:2px}.skill-tag{display:inline-block;padding:2px 8px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);border-radius:3px;font-size:8pt;color:#e0d0a0;margin:2px}.cv-main{flex:1;padding:26px 22px}.cv-header-main{border-bottom:2px solid #1a2a4a;padding-bottom:10px;margin-bottom:18px}.main-name{font-size:22pt;font-weight:900;color:#1a2a4a;line-height:1.1}.main-job{font-size:11pt;color:#c9a84c;font-weight:600;margin-top:3px}.sec-title{font-size:10.5pt;font-weight:700;color:#fff;background:#1a2a4a;padding:5px 12px;margin:16px -4px 10px;border-radius:3px}.cv-item{margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed #e0e0e0}.cv-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}.cv-item-title{font-size:10.5pt;font-weight:700;color:#1a2a4a}.cv-item-sub{font-size:9pt;color:#555;margin:2px 0}.cv-desc{font-size:9pt;color:#333;line-height:1.65;margin-top:3px}.profile-text{font-size:10pt;color:#222;line-height:1.8}@media print{@page{size:A4;margin:0}body,html{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>
<div class="cv-wrap">
<div class="cv-side">
  <div class="cv-avatar">👤</div>
  <div class="cv-name">${v(d.fullName)}</div>
  <div class="cv-jobtitle">${v(d.jobTitle,'')}</div>
  <div class="side-section"><div class="side-sec-title">التواصل</div>
    ${d.phone?`<div class="side-info">📞 ${d.phone}</div>`:''}
    ${d.email?`<div class="side-info">✉️ <span style="word-break:break-all">${d.email}</span></div>`:''}
    ${d.address?`<div class="side-info">📍 ${d.address}</div>`:''}
  </div>
  <div class="side-section"><div class="side-sec-title">معلومات شخصية</div>
    ${d.birthDate?`<div class="side-info">🎂 ${fmtDate(d.birthDate)}</div>`:''}
    ${d.birthPlace?`<div class="side-info">🏙️ ${d.birthPlace}</div>`:''}
    ${d.status?`<div class="side-info">💍 ${d.status}</div>`:''}
    ${d.nationalId?`<div class="side-info" style="font-size:8pt;direction:ltr;text-align:right">🪪 ${d.nationalId}</div>`:''}
  </div>
  ${langs.length?`<div class="side-section"><div class="side-sec-title">اللغات</div>${langs.map(l=>{const[name,level]=l.split(':').map(x=>x.trim());const pct=level==='ممتاز'?95:level==='جيد جداً'?80:level==='جيد'?65:level==='متوسط'?50:40;return`<div class="lang-row"><span>${name}</span><span style="font-size:8pt;color:#aac4e8">${level||''}</span></div><div class="lang-bar"><div class="lang-fill" style="width:${pct}%"></div></div>`;}).join('')}</div>`:''}
  ${skills.length?`<div class="side-section"><div class="side-sec-title">المهارات</div><div>${skills.map(s=>`<span class="skill-tag">${s.trim()}</span>`).join('')}</div></div>`:''}
  ${certs.length?`<div class="side-section"><div class="side-sec-title">شهادات ودورات</div>${certs.map(c=>`<div class="side-info">🏅 ${c}</div>`).join('')}</div>`:''}
</div>
<div class="cv-main">
  <div class="cv-header-main"><div class="main-name">${v(d.fullName)}</div><div class="main-job">${v(d.jobTitle,'')}</div></div>
  ${d.summary?`<div class="sec-title">الملف الشخصي</div><p class="profile-text">${d.summary}</p>`:''}
  <div class="sec-title">التعليم والتكوين</div>${buildEdu()}
  <div class="sec-title">الخبرة المهنية</div>${buildExp()}
</div></div></body></html>`;
}

// ── فاتورة / عرض سعر
function gen_invoice(d){
  const rows=(d.items||'خدمة||1||1000').split('\n').map(line=>{const p=line.split('||').map(s=>s.trim());const qty=parseFloat(p[1])||1;const price=parseFloat(p[2])||0;return{desc:p[0]||'—',qty,price,total:qty*price};});
  const sub=rows.reduce((s,r)=>s+r.total,0);
  const tva=d.tva?sub*(parseFloat(d.tva)/100):0;
  const grand=sub+tva;
  const nf=n=>n.toLocaleString('ar-DZ',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"/>
<style>*{margin:0;padding:0;box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Cairo',sans-serif;padding:16mm 20mm;color:#000;background:#fff;direction:rtl;font-size:10.5pt}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a2a4a;padding-bottom:14px;margin-bottom:20px}.inv-title{font-size:26pt;font-weight:900;color:#1a2a4a}.co-name{font-size:13pt;font-weight:700}.co-info{font-size:9pt;color:#555;margin-top:3px;line-height:1.7}.client-box{background:#f7f7f7;border:1px solid #ddd;border-radius:4px;padding:12px 16px;margin-bottom:18px;font-size:10pt}table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10pt}th{background:#1a2a4a;color:#fff;padding:9px 12px;text-align:right;font-weight:700}td{padding:8px 12px;border:1px solid #ccc}tr:nth-child(even) td{background:#f9f9f9}.totals{display:flex;justify-content:flex-end}.totals-box{width:310px;font-size:10.5pt}.t-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.grand{font-size:12.5pt;font-weight:900;color:#1a2a4a;border-top:2px solid #1a2a4a;border-bottom:none;padding-top:8px;margin-top:4px}.notes{margin-top:18px;padding:12px;background:#fffde7;border:1px solid #ffe082;border-radius:4px;font-size:9.5pt}.footer-note{margin-top:24px;font-size:9pt;color:#777;text-align:center;border-top:1px solid #eee;padding-top:10px}@media print{@page{size:A4;margin:0}body{padding:12mm 16mm}}</style>
</head><body>
<div class="hdr">
  <div>
    <div class="inv-title">${d.isQuote?'عرض السعر':'فاتورة'}</div>
    <div style="font-size:10pt;color:#555;margin-top:4px">رقم: <b>${v(d.invoiceNum,'001')}</b></div>
    <div style="font-size:10pt;color:#555">التاريخ: ${fmtDate(d.date)}</div>
  </div>
  <div style="text-align:left">
    <div class="co-name">${v(d.companyName)}</div>
    <div class="co-info">${d.companyAddress?d.companyAddress+'<br/>':''}${d.rc?'RC: '+d.rc+'<br/>':''}${d.nif?'NIF: '+d.nif+'<br/>':''}${d.phone?'📞 '+d.phone:''}</div>
  </div>
</div>
<div class="client-box"><b>${d.isQuote?'مُعدّ لـ':'موجّهة إلى'}:</b> ${v(d.clientName)}<br/>${d.clientAddress?'<b>العنوان:</b> '+d.clientAddress:''}</div>
<table>
  <tr><th>البيان / الخدمة</th><th style="text-align:center;width:70px">الكمية</th><th style="text-align:left;width:130px">سعر الوحدة (دج)</th><th style="text-align:left;width:130px">المجموع (دج)</th></tr>
  ${rows.map(r=>`<tr><td>${r.desc}</td><td style="text-align:center">${r.qty}</td><td style="text-align:left;direction:ltr">${nf(r.price)}</td><td style="text-align:left;direction:ltr"><b>${nf(r.total)}</b></td></tr>`).join('')}
</table>
<div class="totals"><div class="totals-box">
  <div class="t-row"><span>المجموع الجزئي (HT)</span><span style="direction:ltr">${nf(sub)} دج</span></div>
  ${tva?`<div class="t-row"><span>TVA (${d.tva}%)</span><span style="direction:ltr">${nf(tva)} دج</span></div>`:''}
  <div class="t-row grand"><span>المجموع الكلي${tva?' (TTC)':''}</span><span style="direction:ltr">${nf(grand)} دج</span></div>
</div></div>
${d.amountText?`<p style="margin-top:14px;font-size:10pt"><b>المبلغ بالحروف:</b> ${d.amountText} دينار جزائري فقط لا غير</p>`:''}
${d.notes?`<div class="notes"><b>ملاحظات:</b> ${d.notes}</div>`:''}
<div class="footer-note">هذه الفاتورة حُرِّرت وفق التشريع الجزائري المعمول به • شكراً لتعاملكم</div>
</body></html>`;
}

// ── عقد إيجار
function gen_rental(d,title){
  return shell(title||'عقد إيجار سكني',`
<p class="indent">إنه في يوم <span class="bold ul">${fmtDate(d.contractDate||d.date)}</span> بمدينة <span class="bold ul">${v(d.city)}</span>، تم إبرام هذا العقد بين:</p>
<p><span class="bold">الطرف الأول (المؤجِّر):</span> السيد/ة <span class="ul bold">${v(d.ownerName)}</span>، رقم التعريف الوطني: <span class="ul">${v(d.ownerNID)}</span>، المقيم بـ: ${v(d.ownerAddress)}.</p>
<p><span class="bold">الطرف الثاني (المستأجر):</span> السيد/ة <span class="ul bold">${v(d.tenantName)}</span>، رقم التعريف الوطني: <span class="ul">${v(d.tenantNID)}</span>، المقيم حالياً بـ: ${v(d.tenantAddress)}.</p>
<hr class="doc-hr"/>
<p class="section-title">البنود والشروط</p>
<p><span class="art">المادة 01 — موضوع العقد:</span> يؤجِّر الطرف الأول للطرف الثاني المسكن الكائن بـ: <span class="ul bold">${v(d.propertyAddress)}</span>، ولاية: <span class="ul">${v(d.wilaya)}</span>، يتكوّن من <span class="ul bold">${v(d.rooms)}</span> غرفة، الطابق: ${v(d.floor,'الأرضي')}.</p>
<p><span class="art">المادة 02 — مدة الإيجار:</span> تبدأ من <span class="ul">${fmtDate(d.startDate)}</span> وتنتهي في <span class="ul">${fmtDate(d.endDate)}</span> (${v(d.duration,'سنة كاملة')}). يتجدد تلقائياً ما لم يُبلَّغ بالإنهاء قبل ثلاثة (3) أشهر.</p>
<p><span class="art">المادة 03 — بدل الإيجار:</span> حُدِّد بمبلغ <span class="bold ul">${v(d.rent)} دج/شهر</span>، يُدفع في مطلع كل شهر.</p>
<p><span class="art">المادة 04 — التأمين:</span> مبلغ التأمين: <span class="ul bold">${v(d.deposit,'شهر إيجار')}</span>، يُردّ عند الإخلاء.</p>
<p><span class="art">المادة 05 — التزامات المستأجر:</span> المحافظة على المسكن — عدم التنازل عن الإيجار — دفع فواتير المرافق في آجالها.</p>
<p><span class="art">المادة 06 — إنهاء العقد:</span> إشعار مسبق (3) أشهر طبقاً للقانون رقم 91-12.</p>
<p><span class="art">المادة 07 — النزاعات:</span> تُحال إلى المحاكم المختصة في ولاية ${v(d.wilaya)}.</p>
<p style="margin-top:18px">حُرِّر في نسختين (2) أصليتين.</p>`,
    d.city, d.contractDate||d.date, {twoSigs:true,leftSig:'المؤجِّر',rightSig:'المستأجر'});
}

// ── طلب التحاق عسكري/أمني
function gen_military(d,tpl){
  return shell(tpl.title,`
<p><span class="bold">إلى:</span></p>
<p style="text-indent:1cm">${v(tpl.dest,'السيد المسؤول المختص')}</p>
<p style="text-indent:1cm">المحترم</p>
<br/>
<p><span class="bold">الموضوع:</span> طلب الالتحاق بـ${v(tpl.service)}</p>
<hr class="doc-hr"/>
<p class="indent">يشرفني أن أتقدم إليكم بهذا الطلب مُلتمساً قبولي في صفوف <b>${v(tpl.service)}</b>، وفيما يلي بياناتي:</p>
<p class="section-title">البيانات الشخصية</p>
<p>الاسم واللقب: <span class="ul bold">${v(d.fullName)}</span></p>
<p>رقم التعريف الوطني (NIN): <span class="ul">${v(d.nid)}</span></p>
<p>تاريخ الميلاد: <span class="ul">${fmtDate(d.birthDate)}</span> &nbsp; مكان الميلاد: <span class="ul">${v(d.birthPlace)}</span></p>
<p>العنوان: <span class="ul">${v(d.address)}</span></p>
<p>الهاتف: <span class="ul">${v(d.phone)}</span></p>
<p>الحالة الاجتماعية: <span class="ul">${v(d.status,'أعزب')}</span></p>
<p>المستوى الدراسي: <span class="ul bold">${v(d.level)}</span></p>
${d.specialty?`<p>التخصص: <span class="ul">${d.specialty}</span></p>`:''}
${d.height?`<p>الطول: <span class="ul">${d.height} سم</span> &nbsp; الوزن: <span class="ul">${v(d.weight,'—')} كغ</span></p>`:''}
${d.military_service?`<p>الخدمة الوطنية: <span class="ul">${d.military_service}</span></p>`:''}
${d.motivation?`<br/><p class="bold">دوافع الالتحاق:</p><p class="indent">${d.motivation}</p>`:''}
${d.previous_service?`<br/><p class="bold">الخدمات السابقة:</p><p class="indent">${d.previous_service}</p>`:''}
<br/>
<p class="indent">أُعلن استعدادي التام لجميع الاختبارات المقررة، وأُقرّ بصحة البيانات أعلاه وأتحمّل مسؤوليتها.</p>
<p class="indent">راجياً الموافقة والقبول، وتفضلوا بقبول فائق الاحترام والتقدير.</p>`,
    d.city, d.date);
}

// ── طلب إداري عام
function gen_admin(d,title){
  return shell(title,`
<p><span class="bold">إلى:</span></p>
<p style="text-indent:1cm">${v(d.authority,'السيد/ة المسؤول المختص')}</p>
<p style="text-indent:1cm">المحترم/ة</p>
<br/>
<p><span class="bold">الموضوع:</span> ${v(d.subject,title)}</p>
<hr class="doc-hr"/>
<p class="section-title">هوية الطالب</p>
<p>أنا الموقّع أدناه:</p>
<p>الاسم واللقب: <span class="ul bold">${v(d.fullName)}</span></p>
<p>رقم التعريف الوطني: <span class="ul">${v(d.nid)}</span></p>
${d.birthDate?`<p>تاريخ ومكان الميلاد: <span class="ul">${fmtDate(d.birthDate)}</span> بـ <span class="ul">${v(d.birthPlace)}</span></p>`:''}
<p>العنوان: <span class="ul">${v(d.address)}</span></p>
${d.phone?`<p>الهاتف: <span class="ul">${d.phone}</span></p>`:''}
<br/>
<p class="section-title">الطلب</p>
<p class="indent">${v(d.content)}</p>
${d.attachments?`<br/><p><b>الوثائق المرفقة:</b></p><p style="text-indent:1cm">${d.attachments}</p>`:''}
<br/>
<p class="indent">أرجو من سيادتكم النظر في طلبي والبت فيه في أقرب الآجال.</p>
<p class="indent">وتفضلوا بقبول فائق الاحترام والتقدير.</p>`,
    d.city, d.date);
}

// ── شكوى
function gen_complaint(d,title){
  return shell(title,`
<p><span class="bold">إلى:</span></p>
<p style="text-indent:1cm">${v(d.authority,'السيد/ة المسؤول المختص')}</p>
<p style="text-indent:1cm">المحترم/ة</p>
<br/>
<p><span class="bold">الموضوع:</span> شكوى بخصوص ${v(d.subject,title)}</p>
<hr class="doc-hr"/>
<p>أنا الموقّع أدناه: <span class="ul bold">${v(d.fullName)}</span>، رقم التعريف الوطني: <span class="ul">${v(d.nid)}</span>، المقيم بـ: <span class="ul">${v(d.address)}</span>، الهاتف: ${v(d.phone)}.</p>
<br/>
<p class="section-title">وقائع الشكوى</p>
<p class="indent">${v(d.facts)}</p>
${d.incident_date?`<p>تاريخ الوقائع: <span class="ul">${fmtDate(d.incident_date)}</span></p>`:''}
${d.damages?`<br/><p class="bold">الأضرار:</p><p class="indent">${d.damages}</p>`:''}
<br/>
<p class="section-title">الطلبات</p>
<p class="indent">${v(d.request,'أطلب من سيادتكم اتخاذ الإجراءات القانونية اللازمة وإعلامي بالنتيجة في أقرب الآجال.')}</p>
<br/>
<p class="indent">وتفضلوا بقبول فائق الاحترام والتقدير.</p>`,
    d.city, d.date);
}

// ── عقد عمل (قانون 90-11)
function gen_contract(d,title){
  return shell(title,`
<p class="indent">تم إبرام هذا العقد بين:</p>
<p><span class="bold">صاحب العمل:</span> مؤسسة <span class="ul bold">${v(d.company)}</span>، السجل التجاري: ${v(d.rc,'—')}, ممثَّلة بـ: <span class="ul">${v(d.managerName)}</span>.</p>
<p><span class="bold">العامل:</span> السيد/ة <span class="ul bold">${v(d.employeeName)}</span>، رقم التعريف الوطني: <span class="ul">${v(d.employeeNID)}</span>، المقيم بـ: ${v(d.employeeAddress,'—')}.</p>
<hr class="doc-hr"/>
<p class="section-title">البنود التعاقدية</p>
<p><span class="art">المادة 01 — التعيين:</span> يُعيَّن العامل في منصب <span class="ul bold">${v(d.position)}</span> اعتباراً من <span class="ul">${fmtDate(d.startDate)}</span>، وفق القانون 90-11.</p>
<p><span class="art">المادة 02 — طبيعة العقد:</span> ${title}${d.duration?`، المدة: <span class="ul bold">${d.duration}</span>`:''}.${d.trialPeriod?` فترة التجربة: <span class="ul">${d.trialPeriod}</span>.`:''}</p>
<p><span class="art">المادة 03 — الأجر:</span> الراتب الشهري الأساسي <span class="ul bold">${v(d.salary)} دج</span> مع جميع المنح المقررة قانوناً.</p>
<p><span class="art">المادة 04 — وقت العمل:</span> ${v(d.hours,'8 ساعات يومياً')} و40 ساعة أسبوعياً.</p>
<p><span class="art">المادة 05 — الإجازة:</span> 30 يوماً سنوياً مدفوعة الأجر.</p>
<p><span class="art">المادة 06 — الضمان الاجتماعي:</span> تسجيل إلزامي في CNAS.</p>
<p><span class="art">المادة 07 — إنهاء العقد:</span> وفق إجراءات القانون 90-11.</p>
<p style="margin-top:18px">حُرِّر في نسختين (2) أصليتين.</p>`,
    d.city, d.date, {twoSigs:true,leftSig:'صاحب العمل\nالختم والإمضاء',rightSig:'العامل\nالإمضاء والبصمة'});
}

// ── وصل إيجار
function gen_rent_receipt(d){
  return shell('وصل استلام الإيجار',`
<p>أنا الموقّع أدناه: <span class="ul bold">${v(d.ownerName)}</span> (المالك)،</p>
<p>أُقِرّ باستلامي من المستأجر السيد/ة: <span class="ul bold">${v(d.tenantName)}</span>،</p>
<p>مبلغ إيجار شهر: <span class="ul bold">${v(d.month)}</span>، قدره: <span class="bold ul">${v(d.amount)} دج (${v(d.amountText,'بالأحرف')})</span>،</p>
<p>مقابل المسكن: <span class="ul">${v(d.propertyAddress)}</span>.</p>
<br/>
<p class="indent">استلمت هذا المبلغ كاملاً دون تحفظ، وهذا الوصل دليل الاستلام الوحيد.</p>`,
    d.city, d.date);
}

// ── وصل مالي
function gen_money_receipt(d){
  return shell('وصل استلام مبلغ مالي',`
<p>أنا الموقّع أدناه: <span class="ul bold">${v(d.receiverName)}</span>، رقم التعريف الوطني: <span class="ul">${v(d.receiverNID,'—')}</span>,</p>
<p>أُقِرّ باستلامي من السيد/ة: <span class="ul bold">${v(d.payerName)}</span>، رقم التعريف: <span class="ul">${v(d.payerNID,'—')}</span>,</p>
<p>مبلغاً مالياً قدره: <span class="bold ul">${v(d.amount)} دج (${v(d.amountText,'بالأحرف')} فقط لا غير)</span>،</p>
<p>مقابل: <span class="bold">${v(d.reason)}</span>.</p>
<br/>
<p class="indent">استلمت هذا المبلغ كاملاً وأُبرئ ذمة الدافع منه تماماً. وهذا الوصل حجة بيد حامله.</p>`,
    d.city, d.date);
}

// ── تصريح شرفي
function gen_honor(d){
  return shell('تصريح شرفي',`
<p class="section-title">هوية المُصرِّح</p>
<p>أنا الموقّع أدناه:</p>
<p>الاسم واللقب: <span class="ul bold">${v(d.fullName)}</span></p>
<p>رقم التعريف الوطني (NIN): <span class="ul">${v(d.nid)}</span></p>
${d.birthDate?`<p>تاريخ ومكان الميلاد: <span class="ul">${fmtDate(d.birthDate)}</span> بـ <span class="ul">${v(d.birthPlace)}</span></p>`:''}
<p>العنوان: <span class="ul">${v(d.address)}</span></p>
${d.phone?`<p>الهاتف: <span class="ul">${d.phone}</span></p>`:''}
<br/>
<p class="section-title">موضوع التصريح</p>
<p class="indent">أُصرِّح شرفاً وعلى مسؤوليتي الكاملة، وأمام الجهات المختصة، بأن:</p>
<p class="bold indent">${v(d.content)}</p>
<br/>
<p class="indent">أُقِرّ بعلمي التام بالمسؤولية الجزائية والمدنية عن أي تصريح كاذب طبقاً لقانون العقوبات الجزائري.</p>
<p class="indent">حُرِّر هذا التصريح لاستعماله ${v(d.purpose,'فيما يلزم قانوناً')}.</p>`,
    d.city, d.date);
}

// ── عقد بيع سيارة
function gen_car_sale(d){
  return shell('عقد بيع مركبة',`
<p class="indent">في يوم <span class="bold ul">${fmtDate(d.date)}</span> بمدينة <span class="bold ul">${v(d.city)}</span>، اتفق الطرفان:</p>
<p><span class="bold">البائع:</span> السيد/ة <span class="ul bold">${v(d.sellerName)}</span>، رقم التعريف: <span class="ul">${v(d.sellerNID)}</span>.</p>
<p><span class="bold">المشتري:</span> السيد/ة <span class="ul bold">${v(d.buyerName)}</span>، رقم التعريف: <span class="ul">${v(d.buyerNID)}</span>.</p>
<hr class="doc-hr"/>
<p class="section-title">وصف المركبة</p>
<p>الماركة: <span class="bold ul">${v(d.brand)}</span> &nbsp;|&nbsp; الطراز: <span class="bold ul">${v(d.model)}</span> &nbsp;|&nbsp; سنة الصنع: <span class="bold ul">${v(d.year)}</span></p>
<p>رقم الهيكل (VIN): <span class="ul">${v(d.chassis)}</span></p>
<p>رقم التسجيل: <span class="ul">${v(d.plate)}</span></p>
<p>الحالة العامة: <span class="ul">${v(d.condition,'جيدة')}</span></p>
${d.mileage?`<p>عدد الكيلومترات: <span class="ul">${d.mileage} كم</span></p>`:''}
<p class="section-title">شروط البيع</p>
<p><span class="art">الفصل 01 — الثمن:</span> <span class="bold ul">${v(d.price)} دج (${v(d.priceText,'بالأحرف')} فقط لا غير)</span>، مدفوعاً كاملاً نقداً.</p>
<p><span class="art">الفصل 02 — نقل الملكية:</span> تنتقل اعتباراً من تاريخ هذا العقد.</p>
<p><span class="art">الفصل 03 — إقرار البائع:</span> المركبة خالية من أي رهن أو نزاع قانوني.</p>
<p><span class="art">الفصل 04 — التسليم:</span> تُسلَّم مع جميع وثائقها الرسمية.</p>
<p style="margin-top:18px">حُرِّر في نسختين (2) أصليتين.</p>`,
    d.city, d.date, {twoSigs:true,leftSig:'البائع',rightSig:'المشتري'});
}

// ── طلب قرض
function gen_loan(d){
  return shell('طلب قرض بنكي',`
<p><span class="bold">إلى:</span></p>
<p style="text-indent:1cm">السيد/ة المدير، بنك <span class="bold ul">${v(d.bankName)}</span>، فرع: ${v(d.branch,'—')}</p>
<p style="text-indent:1cm">المحترم/ة</p>
<br/>
<p><span class="bold">الموضوع:</span> طلب الحصول على قرض بنكي</p>
<hr class="doc-hr"/>
<p class="section-title">هوية المتقدم</p>
<p>الاسم واللقب: <span class="ul bold">${v(d.fullName)}</span>، رقم التعريف: <span class="ul">${v(d.nid)}</span>.</p>
<p>المقيم بـ: <span class="ul">${v(d.address)}</span>، الهاتف: ${v(d.phone)}.</p>
${d.employer?`<p>يعمل لدى: <span class="ul bold">${d.employer}</span> في منصب: <span class="ul">${v(d.position,'—')}</span>.</p><p>الراتب الصافي: <span class="ul bold">${v(d.salary,'—')} دج</span>.</p>`:''}
<br/>
<p class="section-title">تفاصيل القرض المطلوب</p>
<p>المبلغ: <span class="bold ul">${v(d.amount)} دج (${v(d.amountText,'بالأحرف')})</span>.</p>
<p>الغرض: <span class="bold ul">${v(d.purpose)}</span>.</p>
${d.duration?`<p>مدة السداد المقترحة: <span class="ul">${d.duration} شهراً</span>.</p>`:''}
<br/>
<p class="indent">أتعهد بتقديم جميع الوثائق وبسداد الأقساط في آجالها.</p>
<p class="indent">وتفضلوا بقبول فائق الاحترام والتقدير.</p>`,
    d.city, d.date);
}

// ── محضر اجتماع
function gen_minutes(d){
  return shell('محضر اجتماع',`
<p><span class="bold">المؤسسة:</span> <span class="ul">${v(d.institution)}</span></p>
<p><span class="bold">تاريخ الاجتماع:</span> <span class="ul">${fmtDate(d.meetingDate)}</span></p>
<p><span class="bold">مكان الانعقاد:</span> <span class="ul">${v(d.city)}</span></p>
<hr class="doc-hr"/>
<p class="section-title">الحاضرون</p>
<p>${v(d.attendees)}</p>
<hr class="doc-hr"/>
<p class="section-title">جدول الأعمال</p>
<p>${v(d.agenda)}</p>
<hr class="doc-hr"/>
<p class="section-title">القرارات المتخذة</p>
<p>${v(d.decisions)}</p>
<br/>
<p class="indent">رُفع الاجتماع بعد استيفاء جدول الأعمال، وحُرِّر هذا المحضر ووُقِّع عليه.</p>`,
    d.city, d.meetingDate);
}

// ── رسالة رسمية
function gen_letter(d,title){
  return shell(title,`
<p><span class="bold">إلى:</span> ${v(d.receiverName)}</p>
${d.receiverAddress?`<p style="text-indent:1cm">${d.receiverAddress}</p>`:''}
<br/>
<p><span class="bold">الموضوع:</span> ${v(d.subject,title)}</p>
<hr class="doc-hr"/>
<p class="indent">${v(d.content)}</p>
<br/>
<p class="indent">تفضلوا بقبول فائق الاحترام والتقدير.</p>
<br/>
<p><span class="bold">المُرسِل:</span> ${v(d.senderName)}</p>`,
    d.city, d.date);
}

// ── إقرار بالدين
function gen_debt(d){
  return shell('إقرار بالدين',`
<p class="section-title">هوية المُقِرّ (المدين)</p>
<p>أنا الموقّع أدناه: <span class="ul bold">${v(d.fullName)}</span>، رقم التعريف: <span class="ul">${v(d.nid)}</span>، المقيم بـ: <span class="ul">${v(d.address)}</span>.</p>
<br/>
<p class="indent">أُقِرّ صراحةً وطوعاً بأنني مدين للسيد/ة: <span class="ul bold">${v(d.creditorName)}</span>،</p>
<p>بمبلغ: <span class="bold ul">${v(d.amount)} دج (${v(d.amountText,'بالأحرف')} فقط لا غير)</span>،</p>
<p>بسبب: <span class="ul">${v(d.origin)}</span>.</p>
${d.repayDate?`<p>أتعهد بسداده في أجل لا يتجاوز: <span class="ul bold">${fmtDate(d.repayDate)}</span>.</p>`:''}
<br/>
<p class="indent">وهذا الإقرار حجة شرعية وقانونية، حُرِّر طوعاً دون إكراه.</p>`,
    d.city, d.date);
}

// ── وكالة
function gen_poa(d,title){
  return shell(title||'توكيل رسمي',`
<p class="section-title">هوية الموكِّل</p>
<p>أنا الموقّع أدناه: <span class="ul bold">${v(d.fullName)}</span>، رقم التعريف: <span class="ul">${v(d.nid)}</span>,</p>
${d.birthDate?`<p>المولود في: <span class="ul">${fmtDate(d.birthDate)}</span> بـ <span class="ul">${v(d.birthPlace)}</span>,</p>`:''}
<p>المقيم بـ: <span class="ul">${v(d.address)}</span>.</p>
<p class="section-title">هوية الوكيل</p>
<p>أُوكِّل السيد/ة: <span class="ul bold">${v(d.agentName)}</span>، رقم التعريف: <span class="ul">${v(d.agentNID)}</span>.</p>
<p class="section-title">موضوع الوكالة</p>
<p class="indent bold">${v(d.scope)}</p>
<br/>
<p class="indent">هذه الوكالة نافذة من تاريخ توقيعها${d.expiry?` وحتى: <span class="ul">${fmtDate(d.expiry)}</span>`:''}.</p>`,
    d.city, d.date);
}

// ══════════════════════════════════════════════════════════════
//  دالة التوليد الرئيسية
// ══════════════════════════════════════════════════════════════
module.exports = function generate(type, d) {
  const tpl = tpls[type];
  if (!tpl) throw new Error('نوع غير معروف: ' + type);
  const title = tpl.title || type;
  if (type==='cv') return gen_cv(d);
  if (type==='invoice'||type==='quote') return gen_invoice(d);
  if (type==='rent_receipt') return gen_rent_receipt(d);
  if (type==='money_receipt') return gen_money_receipt(d);
  if (type==='minutes') return gen_minutes(d);
  if (type==='loan_request'||type==='bnl_request') return gen_loan(d);
  if (type==='debt_acknowledgment') return gen_debt(d);
  if (type==='car_sale_contract'||type==='car_gift') return gen_car_sale(d);
  if (['honor_declaration','witness_statement','religious_marriage'].includes(type)) return gen_honor(d);
  if (['power_of_attorney','special_poa','car_poa'].includes(type)) return gen_poa(d,title);
  if (['rental_contract','commercial_rental','sublease_contract','roommate_agreement'].includes(type)) return gen_rental(d,title);
  if (['employment_contract','cdi_contract','internship_contract','part_time_contract','remote_contract','freelance_contract'].includes(type)) return gen_contract(d,title);
  if (tpl.service) return gen_military(d,tpl);
  const complaintTypes=['admin_complaint','appeal_request','police_complaint','gendarmerie_complaint','complaint_employer','hospital_complaint','pharmacy_complaint','bank_complaint','urban_complaint','noise_complaint','telecom_complaint','arpce_complaint','environment_complaint','water_complaint','electricity_complaint','gas_complaint','waste_complaint','parent_complaint','legal_complaint'];
  if (complaintTypes.includes(type)) return gen_complaint(d,title);
  const letterTypes=['official_letter','thank_you_letter','condolence_letter','recommendation_letter','acceptance_letter','rejection_letter','reminder_letter','invitation_letter','acknowledgment','donation_letter','guarantee_letter','bail_letter'];
  if (letterTypes.includes(type)) return gen_letter(d,title);
  return gen_admin(d,title);
};
