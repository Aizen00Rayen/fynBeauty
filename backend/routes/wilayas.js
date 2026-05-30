const express = require("express");
const { pool } = require("../config/db");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

// GET /wilayas — public, returns all active wilayas with delivery prices
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT code, name, home_price, office_price FROM wilayas WHERE is_active = 1 ORDER BY code"
    );
    res.json(
      rows.map((w) => ({
        code: w.code,
        name: w.name,
        home_price: Number(w.home_price),
        office_price: Number(w.office_price),
      }))
    );
  })
);

module.exports = router;
