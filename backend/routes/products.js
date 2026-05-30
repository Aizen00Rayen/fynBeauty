const express = require("express");

const { pool } = require("../config/db");
const { HttpError, asyncHandler } = require("../utils/http");
const { escapeLike } = require("../utils/helpers");
const { publicProduct, publicCategory } = require("../utils/models");

const router = express.Router();

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const [cats] = await pool.query("SELECT * FROM categories ORDER BY sort_order ASC");
    for (const c of cats) {
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM products WHERE category_slug = ? AND is_active = 1",
        [c.slug]
      );
      c.product_count = count;
    }
    res.json(cats.map(publicCategory));
  })
);

router.get(
  "/products/featured",
  asyncHandler(async (req, res) => {
    const [items] = await pool.query(
      "SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 LIMIT 8"
    );
    res.json(items.map(publicProduct));
  })
);

router.get(
  "/products/bestsellers",
  asyncHandler(async (req, res) => {
    const [items] = await pool.query(
      "SELECT * FROM products WHERE is_active = 1 ORDER BY sold_count DESC LIMIT 8"
    );
    res.json(items.map(publicProduct));
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const {
      category,
      search,
      sort = "newest",
      featured,
      in_stock,
      on_sale,
      min_price,
      max_price,
    } = req.query;

    const where = ["is_active = 1"];
    const params = [];

    if (category) {
      where.push("category_slug = ?");
      params.push(category);
    }
    if (featured !== undefined) {
      where.push("is_featured = ?");
      params.push(featured === "true" || featured === "1" ? 1 : 0);
    }
    if (in_stock === "true" || in_stock === "1") {
      where.push("stock > 0");
    }
    if (on_sale === "true" || on_sale === "1") {
      where.push("compare_price IS NOT NULL");
    }
    if (search) {
      where.push("name LIKE ? ESCAPE '\\\\'");
      params.push(`%${escapeLike(search)}%`);
    }
    if (min_price !== undefined && min_price !== "") {
      where.push("price >= ?");
      params.push(Number(min_price));
    }
    if (max_price !== undefined && max_price !== "") {
      where.push("price <= ?");
      params.push(Number(max_price));
    }

    const sortMap = {
      price_asc: "price ASC",
      price_desc: "price DESC",
      popular: "sold_count DESC",
      newest: "created_at DESC",
    };
    const orderBy = sortMap[sort] || "created_at DESC";

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const whereSql = where.join(" AND ");
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
      params
    );
    const [items] = await pool.query(
      `SELECT * FROM products WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ products: items.map(publicProduct), total, page, limit });
  })
);

router.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1",
      [req.params.slug]
    );
    const product = rows[0];
    if (!product) throw new HttpError(404, "Produit introuvable");
    const [related] = await pool.query(
      "SELECT * FROM products WHERE category_slug = ? AND slug <> ? AND is_active = 1 LIMIT 4",
      [product.category_slug, req.params.slug]
    );
    const result = publicProduct(product);
    result.related = related.map(publicProduct);
    res.json(result);
  })
);

module.exports = router;
