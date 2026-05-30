const bcrypt = require("bcryptjs");

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(plain, hashed) {
  try {
    if (!hashed) return false;
    return bcrypt.compareSync(plain, hashed);
  } catch {
    return false;
  }
}

function slugify(text) {
  if (!text) return "";
  let t = String(text).toLowerCase().trim();
  t = t.replace(/[àáâãäå]/g, "a");
  t = t.replace(/[èéêë]/g, "e");
  t = t.replace(/[ìíîï]/g, "i");
  t = t.replace(/[òóôõö]/g, "o");
  t = t.replace(/[ùúûü]/g, "u");
  t = t.replace(/[^a-z0-9]+/g, "-");
  return t.replace(/^-+|-+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

// Parse a value that may be a JSON string (MariaDB) or already an object (MySQL 8).
function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Escape characters that have special meaning inside a MySQL LIKE pattern so
// user-supplied search text is treated literally.
function escapeLike(text) {
  return String(text).replace(/[\\%_]/g, (c) => "\\" + c);
}

module.exports = {
  hashPassword,
  verifyPassword,
  slugify,
  nowIso,
  parseJson,
  escapeLike,
};
