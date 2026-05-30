const mysql = require("mysql2/promise");

// Connection pool. Configure via environment variables (see .env.example).
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  charset: "utf8mb4",
  // Always work with JSON columns as strings so behaviour is identical on
  // MySQL 8 (native JSON) and MariaDB (JSON == LONGTEXT). We parse manually.
  typeCast(field, next) {
    if (field.type === "JSON") {
      // Force UTF-8 so accented characters (French) in JSON columns are preserved.
      return field.string("utf8");
    }
    return next();
  },
});

module.exports = { pool };
