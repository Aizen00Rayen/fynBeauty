const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../config/db");
const { requireAdmin } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../utils/http");
const { slugify, nowIso, escapeLike } = require("../utils/helpers");
const { publicProduct, publicOrder, publicCoupon, publicUser, publicCategory } = require("../utils/models");

const router = express.Router();

// Every route in this module requires an admin.
router.use(requireAdmin);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// The client-supplied mimetype/filename are just headers an attacker fully
// controls — verify the actual file bytes before trusting the "image" upload.
// Returns the real extension for a known image signature, or null.
function sniffImageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return "webp";
  return null;
}

// ---------- Dashboard ----------
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [[{ totalOrders }]] = await pool.query("SELECT COUNT(*) AS totalOrders FROM orders");
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [[{ totalProducts }]] = await pool.query(
      "SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = 1"
    );

    const [allOrders] = await pool.query(
      "SELECT status, total, created_at FROM orders"
    );
    const totalRevenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const statuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
    const ordersByStatus = Object.fromEntries(statuses.map((s) => [s, 0]));
    for (const o of allOrders) {
      const st = o.status || "pending";
      ordersByStatus[st] = (ordersByStatus[st] || 0) + 1;
    }

    // Revenue last 14 days
    const revenueSeries = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - i);
      const dayStr = day.toISOString().slice(0, 10);
      let dayTotal = 0;
      for (const o of allOrders) {
        if (o.status === "cancelled") continue;
        const created = typeof o.created_at === "string" ? o.created_at : "";
        if (created.slice(0, 10) === dayStr) dayTotal += Number(o.total || 0);
      }
      const dd = String(day.getUTCDate()).padStart(2, "0");
      const mm = String(day.getUTCMonth() + 1).padStart(2, "0");
      revenueSeries.push({ date: `${dd}/${mm}`, revenue: Math.round(dayTotal * 100) / 100 });
    }

    const [recentOrders] = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 8"
    );
    const [topProducts] = await pool.query(
      "SELECT * FROM products ORDER BY sold_count DESC LIMIT 5"
    );
    const top = topProducts.map((p) => {
      const prod = publicProduct(p);
      return {
        id: prod.id,
        name: prod.name,
        image: prod.images && prod.images.length ? prod.images[0] : null,
        sold_count: prod.sold_count || 0,
        revenue: Math.round((prod.sold_count || 0) * (prod.price || 0) * 100) / 100,
      };
    });

    res.json({
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalUsers,
      totalProducts,
      ordersByStatus,
      revenueSeries,
      recentOrders: recentOrders.map(publicOrder),
      topProducts: top,
    });
  })
);

