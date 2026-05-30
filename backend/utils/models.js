const { parseJson } = require("./helpers");

// Convert a raw DB product row into the JSON shape the frontend expects.
function publicProduct(row) {
  if (!row) return row;
  return {
    ...row,
    price: row.price === null ? null : Number(row.price),
    compare_price: row.compare_price === null ? null : Number(row.compare_price),
    images: parseJson(row.images, []),
    tags: parseJson(row.tags, []),
    shades: parseJson(row.shades, []),
    is_active: !!row.is_active,
    is_featured: !!row.is_featured,
  };
}

function publicOrder(row) {
  if (!row) return row;
  return {
    ...row,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    discount_amount: Number(row.discount_amount),
    total: Number(row.total),
    items: parseJson(row.items, []),
  };
}

function publicCoupon(row) {
  if (!row) return row;
  return {
    ...row,
    discount_value: Number(row.discount_value),
    min_order_amount: Number(row.min_order_amount),
    is_active: !!row.is_active,
  };
}

function publicCategory(row) {
  if (!row) return row;
  return { ...row };
}

// Strip sensitive fields from a user row before returning it.
function publicUser(row) {
  if (!row) return row;
  const u = { ...row };
  delete u.password_hash;
  return u;
}

module.exports = {
  publicProduct,
  publicOrder,
  publicCoupon,
  publicCategory,
  publicUser,
};
