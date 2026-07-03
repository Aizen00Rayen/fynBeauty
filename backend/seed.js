const { v4: uuidv4 } = require("uuid");
const { pool } = require("./config/db");
const { hashPassword, verifyPassword, nowIso } = require("./utils/helpers");

// Neutral, royalty-free cosmetic imagery (Unsplash). No third-party platform assets.
const IMG = {
  lipstick: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  rosegold: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  pinkset: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  flatlay: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  editorial1: "https://images.unsplash.com/photo-1596205521983-9c372fb3d4f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  editorial2: "https://images.unsplash.com/photo-1592574083647-6d7c37d81535?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

const CATEGORIES = [
  { name: "Lèvres", slug: "levres", sort_order: 1, image_url: IMG.lipstick },
  { name: "Yeux", slug: "yeux", sort_order: 2, image_url: IMG.editorial2 },
  { name: "Teint", slug: "teint", sort_order: 3, image_url: IMG.flatlay },
  { name: "Sourcils", slug: "sourcils", sort_order: 4, image_url: IMG.editorial1 },
  { name: "Soins", slug: "soins", sort_order: 5, image_url: IMG.rosegold },
  { name: "Kits & Sets", slug: "kits-sets", sort_order: 6, image_url: IMG.pinkset },
];

function product(name, slug, desc, price, compare, cat, catName, stock, featured, imgs, sold, shades, tags) {
  return {
    id: uuidv4(),
    name,
    slug,
    description: desc,
    price,
    compare_price: compare,
    category_slug: cat,
    category_name: catName,
    images: imgs,
    stock,
    is_active: 1,
    is_featured: featured ? 1 : 0,
    tags: tags || [],
    shades: shades || [],
    sku: "FYN-" + slug.slice(0, 8).toUpperCase() + "-" + uuidv4().slice(0, 4).toUpperCase(),
    weight_grams: 50,
    sold_count: sold,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function buildProducts() {
  const L = IMG.lipstick, F = IMG.flatlay, P = IMG.pinkset, R = IMG.rosegold, E1 = IMG.editorial1, E2 = IMG.editorial2;
  const lipShades = [
    { name: "Sahara Rose", hex: "#C76B5A", stock: 18 },
    { name: "Casbah Red", hex: "#9E1B32", stock: 12 },
    { name: "Nude Alger", hex: "#C99685", stock: 9 },
    { name: "Prune Désert", hex: "#6E2A3E", stock: 6 },
  ];
  const foundationShades = [
    { name: "Sable Clair", hex: "#E8C4A0", stock: 10 },
    { name: "Doré Médium", hex: "#D2A579", stock: 14 },
    { name: "Ambre", hex: "#B07A4E", stock: 8 },
    { name: "Noisette", hex: "#8C5A38", stock: 5 },
  ];
  const eyeShades = [
    { name: "Noir Khôl", hex: "#1C1C1E", stock: 30 },
    { name: "Brun Henné", hex: "#5A3825", stock: 20 },
  ];
  return [
    product("Rouge à Lèvres Velours Sahara", "rouge-a-levres-velours-sahara",
      "Un rouge à lèvres longue tenue d'une texture velours unique. Inspiré des couchers de soleil sur le Sahara, sa formule enrichie à l'huile d'argan sublime et hydrate les lèvres toute la journée.",
      890, 1200, "levres", "Lèvres", 45, true, [L, P], 127, lipShades, ["bestseller", "longue-tenue"]),
    product("Crayon Yeux Khôl Intense", "crayon-yeux-khol-intense",
      "Le khôl traditionnel revisité pour un regard intense et envoûtant. Tenue 24h garantie, application crémeuse et précise.",
      650, null, "yeux", "Yeux", 80, false, [E2, F], 89, eyeShades, ["khol", "24h"]),
    product("Fond de Teint Sable d'Or", "fond-de-teint-sable-dor",
      "Couvrance naturelle adaptée aux carnations méditerranéennes. FPS 20 inclus pour une protection quotidienne et un fini lumineux.",
      1450, 1800, "teint", "Teint", 30, true, [F, R], 203, foundationShades, ["fps20", "naturel"]),
    product("Palette Yeux Désert Rose", "palette-yeux-desert-rose",
      "9 teintes inspirées du désert algérien. Du nude au fard charbonneux, des textures mates et satinées ultra-pigmentées.",
      2200, 2800, "yeux", "Yeux", 20, true, [P, E1], 156, [], ["palette", "9-teintes"]),
    product("Gloss Lèvres Oasis", "gloss-levres-oasis",
      "Gloss brillant non poisseux avec soin hydratant à l'huile d'argan. Un fini miroir pour des lèvres repulpées.",
      750, null, "levres", "Lèvres", 60, false, [L, E2], 72, [], ["gloss", "argan"]),
    product("Mascara Volume Noir Nuit", "mascara-volume-noir-nuit",
      "Un volume spectaculaire dès la première application. Brosse ergonomique pour des cils intenses sans paquets.",
      980, 1200, "yeux", "Yeux", 50, true, [E2, F], 98, [], ["volume", "mascara"]),
    product("Crème Hydratante Argan", "creme-hydratante-argan",
      "Soin visage à l'huile d'argan pure d'Algérie. Hydratation intense 48h pour une peau douce et éclatante.",
      1650, null, "soins", "Soins", 40, false, [R, F], 64, [], ["argan", "hydratant"]),
    product("Gel Sourcils Définition", "gel-sourcils-definition",
      "Discipline et structure vos sourcils toute la journée avec une fixation naturelle et un fini non collant.",
      590, null, "sourcils", "Sourcils", 70, false, [F, E1], 41, [], ["sourcils"]),
    product("Kit Découverte Fyn", "kit-decouverte-fyn",
      "L'essentiel Fyn Beauty en un coffret : rouge à lèvres, mascara, gloss et fond de teint. Le cadeau parfait.",
      3900, 5200, "kits-sets", "Kits & Sets", 25, true, [P, F], 88, [], ["coffret", "cadeau"]),
    product("Highlighter Lueur d'Or", "highlighter-lueur-dor",
      "Un enlumineur poudre aux reflets dorés rose. Sublime les pommettes d'un halo lumineux et sophistiqué.",
      1100, null, "teint", "Teint", 55, false, [R, P], 77, [], ["highlighter"]),
    product("Rouge à Lèvres Mat Casbah", "rouge-a-levres-mat-casbah",
      "Un fini mat velouté longue tenue, confortable et ultra-pigmenté. La couleur intense des médinas algériennes.",
      920, null, "levres", "Lèvres", 38, false, [L, E2], 110, lipShades, ["mat", "pigmente"]),
    product("Sérum Éclat Rose", "serum-eclat-rose",
      "Sérum visage à l'eau de rose et vitamine C. Illumine le teint et réduit les signes de fatigue jour après jour.",
      2400, 2900, "soins", "Soins", 28, true, [R, F], 95, [], ["serum", "vitamine-c"]),
  ];
}

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@fynbeauty.store").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "adminoussamafyn2026";

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [adminEmail]);
  const existing = rows[0];
  if (!existing) {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, wilaya, address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), adminEmail, hashPassword(adminPassword), "Fyn Admin", null, "admin", "Alger", null, nowIso()]
    );
    console.log(`[seed] Admin account created: ${adminEmail}`);
  } else if (existing.role !== "admin" || !verifyPassword(adminPassword, existing.password_hash)) {
    await pool.query("UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?", [
      hashPassword(adminPassword),
      adminEmail,
    ]);
    console.log(`[seed] Admin account ensured: ${adminEmail}`);
  }
}