// ---------- Products CRUD ----------
async function uniqueProductSlug(name, excludeId = null) {
  const base = slugify(name) || uuidv4().slice(0, 8);
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await pool.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
    if (!rows.length || rows[0].id === excludeId) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

async function uniqueCategorySlug(name, excludeId = null) {
  const base = slugify(name) || uuidv4().slice(0, 8);
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await pool.query("SELECT id FROM categories WHERE slug = ? LIMIT 1", [slug]);
    if (!rows.length || rows[0].id === excludeId) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC LIMIT 1000");
    res.json(rows.map(publicProduct));
  })
);

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name) throw new HttpError(400, "Nom requis");
    let categoryName = null;
    if (b.category_slug) {
      const [c] = await pool.query("SELECT name FROM categories WHERE slug = ? LIMIT 1", [b.category_slug]);
      categoryName = c.length ? c[0].name : null;
    }
    const product = {
      id: uuidv4(),
      name: b.name,
      slug: await uniqueProductSlug(b.name),
      description: b.description || "",
      price: Number(b.price) || 0,
      compare_price: b.compare_price === null || b.compare_price === undefined ? null : Number(b.compare_price),
      category_slug: b.category_slug || null,
      category_name: categoryName,
      images: Array.isArray(b.images) ? b.images : [],
      stock: parseInt(b.stock, 10) || 0,
      is_active: b.is_active === undefined ? 1 : b.is_active ? 1 : 0,
      is_featured: b.is_featured ? 1 : 0,
      tags: Array.isArray(b.tags) ? b.tags : [],
      shades: Array.isArray(b.shades) ? b.shades : [],
      sku: b.sku || "FYN-" + uuidv4().slice(0, 8).toUpperCase(),
      weight_grams: b.weight_grams === null || b.weight_grams === undefined ? null : parseInt(b.weight_grams, 10),
      sold_count: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await pool.query(
      `INSERT INTO products
       (id, name, slug, description, price, compare_price, category_slug, category_name,
        images, stock, is_active, is_featured, tags, shades, sku, weight_grams, sold_count,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id, product.name, product.slug, product.description, product.price,
        product.compare_price, product.category_slug, product.category_name,
        JSON.stringify(product.images), product.stock, product.is_active, product.is_featured,
        JSON.stringify(product.tags), JSON.stringify(product.shades), product.sku,
        product.weight_grams, product.sold_count, product.created_at, product.updated_at,
      ]
    );
    res.json(publicProduct(product));
  })
);

router.get(
  "/products/:product_id",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.product_id]);
    if (!rows.length) throw new HttpError(404, "Produit introuvable");
    res.json(publicProduct(rows[0]));
  })
);

router.put(
  "/products/:product_id",
  asyncHandler(async (req, res) => {
    const id = req.params.product_id;
    const b = req.body || {};
    const [existingRows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    const existing = existingRows[0];
    if (!existing) throw new HttpError(404, "Produit introuvable");

    let categoryName = null;
    if (b.category_slug) {
      const [c] = await pool.query("SELECT name FROM categories WHERE slug = ? LIMIT 1", [b.category_slug]);
      categoryName = c.length ? c[0].name : null;
    }
    const slug = b.name !== existing.name ? await uniqueProductSlug(b.name, id) : existing.slug;

    await pool.query(
      `UPDATE products SET
        name = ?, slug = ?, description = ?, price = ?, compare_price = ?, category_slug = ?,
        category_name = ?, images = ?, stock = ?, is_active = ?, is_featured = ?, tags = ?,
        shades = ?, sku = ?, weight_grams = ?, updated_at = ?
       WHERE id = ?`,
      [
        b.name, slug, b.description || "", Number(b.price) || 0,
        b.compare_price === null || b.compare_price === undefined ? null : Number(b.compare_price),
        b.category_slug || null, categoryName,
        JSON.stringify(Array.isArray(b.images) ? b.images : []),
        parseInt(b.stock, 10) || 0,
        b.is_active === undefined ? 1 : b.is_active ? 1 : 0,
        b.is_featured ? 1 : 0,
        JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
        JSON.stringify(Array.isArray(b.shades) ? b.shades : []),
        b.sku || existing.sku,
        b.weight_grams === null || b.weight_grams === undefined ? null : parseInt(b.weight_grams, 10),
        nowIso(), id,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
    res.json(publicProduct(rows[0]));
  })
);

router.delete(
  "/products/:product_id",
  asyncHandler(async (req, res) => {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [req.params.product_id]);
    if (result.affectedRows === 0) throw new HttpError(404, "Produit introuvable");
    await pool.query("DELETE FROM favorites WHERE product_id = ?", [req.params.product_id]);
    res.json({ message: "Produit supprimé" });
  })
);

// ---------- Categories CRUD ----------
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const [cats] = await pool.query("SELECT * FROM categories ORDER BY sort_order ASC LIMIT 200");
    for (const c of cats) {
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM products WHERE category_slug = ?",
        [c.slug]
      );
      c.product_count = count;
    }
    res.json(cats.map(publicCategory));
  })
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name) throw new HttpError(400, "Nom requis");
    const category = {
      id: uuidv4(),
      name: b.name,
      slug: await uniqueCategorySlug(b.name),
      description: b.description || "",
      image_url: b.image_url || null,
      sort_order: parseInt(b.sort_order, 10) || 0,
    };
    await pool.query(
      "INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [category.id, category.name, category.slug, category.description, category.image_url, category.sort_order]
    );
    res.json(publicCategory(category));
  })
);

router.put(
  "/categories/:category_id",
  asyncHandler(async (req, res) => {
    const id = req.params.category_id;
    const b = req.body || {};
    const [existingRows] = await pool.query("SELECT * FROM categories WHERE id = ? LIMIT 1", [id]);
    const existing = existingRows[0];
    if (!existing) throw new HttpError(404, "Catégorie introuvable");

    let newSlug = existing.slug;
    if (b.name !== existing.name) {
      newSlug = await uniqueCategorySlug(b.name, id);
      await pool.query(
        "UPDATE products SET category_slug = ?, category_name = ? WHERE category_slug = ?",
        [newSlug, b.name, existing.slug]
      );
    } else {
      await pool.query("UPDATE products SET category_name = ? WHERE category_slug = ?", [
        b.name,
        existing.slug,
      ]);
    }
    await pool.query(
      "UPDATE categories SET name = ?, description = ?, image_url = ?, sort_order = ?, slug = ? WHERE id = ?",
      [b.name, b.description || "", b.image_url || null, parseInt(b.sort_order, 10) || 0, newSlug, id]
    );
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ? LIMIT 1", [id]);
    res.json(publicCategory(rows[0]));
  })
);

router.delete(
  "/categories/:category_id",
  asyncHandler(async (req, res) => {
    const [catRows] = await pool.query("SELECT * FROM categories WHERE id = ? LIMIT 1", [req.params.category_id]);
    const cat = catRows[0];
    if (!cat) throw new HttpError(404, "Catégorie introuvable");
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) AS count FROM products WHERE category_slug = ?",
      [cat.slug]
    );
    if (count > 0) {
      throw new HttpError(400, `Impossible de supprimer : ${count} produit(s) lié(s) à cette catégorie`);
    }
    await pool.query("DELETE FROM categories WHERE id = ?", [req.params.category_id]);
    res.json({ message: "Catégorie supprimée" });
  })
);

// ---------- Image upload ----------
router.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Aucun fichier reçu");
    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      throw new HttpError(400, "Format d'image non supporté");
    }
    const ext = sniffImageExtension(req.file.buffer);
    if (!ext) throw new HttpError(400, "Fichier image invalide");
    const name = `${uuidv4().replace(/-/g, "")}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), req.file.buffer);
    res.json({ url: `/api/uploads/${name}` });
  })
);

