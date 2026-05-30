const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../config/db");
const { requireAuth, createAccessToken } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../utils/http");
const { hashPassword, verifyPassword, nowIso } = require("../utils/helpers");
const { publicUser } = require("../utils/models");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();
    const phone = body.phone ? String(body.phone) : null;

    if (!EMAIL_RE.test(email)) throw new HttpError(400, "Email invalide");
    if (password.length < 6) throw new HttpError(400, "Mot de passe trop court (min 6)");
    if (fullName.length < 2) throw new HttpError(400, "Nom complet requis");

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) throw new HttpError(400, "Cet email est déjà utilisé");

    const user = {
      id: uuidv4(),
      email,
      password_hash: hashPassword(password),
      full_name: fullName,
      phone,
      role: "customer",
      wilaya: null,
      address: null,
      created_at: nowIso(),
    };
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, wilaya, address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.password_hash, user.full_name, user.phone, user.role, user.wilaya, user.address, user.created_at]
    );
    const token = createAccessToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, "Email ou mot de passe incorrect");
    }
    const token = createAccessToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

router.post("/logout", (req, res) => {
  res.json({ message: "Déconnecté" });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  })
);

router.put(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const allowed = ["full_name", "phone", "wilaya", "address"];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined && body[key] !== null) updates[key] = body[key];
    }
    if (Object.keys(updates).length) {
      const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
      await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [
        ...Object.values(updates),
        req.user.id,
      ]);
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.user.id]);
    res.json(publicUser(rows[0]));
  })
);

router.put(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const oldPassword = String(body.old_password || "");
    const newPassword = String(body.new_password || "");
    if (newPassword.length < 6) throw new HttpError(400, "Nouveau mot de passe trop court (min 6)");

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.user.id]);
    const full = rows[0];
    if (!verifyPassword(oldPassword, full.password_hash)) {
      throw new HttpError(400, "Ancien mot de passe incorrect");
    }
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashPassword(newPassword),
      req.user.id,
    ]);
    res.json({ message: "Mot de passe mis à jour" });
  })
);

module.exports = router;
