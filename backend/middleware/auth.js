const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { publicUser } = require("../utils/models");

const JWT_ALGORITHM = "HS256";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

function getExpiryDays() {
  return Number(process.env.JWT_EXPIRES_DAYS || 7);
}

function createAccessToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role || "customer",
    type: "access",
  };
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: `${getExpiryDays()}d`,
  });
}

function extractToken(req) {
  const header = req.headers["authorization"] || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
  return null;
}

async function findUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

function decodeToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
}

// Express middleware: requires a valid token, attaches req.user (sanitized).
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ detail: "Non authentifié" });
  let payload;
  try {
    payload = decodeToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ detail: "Session expirée" });
    }
    return res.status(401).json({ detail: "Jeton invalide" });
  }
  const user = await findUserById(payload.sub);
  if (!user) return res.status(401).json({ detail: "Utilisateur introuvable" });
  req.user = publicUser(user);
  next();
}

// Express middleware: attaches req.user if a valid token is present, else null.
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  req.user = null;
  if (token) {
    try {
      const payload = decodeToken(token);
      const user = await findUserById(payload.sub);
      if (user) req.user = publicUser(user);
    } catch {
      req.user = null;
    }
  }
  next();
}

// Express middleware: requires an authenticated admin.
function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ detail: "Accès réservé aux administrateurs" });
    }
    next();
  });
}

module.exports = {
  createAccessToken,
  requireAuth,
  optionalAuth,
  requireAdmin,
  findUserById,
};
