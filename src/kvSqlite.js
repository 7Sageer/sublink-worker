import Database from 'better-sqlite3';
import fs from 'fs';

if (!fs.existsSync('database')) {
  fs.mkdirSync('database');
}

const db = new Database('database/sublink_kv.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT,
    expire_at INTEGER
  )
`).run();

function now() {
  return Math.floor(Date.now() / 1000);
}

export function kvPut(key, value, { expirationTtl } = {}) {
  let expire_at = null;
  if (expirationTtl) {
    expire_at = now() + expirationTtl;
  }
  db.prepare(`
    INSERT INTO kv (key, value, expire_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, expire_at=excluded.expire_at
  `).run(key, value, expire_at);
}

export function kvGet(key) {
  const row = db.prepare('SELECT value, expire_at FROM kv WHERE key = ?').get(key);
  if (!row) return null;
  if (row.expire_at && row.expire_at < now()) {
    db.prepare('DELETE FROM kv WHERE key = ?').run(key);
    return null;
  }
  return row.value;
} 