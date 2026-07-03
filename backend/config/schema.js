const { db } = require("./db");

// Creates all tables (and indexes) if they do not already exist. Safe to run on every boot.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    wilaya VARCHAR(100) NULL,
    address TEXT NULL,
    created_at VARCHAR(40) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)`,

  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    compare_price DECIMAL(12,2) NULL,
    category_slug VARCHAR(255) NULL,
    category_name VARCHAR(255) NULL,
    images TEXT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    tags TEXT NULL,
    shades TEXT NULL,
    sku VARCHAR(64) NULL,
    weight_grams INT NULL,
    sold_count INT NOT NULL DEFAULT 0,
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured)`,

  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL,
    user_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NULL,
    wilaya VARCHAR(100) NULL,
    commune VARCHAR(100) NULL,
    address TEXT NULL,
    delivery_notes TEXT NULL,
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'home',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(64) NULL,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'cash_on_delivery',
    notes TEXT NULL,
    items TEXT NULL,
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_wilaya ON orders (wilaya)`,

  `CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_uses INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    expires_at VARCHAR(40) NULL,
    created_at VARCHAR(40) NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, product_id)
  )`,

  `CREATE TABLE IF NOT EXISTS wilayas (
    code VARCHAR(3) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    home_price DECIMAL(10,2) NOT NULL DEFAULT 600.00,
    office_price DECIMAL(10,2) NOT NULL DEFAULT 400.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1
  )`,
];

async function initSchema() {
  for (const sql of STATEMENTS) {
    db.exec(sql);
  }
}

module.exports = { initSchema };