// ---------- Orders ----------
router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const { status, wilaya, search } = req.query;
    const where = [];
    const params = [];
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (wilaya) {
      where.push("wilaya = ?");
      params.push(wilaya);
    }
    if (search) {
      const like = `%${escapeLike(search)}%`;
      where.push("(order_number LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\')");
      params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT 2000`,
      params
    );
    res.json(rows.map(publicOrder));
  })
);

router.get(
  "/orders/:order_id",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [req.params.order_id]);
    if (!rows.length) throw new HttpError(404, "Commande introuvable");
    res.json(publicOrder(rows[0]));
  })
);

router.put(
  "/orders/:order_id/status",
  asyncHandler(async (req, res) => {
    const valid = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
    const status = (req.body || {}).status;
    if (!valid.includes(status)) throw new HttpError(400, "Statut invalide");
    const [result] = await pool.query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [
      status,
      nowIso(),
      req.params.order_id,
    ]);
    if (result.affectedRows === 0) throw new HttpError(404, "Commande introuvable");
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [req.params.order_id]);
    res.json(publicOrder(rows[0]));
  })
);

router.put(
  "/orders/:order_id/notes",
  asyncHandler(async (req, res) => {
    await pool.query("UPDATE orders SET notes = ? WHERE id = ?", [
      (req.body || {}).notes || null,
      req.params.order_id,
    ]);
    res.json({ message: "Note enregistrée" });
  })
);

// ---------- Users ----------
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { search, role } = req.query;
    const where = [];
    const params = [];
    if (role) {
      where.push("role = ?");
      params.push(role);
    }
    if (search) {
      const like = `%${escapeLike(search)}%`;
      where.push("(full_name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')");
      params.push(like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [users] = await pool.query(
      `SELECT * FROM users ${whereSql} ORDER BY created_at DESC LIMIT 2000`,
      params
    );
    for (const u of users) {
      const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM orders WHERE user_id = ?", [u.id]);
      u.order_count = count;
    }
    res.json(users.map(publicUser));
  })
);

router.get(
  "/users/:user_id",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.params.user_id]);
    if (!rows.length) throw new HttpError(404, "Utilisateur introuvable");
    const user = publicUser(rows[0]);
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
      [req.params.user_id]
    );
    user.orders = orders.map(publicOrder);
    res.json(user);
  })
);

router.put(
  "/users/:user_id/role",
  asyncHandler(async (req, res) => {
    const role = (req.body || {}).role;
    if (!["customer", "admin"].includes(role)) throw new HttpError(400, "Rôle invalide");
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.user_id]);
    res.json({ message: "Rôle mis à jour" });
  })
);

router.delete(
  "/users/:user_id",
  asyncHandler(async (req, res) => {
    if (req.params.user_id === req.user.id) {
      throw new HttpError(400, "Impossible de supprimer votre propre compte");
    }
    // Protect the permanent admin account from deletion.
    const [rows] = await pool.query("SELECT email FROM users WHERE id = ? LIMIT 1", [req.params.user_id]);
    const protectedEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    if (rows.length && protectedEmail && rows[0].email.toLowerCase() === protectedEmail) {
      throw new HttpError(400, "Impossible de supprimer le compte administrateur principal");
    }
    await pool.query("DELETE FROM users WHERE id = ?", [req.params.user_id]);
    res.json({ message: "Utilisateur supprimé" });
  })
);

// ---------- Coupons CRUD ----------
router.get(
  "/coupons",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC LIMIT 500");
    res.json(rows.map(publicCoupon));
  })
);

router.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const code = String(b.code || "").toUpperCase().trim();
    if (!code) throw new HttpError(400, "Code requis");
    const [existing] = await pool.query("SELECT id FROM coupons WHERE code = ? LIMIT 1", [code]);
    if (existing.length) throw new HttpError(400, "Ce code existe déjà");
    const coupon = {
      id: uuidv4(),
      code,
      description: b.description || "",
      discount_type: b.discount_type,
      discount_value: Number(b.discount_value) || 0,
      min_order_amount: Number(b.min_order_amount) || 0,
      max_uses: b.max_uses === null || b.max_uses === undefined ? null : parseInt(b.max_uses, 10),
      used_count: 0,
      is_active: b.is_active === undefined ? 1 : b.is_active ? 1 : 0,
      expires_at: b.expires_at || null,
      created_at: nowIso(),
    };
    await pool.query(
      `INSERT INTO coupons
       (id, code, description, discount_type, discount_value, min_order_amount, max_uses,
        used_count, is_active, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        coupon.id, coupon.code, coupon.description, coupon.discount_type, coupon.discount_value,
        coupon.min_order_amount, coupon.max_uses, coupon.used_count, coupon.is_active,
        coupon.expires_at, coupon.created_at,
      ]
    );
    res.json(publicCoupon(coupon));
  })
);

