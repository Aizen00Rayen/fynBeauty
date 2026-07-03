const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "fynbeauty.sqlite");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

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

module.exports = { pool, db };
