const { v4: uuidv4 } = require("uuid");
const { pool } = require("./config/db");
const { hashPassword, verifyPassword, nowIso } = require("./utils/helpers");

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

  // Seed wilayas — insert only the ones that are missing (upsert by code)
  // This is real reference data (Algeria's 58 provinces), required for
  // delivery pricing at checkout — not demo/mock content.
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
}

module.exports = { seedData, seedAdmin };