router.put(
  "/coupons/:coupon_id",
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const [result] = await pool.query(
      `UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?,
        min_order_amount = ?, max_uses = ?, is_active = ?, expires_at = ? WHERE id = ?`,
      [
        String(b.code || "").toUpperCase().trim(), b.description || "", b.discount_type,
        Number(b.discount_value) || 0, Number(b.min_order_amount) || 0,
        b.max_uses === null || b.max_uses === undefined ? null : parseInt(b.max_uses, 10),
        b.is_active === undefined ? 1 : b.is_active ? 1 : 0, b.expires_at || null,
        req.params.coupon_id,
      ]
    );
    if (result.affectedRows === 0) throw new HttpError(404, "Coupon introuvable");
    const [rows] = await pool.query("SELECT * FROM coupons WHERE id = ? LIMIT 1", [req.params.coupon_id]);
    res.json(publicCoupon(rows[0]));
  })
);

router.delete(
  "/coupons/:coupon_id",
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM coupons WHERE id = ?", [req.params.coupon_id]);
    res.json({ message: "Coupon supprimé" });
  })
);

router.patch(
  "/coupons/:coupon_id/toggle",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM coupons WHERE id = ? LIMIT 1", [req.params.coupon_id]);
    if (!rows.length) throw new HttpError(404, "Coupon introuvable");
    const next = rows[0].is_active ? 0 : 1;
    await pool.query("UPDATE coupons SET is_active = ? WHERE id = ?", [next, req.params.coupon_id]);
    const [updated] = await pool.query("SELECT * FROM coupons WHERE id = ? LIMIT 1", [req.params.coupon_id]);
    res.json(publicCoupon(updated[0]));
  })
);

