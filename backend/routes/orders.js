const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { pool } = require("../config/db");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../utils/http");
const { nowIso } = require("../utils/helpers");
const { publicOrder } = require("../utils/models");
const { evaluateCoupon } = require("./coupons");

const router = express.Router();

const FREE_DELIVERY_THRESHOLD = 8000;

async function nextOrderNumber(conn) {
  const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM orders");
  const year = new Date().getUTCFullYear();
  return `FYN-${year}-${String(count + 1).padStart(5, "0")}`;
}

router.post(
  "/",
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

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const itemsSnapshot = [];
      let subtotal = 0;
      for (const item of items) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const [rows] = await conn.query(
          "SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1",
          [item.product_id]
        );
        const product = rows[0];
        if (!product) throw new HttpError(400, "Produit indisponible");
        if (product.stock < qty) {
          throw new HttpError(400, `Stock insuffisant pour ${product.name}`);
        }
        const unitPrice = Number(product.price);
        const lineTotal = Math.round(unitPrice * qty * 100) / 100;
        subtotal += lineTotal;
        let images = product.images;
        if (typeof images === "string") {
          try { images = JSON.parse(images); } catch { images = []; }
        }
        itemsSnapshot.push({
          product_id: product.id,
          product_name: product.name,
          product_image: Array.isArray(images) && images.length ? images[0] : null,
          shade: item.shade || null,
          unit_price: unitPrice,
          quantity: qty,
          total_price: lineTotal,
        });
      }
      subtotal = Math.round(subtotal * 100) / 100;

      let discountAmount = 0;
      let couponCode = null;
      let coupon = null;
      if (body.coupon_code) {
        const result = await evaluateCoupon(body.coupon_code, subtotal);
        coupon = result.coupon;
        discountAmount = result.discount;
        couponCode = coupon.code;
      }

      // Look up wilaya delivery price
      let baseDeliveryFee = deliveryType === "office" ? 400 : 600; // fallback defaults
      const [wilayaRows] = await conn.query(
        "SELECT home_price, office_price FROM wilayas WHERE name = ? AND is_active = 1 LIMIT 1",
        [delivery.wilaya]
      );
      if (wilayaRows[0]) {
        baseDeliveryFee = deliveryType === "office"
          ? Number(wilayaRows[0].office_price)
          : Number(wilayaRows[0].home_price);
      }
      const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseDeliveryFee;
      const total = Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100;

      const order = {
        id: uuidv4(),
        order_number: await nextOrderNumber(conn),
        user_id: req.user ? req.user.id : null,
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

      await conn.query(
        `INSERT INTO orders
         (id, order_number, user_id, status, customer_name, customer_phone, customer_email,
          wilaya, commune, address, delivery_notes, delivery_type, subtotal, delivery_fee,
          discount_amount, total, coupon_code, payment_method, notes, items, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.order_number, order.user_id, order.status, order.customer_name,
          order.customer_phone, order.customer_email, order.wilaya, order.commune, order.address,
          order.delivery_notes, order.delivery_type, order.subtotal, order.delivery_fee,
          order.discount_amount, order.total, order.coupon_code, order.payment_method, order.notes,
          JSON.stringify(order.items), order.created_at, order.updated_at,
        ]
      );

      for (const item of itemsSnapshot) {
        await conn.query(
          "UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?",
          [item.quantity, item.quantity, item.product_id]
        );
      }
      if (coupon) {
        await conn.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupon.id]);
      }

      await conn.commit();
      res.json(order);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
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
