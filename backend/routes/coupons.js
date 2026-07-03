const express = require("express");
const rateLimit = require("express-rate-limit");

const { db } = require("../config/db");
const { HttpError, asyncHandler } = require("../utils/http");
const { publicCoupon } = require("../utils/models");

const router = express.Router();

// Validates a coupon against an order amount. Synchronous (direct better-sqlite3
// calls) so it can also run inside the synchronous order-creation transaction
// in routes/orders.js. Returns { coupon, discount } or throws an HttpError.
function evaluateCouponSync(code, orderAmount) {
  const normalized = String(code || "").toUpperCase().trim();
  const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? LIMIT 1").get(normalized);
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

async function evaluateCoupon(code, orderAmount) {
  return evaluateCouponSync(code, orderAmount);
}

// Coupon codes are short and guessable — rate-limit validation attempts so
// they can't be brute-forced.
const validateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Trop de tentatives. Réessayez plus tard." },
});

router.post(
  "/validate",
  validateLimiter,
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

module.exports = { router, evaluateCoupon, evaluateCouponSync };