// ---------- Wilayas (delivery pricing) ----------
router.get(
  "/wilayas",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM wilayas ORDER BY code");
    res.json(
      rows.map((w) => ({
        code: w.code,
        name: w.name,
        home_price: Number(w.home_price),
        office_price: Number(w.office_price),
        is_active: Boolean(w.is_active),
      }))
    );
  })
);

router.post(
  "/wilayas",
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const code = String(b.code || "").trim().padStart(2, "0");
    const name = String(b.name || "").trim();
    if (!code || !name) throw new HttpError(400, "Code et nom requis");
    const homePrice = parseFloat(b.home_price ?? 600);
    const officePrice = parseFloat(b.office_price ?? 400);
    if (isNaN(homePrice) || homePrice < 0) throw new HttpError(400, "Prix domicile invalide");
    if (isNaN(officePrice) || officePrice < 0) throw new HttpError(400, "Prix bureau invalide");
    const [existing] = await pool.query("SELECT code FROM wilayas WHERE code = ? LIMIT 1", [code]);
    if (existing.length) throw new HttpError(400, "Ce code wilaya existe déjà");
    await pool.query(
      "INSERT INTO wilayas (code, name, home_price, office_price, is_active) VALUES (?, ?, ?, ?, 1)",
      [code, name, homePrice, officePrice]
    );
    const [rows] = await pool.query("SELECT * FROM wilayas WHERE code = ? LIMIT 1", [code]);
    const w = rows[0];
    res.status(201).json({
      code: w.code, name: w.name,
      home_price: Number(w.home_price), office_price: Number(w.office_price),
      is_active: Boolean(w.is_active),
    });
  })
);

router.put(
  "/wilayas/:code",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const homePrice = parseFloat(b.home_price);
    const officePrice = parseFloat(b.office_price);
    if (!name) throw new HttpError(400, "Nom requis");
    if (isNaN(homePrice) || homePrice < 0) throw new HttpError(400, "Prix domicile invalide");
    if (isNaN(officePrice) || officePrice < 0) throw new HttpError(400, "Prix bureau invalide");
    const isActive = b.is_active === undefined ? true : Boolean(b.is_active);
    const [result] = await pool.query(
      "UPDATE wilayas SET name = ?, home_price = ?, office_price = ?, is_active = ? WHERE code = ?",
      [name, homePrice, officePrice, isActive ? 1 : 0, code]
    );
    if (result.affectedRows === 0) throw new HttpError(404, "Wilaya introuvable");
    const [rows] = await pool.query("SELECT * FROM wilayas WHERE code = ? LIMIT 1", [code]);
    const w = rows[0];
    res.json({
      code: w.code, name: w.name,
      home_price: Number(w.home_price), office_price: Number(w.office_price),
      is_active: Boolean(w.is_active),
    });
  })
);

router.delete(
  "/wilayas/:code",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const [result] = await pool.query("DELETE FROM wilayas WHERE code = ?", [code]);
    if (result.affectedRows === 0) throw new HttpError(404, "Wilaya introuvable");
    res.json({ message: "Wilaya supprimée" });
  })
);

module.exports = router;
