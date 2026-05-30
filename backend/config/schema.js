const { pool } = require("./db");

// Creates all tables if they do not already exist. Safe to run on every boot.
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
    created_at VARCHAR(40) NOT NULL,
    INDEX idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    compare_price DECIMAL(12,2) NULL,
    category_slug VARCHAR(255) NULL,
    category_name VARCHAR(255) NULL,
    images JSON NULL,
    stock INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    tags JSON NULL,
    shades JSON NULL,
    sku VARCHAR(64) NULL,
    weight_grams INT NULL,
    sold_count INT NOT NULL DEFAULT 0,
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_products_category (category_slug),
    INDEX idx_products_active (is_active),
    INDEX idx_products_featured (is_featured)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(64) NULL,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'cash_on_delivery',
    notes TEXT NULL,
    items JSON NULL,
    created_at VARCHAR(40) NOT NULL,
    updated_at VARCHAR(40) NOT NULL,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_wilaya (wilaya)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS favorites (
    user_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS wilayas (
    code VARCHAR(3) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    home_price DECIMAL(10,2) NOT NULL DEFAULT 600.00,
    office_price DECIMAL(10,2) NOT NULL DEFAULT 400.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function initSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
  // Add delivery_type to orders if it doesn't exist yet (idempotent migration)
  try {
    await pool.query(
      "ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(20) NOT NULL DEFAULT 'home' AFTER delivery_notes"
    );
  } catch (e) {
    if (e.errno !== 1060) throw e; // 1060 = Duplicate column name (already exists)
  }
}

module.exports = { initSchema };