async function seedData() {
  await seedAdmin();

  const [[{ catCount }]] = await pool.query("SELECT COUNT(*) AS catCount FROM categories");
  if (catCount === 0) {
    for (const c of CATEGORIES) {
      await pool.query(
        "INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [uuidv4(), c.name, c.slug, "", c.image_url, c.sort_order]
      );
    }
  }

  const [[{ prodCount }]] = await pool.query("SELECT COUNT(*) AS prodCount FROM products");
  if (prodCount === 0) {
    for (const p of buildProducts()) {
      await pool.query(
        `INSERT INTO products
         (id, name, slug, description, price, compare_price, category_slug, category_name,
          images, stock, is_active, is_featured, tags, shades, sku, weight_grams, sold_count,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.name, p.slug, p.description, p.price, p.compare_price, p.category_slug,
          p.category_name, JSON.stringify(p.images), p.stock, p.is_active, p.is_featured,
          JSON.stringify(p.tags), JSON.stringify(p.shades), p.sku, p.weight_grams, p.sold_count,
          p.created_at, p.updated_at,
        ]
      );
    }
  }

  // Seed wilayas — insert only the ones that are missing (upsert by code)
  const [[{ wilayaCount }]] = await pool.query("SELECT COUNT(*) AS wilayaCount FROM wilayas");
  if (wilayaCount === 0) {
    const WILAYAS = [
      ["01","Adrar"],["02","Chlef"],["03","Laghouat"],["04","Oum El Bouaghi"],
      ["05","Batna"],["06","Béjaïa"],["07","Biskra"],["08","Béchar"],
      ["09","Blida"],["10","Bouira"],["11","Tamanrasset"],["12","Tébessa"],
      ["13","Tlemcen"],["14","Tiaret"],["15","Tizi Ouzou"],["16","Alger"],
      ["17","Djelfa"],["18","Jijel"],["19","Sétif"],["20","Saïda"],
      ["21","Skikda"],["22","Sidi Bel Abbès"],["23","Annaba"],["24","Guelma"],
      ["25","Constantine"],["26","Médéa"],["27","Mostaganem"],["28","M'Sila"],
      ["29","Mascara"],["30","Ouargla"],["31","Oran"],["32","El Bayadh"],
      ["33","Illizi"],["34","Bordj Bou Arréridj"],["35","Boumerdès"],["36","El Tarf"],
      ["37","Tindouf"],["38","Tissemsilt"],["39","El Oued"],["40","Khenchela"],
      ["41","Souk Ahras"],["42","Tipaza"],["43","Mila"],["44","Aïn Defla"],
      ["45","Naâma"],["46","Aïn Témouchent"],["47","Ghardaïa"],["48","Relizane"],
      ["49","El M'Ghair"],["50","El Meniaa"],["51","Ouled Djellal"],["52","Bordj Baji Mokhtar"],
      ["53","Béni Abbès"],["54","Timimoun"],["55","Touggourt"],["56","Djanet"],
      ["57","In Salah"],["58","In Guezzam"],
    ];
    for (const [code, name] of WILAYAS) {
      await pool.query(
        "INSERT OR IGNORE INTO wilayas (code, name, home_price, office_price, is_active) VALUES (?, ?, 600.00, 400.00, 1)",
        [code, name]
      );
    }
    console.log("[seed] Wilayas seeded (58 wilayas, default home=600 / office=400 DZD)");
  }

  const [[{ couponCount }]] = await pool.query("SELECT COUNT(*) AS couponCount FROM coupons");
  if (couponCount === 0) {
    const now = nowIso();
    const coupons = [
      ["FYNE20", "Bienvenue chez Fyn Beauty — 20% de réduction", "percentage", 20, 2000, 100],
      ["LIVRAISON", "Livraison gratuite (-500 DZD)", "fixed", 500, 3000, null],
      ["VIP500", "VIP — 500 DZD de réduction", "fixed", 500, 5000, 50],
    ];
    for (const [code, description, type, value, minOrder, maxUses] of coupons) {
      await pool.query(
        `INSERT INTO coupons
         (id, code, description, discount_type, discount_value, min_order_amount, max_uses,
          used_count, is_active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NULL, ?)`,
        [uuidv4(), code, description, type, value, minOrder, maxUses, now]
      );
    }
  }
}

module.exports = { seedData, seedAdmin };
