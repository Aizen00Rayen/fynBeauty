const express = require("express");

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../utils/http");
const { nowIso } = require("../utils/helpers");
const { publicProduct } = require("../utils/models");

const router = express.Router();

router.get(
  "/favorites",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [favs] = await pool.query("SELECT product_id FROM favorites WHERE user_id = ? LIMIT 500", [
      req.user.id,
    ]);
    const ids = favs.map((f) => f.product_id);
    if (!ids.length) return res.json([]);
    const placeholders = ids.map(() => "?").join(", ");
    const [products] = await pool.query(
      `SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = 1`,
      ids
    );
    res.json(products.map(publicProduct));
  })
);

router.get(
  "/favorites/ids",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [favs] = await pool.query("SELECT product_id FROM favorites WHERE user_id = ? LIMIT 500", [
      req.user.id,
    ]);
    res.json(favs.map((f) => f.product_id));
  })
);

router.post(
  "/favorites/:product_id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = req.params.product_id;
    const [rows] = await pool.query("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
    if (!rows.length) throw new HttpError(404, "Produit introuvable");
    await pool.query(
      "INSERT OR IGNORE INTO favorites (user_id, product_id, created_at) VALUES (?, ?, ?)",
      [req.user.id, productId, nowIso()]
    );
    res.json({ message: "Ajouté aux favoris", product_id: productId });
  })
);

router.delete(
  "/favorites/:product_id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [
      req.user.id,
      req.params.product_id,
    ]);
    res.json({ message: "Retiré des favoris", product_id: req.params.product_id });
  })
);

module.exports = router;
