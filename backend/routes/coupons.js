const express = require("express");

const { pool } = require("../config/db");
const { HttpError, asyncHandler } = require("../utils/http");
const { publicCoupon } = require("../utils/models");

const router = express.Router();

// Validates a coupon against an order amount. Returns { coupon, discount }
// or throws an HttpError. Shared with the orders route.
async function evaluateCoupon(code, orderAmount) {
  const normalized = String(code || "").toUpperCase().trim();
  const [rows] = await pool.query("SELECT * FROM coupons WHERE code = ? LIMIT 1", [normalized]);
  const coupon = rows[0];
  if (!coupon || !coupon.is_active) {
    throw new HttpError(400, "Code promo invalide ou expiré");
  }

  if (coupon.expires_at) {
    const exp = new Date(coupon.expires_at);
    if (!isNaN(exp.getTime()) && exp < new Date()) {
      throw new HttpError(400, "Code promo expiré");
    }
  }

  if (coupon.max_uses !== null && coupon.max_uses !== undefined && (coupon.used_count || 0) >= coupon.max_uses) {
    throw new HttpError(400, "Code promo épuisé");
  }

  const minOrder = Number(coupon.min_order_amount || 0);
  if (orderAmount < minOrder) {
    throw new HttpError(400, `Montant minimum requis : ${Math.trunc(minOrder)} DZD`);
  }

  let discount;
  if (coupon.discount_type === "percentage") {
    discount = Math.round(((orderAmount * Number(coupon.discount_value)) / 100) * 100) / 100;
  } else {
    discount = Number(coupon.discount_value);
  }
  discount = Math.min(discount, orderAmount);
  return { coupon, discount };
}

router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { coupon, discount } = await evaluateCoupon(body.code, Number(body.orderAmount || 0));
    res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      discountAmount: discount,
    });
  })
);

module.exports = { router, evaluateCoupon };
