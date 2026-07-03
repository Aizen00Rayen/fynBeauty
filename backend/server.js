require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { initSchema } = require("./config/schema");
const { seedData } = require("./seed");
const { HttpError } = require("./utils/http");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const { router: couponRoutes } = require("./routes/coupons");
const adminRoutes = require("./routes/admin");
const wilayaRoutes = require("./routes/wilayas");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Fail fast rather than run with a missing/weak secret in production.
if (IS_PRODUCTION) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("[boot] JWT_SECRET must be set to a random string of at least 32 characters in production.");
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "adminoussamafyn2026") {
    console.warn(
      "[boot] WARNING: ADMIN_PASSWORD is unset or still the published default. " +
      "Set a unique ADMIN_PASSWORD before going live — the default is public in the project README."
    );
  }
  if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS.trim() === "*") {
    console.warn(
      "[boot] WARNING: CORS_ORIGINS is unset or '*' in production. Set it to your real domain(s)."
    );
  }
}

const app = express();
app.disable("x-powered-by");

// Hostinger (and most PaaS hosts) sit behind a reverse proxy — trust the first
// hop so req.ip / X-Forwarded-For are honored correctly (needed for rate limiting).
app.set("trust proxy", 1);

// Security headers. CSP and COEP are left off: the storefront loads product
// imagery from external URLs (Unsplash, admin-provided image URLs) and a
// strict default-src would silently break those without per-deployment
// tuning. The remaining headers (nosniff, frameguard, HSTS, referrer-policy,
// etc.) still apply.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan(IS_PRODUCTION ? "combined" : "dev"));

// CORS. Auth uses Bearer tokens (not cookies), so credentials are not required.
const corsOrigins = (process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: corsOrigins.includes("*") ? "*" : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "2mb" }));

// Baseline abuse protection across the whole API. Individual sensitive routes
// (auth, coupons, orders) layer tighter limits on top of this.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { detail: "Trop de requêtes. Réessayez plus tard." },
  })
);

// Static uploads (served under /api so a single ingress can route to the backend).
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/api/uploads", express.static(UPLOAD_DIR));

app.get("/", (req, res) => res.redirect("/api/"));
app.get("/api/", (req, res) => {
  res.json({ message: "Fyn Beauty API", status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wilayas", wilayaRoutes);

// Optionally serve the built React app (single-app deployment on Hostinger).
const FRONTEND_BUILD = path.join(__dirname, "..", "frontend", "build");
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
}

// Unknown API route -> JSON 404.
app.use("/api", (req, res) => {
  res.status(404).json({ detail: "Ressource introuvable" });
});

// Central error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ detail: err.detail });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ detail: "Image trop volumineuse (max 5 Mo)" });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(400).json({ detail: "Requête trop volumineuse" });
  }
  console.error("[error]", err);
  res.status(500).json({ detail: "Une erreur interne est survenue" });
});

const PORT = Number(process.env.PORT || 8001);

async function start() {
  try {
    await initSchema();
    await seedData();
    console.log("[boot] Schema and seed data ready");
  } catch (err) {
    console.error("[boot] Initialization error:", err.message);
  }
  app.listen(PORT, () => {
    console.log(`[boot] Fyn Beauty API listening on port ${PORT}`);
  });
}

start();

module.exports = app;
