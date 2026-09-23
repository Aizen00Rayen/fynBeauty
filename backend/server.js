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
const { UPLOAD_DIR, DB_PATH } = require("./config/db");
const { HttpError } = require("./utils/http");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const { router: couponRoutes } = require("./routes/coupons");
const adminRoutes = require("./routes/admin");
const wilayaRoutes = require("./routes/wilayas");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.warn(
      "[boot] WARNING: JWT_SECRET is unset or shorter than 32 characters in production. " +
      "Using a secure fallback secret. Please define JWT_SECRET in your Hostinger environment variables!"
    );
    process.env.JWT_SECRET = process.env.JWT_SECRET || "fynbeauty_production_secret_key_algeria_2026_super_secure_fallback";
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
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/api/uploads", express.static(UPLOAD_DIR));

// Single-app deployment: serve the compiled React app if we can find it.
// Hosting layouts vary (whole repo vs. just backend/ as the app root, build
// copied next to server.js, etc.), so check every common location and use the
// first that actually contains an index.html. An explicit FRONTEND_BUILD_DIR
// env var always wins if set.
const FRONTEND_BUILD_CANDIDATES = [
  process.env.FRONTEND_BUILD_DIR,
  path.join(__dirname, "..", "frontend", "build"), // repo layout: backend/ and frontend/ are siblings
  path.join(__dirname, "frontend", "build"), // frontend nested inside the backend/app root
  path.join(__dirname, "build"), // build copied next to server.js
  path.join(__dirname, "public"), // build copied to backend/public
  path.join(process.cwd(), "frontend", "build"), // relative to the process working directory
  path.join(process.cwd(), "build"),
].filter(Boolean);

const FRONTEND_BUILD = FRONTEND_BUILD_CANDIDATES.find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
);

function syncToPublicHtml(sourceDir) {
  if (!sourceDir) return null;
  const candidates = [
    path.resolve(__dirname, "../../../../public_html"),
    path.resolve(__dirname, "../../../public_html"),
    path.resolve(__dirname, "../../public_html"),
    path.resolve(process.cwd(), "../../../../public_html"),
    path.resolve(process.cwd(), "../../public_html"),
  ];
  for (const pub of candidates) {
    if (fs.existsSync(pub) && fs.statSync(pub).isDirectory()) {
      try {
        console.log(`[boot] Syncing frontend build to ${pub}...`);
        fs.cpSync(sourceDir, pub, { recursive: true, force: true });
        console.log(`[boot] Successfully synced frontend build to ${pub}`);
        return pub;
      } catch (err) {
        console.warn(`[boot] Could not sync to ${pub}:`, err.message);
      }
    }
  }
  return null;
}

app.get("/api/", (req, res) => {
  res.json({ message: "Fyn Beauty API", status: "ok" });
});

function findSqliteFiles(startDir, maxDepth = 5, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth || !fs.existsSync(startDir)) return results;
  try {
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(startDir, entry.name);
      if (entry.isFile() && (entry.name.endsWith(".sqlite") || entry.name.endsWith(".db"))) {
        try {
          const stat = fs.statSync(fullPath);
          results.push({ path: fullPath, size: stat.size, mtime: stat.mtime });
        } catch {}
      } else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
        results.push(...findSqliteFiles(fullPath, maxDepth, currentDepth + 1));
      }
    }
  } catch {}
  return results;
}

// Deployment diagnostic: shows located frontend files, public_html sync, and sqlite discovery
app.get("/api/status", (req, res) => {
  const hbuildsVersionsDir = path.resolve(__dirname, "../../"); // .../hbuilds/versions
  let versions = [];
  try {
    if (fs.existsSync(hbuildsVersionsDir)) {
      versions = fs.readdirSync(hbuildsVersionsDir).map((v) => {
        const vDir = path.join(hbuildsVersionsDir, v);
        const sqliteFile = path.join(vDir, "nodejs", "data", "fynbeauty.sqlite");
        const uploadsDir = path.join(vDir, "nodejs", "uploads");
        return {
          version: v,
          hasSqlite: fs.existsSync(sqliteFile),
          sqliteSize: fs.existsSync(sqliteFile) ? fs.statSync(sqliteFile).size : 0,
          sqliteMtime: fs.existsSync(sqliteFile) ? fs.statSync(sqliteFile).mtime : null,
          uploadsCount: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0,
        };
      });
    }
  } catch {}

  const domainRoot = path.resolve(__dirname, "../../../..");
  const allSqlite = findSqliteFiles(domainRoot, 6);

  res.json({
    currentDbPath: DB_PATH,
    currentDbSize: fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH).size : 0,
    currentUploadsDir: UPLOAD_DIR,
    uploadsCount: fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).length : 0,
    hbuildsVersions: versions,
    foundSqliteFiles: allSqlite,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wilayas", wilayaRoutes);

if (FRONTEND_BUILD) {
  console.log(`[boot] Serving frontend build from: ${FRONTEND_BUILD}`);
  syncToPublicHtml(FRONTEND_BUILD);
  app.use("/assets", express.static(FRONTEND_BUILD));
  app.use(express.static(FRONTEND_BUILD));
  app.use("/static", express.static(path.join(FRONTEND_BUILD, "static")));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
} else {
  // API-only: no build found anywhere. Log where we looked so the layout can be
  // diagnosed from the host's application logs, and send "/" to the API info
  // route instead of a 404.
  console.warn(
    "[boot] No frontend build found. Serving API only. " +
    `__dirname=${__dirname} cwd=${process.cwd()} ` +
    `checked=[${FRONTEND_BUILD_CANDIDATES.join(" | ")}]`
  );
  app.get("/", (req, res) => res.redirect("/api/"));
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

const PORT = process.env.PORT ? (isNaN(Number(process.env.PORT)) ? process.env.PORT : Number(process.env.PORT)) : 8001;

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
