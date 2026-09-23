const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  const candidates = [
    path.resolve(__dirname, "../../../../nodejs/data/fynbeauty.sqlite"),
    path.resolve(process.cwd(), "../../../../nodejs/data/fynbeauty.sqlite"),
    "/home/u640326644/domains/fynbeauty.shop/nodejs/data/fynbeauty.sqlite",
    path.resolve(__dirname, "..", "data", "fynbeauty.sqlite"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.size > 4096) {
          console.log(`[db] Using existing persistent database: ${candidate} (${stat.size} bytes)`);
          return candidate;
        }
      } catch {}
    }
  }

  return path.join(__dirname, "..", "data", "fynbeauty.sqlite");
}

function resolveUploadsDir() {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;

  const candidates = [
    path.resolve(__dirname, "../../../../nodejs/uploads"),
    path.resolve(process.cwd(), "../../../../nodejs/uploads"),
    "/home/u640326644/domains/fynbeauty.shop/nodejs/uploads",
    path.join(__dirname, "..", "uploads"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(__dirname, "..", "uploads");
}

const DB_PATH = resolveDbPath();
const UPLOAD_DIR = resolveUploadsDir();

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

console.log(`[db] Connected to database: ${DB_PATH} (${fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0} bytes)`);
console.log(`[db] Uploads directory: ${UPLOAD_DIR}`);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const SELECT_RE = /^\s*(SELECT|PRAGMA)/i;

// SQLite has no boolean/undefined bind types — normalize at the boundary so
// route code can keep passing JS booleans/undefined like it did for mysql2.
function normalizeParams(params) {
  return (params || []).map((p) => {
    if (p === undefined) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    return p;
  });
}

// Mimics mysql2/promise's `query()` -> [rows, fields] (or [result, fields] for writes)
// contract so the existing route code (written against mysql2) keeps working unchanged.
function runQuery(sql, params) {
  const bound = normalizeParams(params);
  const stmt = db.prepare(sql);
  if (SELECT_RE.test(sql)) {
    return [stmt.all(bound), []];
  }
  const info = stmt.run(bound);
  return [{ affectedRows: info.changes, insertId: info.lastInsertRowid }, []];
}

async function query(sql, params) {
  return runQuery(sql, params);
}

const pool = {
  query,
  // better-sqlite3 is a single synchronous connection, so "getConnection" just
  // hands back a thin wrapper around the same db for transaction control.
  async getConnection() {
    return {
      query,
      async beginTransaction() {
        db.exec("BEGIN IMMEDIATE");
      },
      async commit() {
        db.exec("COMMIT");
      },
      async rollback() {
        try {
          db.exec("ROLLBACK");
        } catch {
          // no-op: nothing to roll back if the transaction never started
        }
      },
      release() {},
    };
  },
};

module.exports = { pool, db, DB_PATH, UPLOAD_DIR, resolveUploadsDir, resolveDbPath };
