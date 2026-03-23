'use strict';
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, '..', 'wathiqati.db'));

// ── أداء: WAL mode للسرعة + ضبط الأمان
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    name       TEXT NOT NULL,
    ip_hash    TEXT,
    device_fp  TEXT,
    trial_end  DATETIME,
    sub_end    DATETIME,
    sub_type   TEXT DEFAULT 'trial',
    is_active  INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL,
    code       TEXT NOT NULL,
    type       TEXT DEFAULT 'register',
    expires_at DATETIME NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activation_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE NOT NULL,
    type       TEXT NOT NULL,
    days       INTEGER NOT NULL,
    used       INTEGER DEFAULT 0,
    used_by    INTEGER,
    used_at    DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_hash    TEXT,
    fp         TEXT,
    user_id    INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_docs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    doc_type   TEXT NOT NULL,
    doc_title  TEXT NOT NULL,
    doc_data   TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
  CREATE INDEX IF NOT EXISTS idx_saved_docs_user ON saved_docs(user_id);
  CREATE INDEX IF NOT EXISTS idx_otp_email       ON otp_codes(email, type);
  CREATE INDEX IF NOT EXISTS idx_act_code        ON activation_codes(code);
`);

// رموز تجريبية (تُضاف فقط إذا لم تكن موجودة)
[
  ['WQ-MON-TEST01', 'monthly',  30],
  ['WQ-3MO-TEST01', '3months',  90],
  ['WQ-YR-TEST01',  'yearly',  365],
].forEach(([c, t, d]) => {
  db.prepare('INSERT OR IGNORE INTO activation_codes(code,type,days) VALUES(?,?,?)').run(c, t, d);
});

module.exports = db;
