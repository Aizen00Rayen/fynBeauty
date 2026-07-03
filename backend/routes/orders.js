const express = require("express");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

const { pool, db } = require("../config/db");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../utils/http");
const { nowIso } = require("../utils/helpers");
const { publicOrder } = require("../utils/models");
const { evaluateCouponSync } = require("./coupons");

const router = express.Router();

const FREE_DELIVERY_THRESHOLD = 8000;

const MAX_ITEM_QUANTITY = 50; // sanity cap per line — a legit customer order never needs more

// Keeps checkout accessible to guests while still bounding abuse (spam orders /
// stock-exhaustion via repeated fake carts).
const createOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Trop de commandes créées. Réessayez plus tard." },
});

// Runs entirely synchronously inside better-sqlite3's db.transaction() so the
// whole read-check-write sequence is one atomic unit with no interleaving —
// using the async mysql2-style pool.getConnection() API here would let other
// requests' queries interleave mid-transaction on SQLite's single connection.
function buildOrder({ items, customer, delivery, deliveryType, couponCode: rawCouponCode, userId }) {
  // Aggregate duplicate product_id lines before checking stock — otherwise two
  // lines for the same product could each pass the stock check individually
  // while together exceeding it (oversell / negative stock). The per-product
  // cap is enforced as a hard rejection afterwards, not a silent clamp, so it
  // can never mask the true requested quantity from the stock check below.
  const aggregated = new Map();
  for (const item of items) {
    const productId = String(item.product_id || "");
    if (!productId) throw new HttpError(400, "Produit invalide");
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const existing = aggregated.get(productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      aggregated.set(productId, { product_id: productId, quantity: qty, shade: item.shade || null });
    }
  }
  for (const entry of aggregated.values()) {
    if (entry.quantity > MAX_ITEM_QUANTITY) {
      throw new HttpError(400, "Quantité trop élevée pour un même produit");
    }
  }

  const itemsSnapshot = [];
  let subtotal = 0;
  for (const { product_id, quantity, shade } of aggregated.values()) {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1")
      .get(product_id);
    if (!product) throw new HttpError(400, "Produit indisponible");
    if (product.stock < quantity) {
      throw new HttpError(400, `Stock insuffisant pour ${product.name}`);
    }
    const unitPrice = Number(product.price);
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    subtotal += lineTotal;
    let images = product.images;
    if (typeof images === "string") {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    itemsSnapshot.push({
      product_id: product.id,
      product_name: product.name,
      product_image: Array.isArray(images) && images.length ? images[0] : null,
      shade: shade || null,
      unit_price: unitPrice,
      quantity,
      total_price: lineTotal,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;

  let discountAmount = 0;
  let couponCode = null;
  let coupon = null;
  if (rawCouponCode) {
    const result = evaluateCouponSync(rawCouponCode, subtotal);
    coupon = result.coupon;
    discountAmount = result.discount;
    couponCode = coupon.code;
  }

  let baseDeliveryFee = deliveryType === "office" ? 400 : 600; // fallback defaults
  const wilayaRow = db
    .prepare("SELECT home_price, office_price FROM wilayas WHERE name = ? AND is_active = 1 LIMIT 1")
    .get(delivery.wilaya);
  if (wilayaRow) {
    baseDeliveryFee = deliveryType === "office" ? Number(wilayaRow.office_price) : Number(wilayaRow.home_price);
  }
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseDeliveryFee;
  const total = Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100;

  const { count } = db.prepare("SELECT COUNT(*) AS count FROM orders").get();
  const year = new Date().getUTCFullYear();
  const orderNumber = `FYN-${year}-${String(count + 1).padStart(5, "0")}`;

  const order = {
    id: uuidv4(),
    order_number: orderNumber,
    user_id: userId,
    status: "pending",
    customer_name: customer.full_name,
    customer_phone: customer.phone,
    customer_email: customer.email || null,
    wilaya: delivery.wilaya,
    commune: delivery.commune || null,
    address: delivery.address,
    delivery_notes: delivery.delivery_notes || null,
    delivery_type: deliveryType,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    total,
    coupon_code: couponCode,
    payment_method: "cash_on_delivery",
    notes: null,
    items: itemsSnapshot,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  db.prepare(
    `INSERT INTO orders
     (id, order_number, user_id, status, customer_name, customer_phone, customer_email,
      wilaya, commune, address, delivery_notes, delivery_type, subtotal, delivery_fee,
      discount_amount, total, coupon_code, payment_method, notes, items, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    order.id, order.order_number, order.user_id, order.status, order.customer_name,
    order.customer_phone, order.customer_email, order.wilaya, order.commune, order.address,
    order.delivery_notes, order.delivery_type, order.subtotal, order.delivery_fee,
    order.discount_amount, order.total, order.coupon_code, order.payment_method, order.notes,
    JSON.stringify(order.items), order.created_at, order.updated_at
  );

  for (const item of itemsSnapshot) {
    db.prepare("UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?").run(
      item.quantity, item.quantity, item.product_id
    );
  }
  if (coupon) {
    db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?").run(coupon.id);
  }

  return order;
}

router.post(
  "/",
  createOrderLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    const delivery = body.delivery || {};

    const deliveryType = delivery.delivery_type === "office" ? "office" : "home";

    if (!items.length) throw new HttpError(400, "Panier vide");
    if (!customer.full_name || !customer.phone) {
      throw new HttpError(400, "Informations client incomplètes");
    }
    if (!delivery.wilaya || !delivery.address) {
      throw new HttpError(400, "Informations de livraison incomplètes");
    }

    const runInTransaction = db.transaction(buildOrder);
    const order = runInTransaction({
      items,
      customer,
      delivery,
      deliveryType,
      couponCode: body.coupon_code,
      userId: req.user ? req.user.id : null,
    });

    res.json(order);
  })
);

router.get(
  "/my",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
      [req.user.id]
    );
    res.json(rows.map(publicOrder));
  })
);

router.get(
  "/:order_id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [
      req.params.order_id,
    ]);
    const order = rows[0];
    if (!order) throw new HttpError(404, "Commande introuvable");

    // Orders tied to an account require the owner (or an admin) to be authenticated.
    // Guest orders (no user_id) stay reachable by their unguessable id for the
    // post-checkout confirmation page.
    if (order.user_id) {
      if (!req.user || (req.user.id !== order.user_id && req.user.role !== "admin")) {
        throw new HttpError(403, "Accès refusé");
      }
    }
    res.json(publicOrder(order));
  })
);

module.exports = router;
