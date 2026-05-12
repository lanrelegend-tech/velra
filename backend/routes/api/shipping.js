const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { address = {}, items = [] } = req.body;

    const EASYSHIP_KEY = process.env.EASYSHIP_API_KEY;
    const BASE_URL = process.env.EASYSHIP_BASE_URL;

    if (!EASYSHIP_KEY || !BASE_URL) {
      return res.status(500).json({
        success: false,
        error: "Missing Easyship API configuration",
      });
    }

    // =========================
    // SAFE ADDRESS NORMALIZATION
    // =========================
    const isStringAddress = typeof address === "string";

    const country =
      (!isStringAddress && address.country) ||
      (address.postal_code && address.postal_code.startsWith("M"))
        ? "CA"
        : "NG";

    const destination = {
      address_line_1: isStringAddress
        ? address
        : address.address_line_1 || "",
      city: (!isStringAddress && address.city) || "Lagos",
      state: (!isStringAddress && address.state) || "",
      postal_code: (!isStringAddress && address.postal_code) || "",
      country_alpha2: country,
    };

    console.log("🚚 EASYSHIP RATE REQUEST", {
      base: BASE_URL,
      country,
      city: destination.city,
      hasKey: !!EASYSHIP_KEY,
    });

    // =========================
    // WEIGHT CALCULATION
    // =========================
    const weight = Math.max(
      0.5,
      (items || []).reduce(
        (sum, i) => sum + (Number(i.qty || 1) * 0.5),
        0
      )
    );

    const response = await axios.post(
      `${BASE_URL}/rates`,
      {
        origin_country_alpha2: "NG",
        destination_country_alpha2: destination.country_alpha2,

        destination_address: destination,

        parcels: [
          {
            total_actual_weight: weight,
          },
        ],
      },
      {
        headers: {
          Authorization: EASYSHIP_KEY.startsWith("Bearer ")
            ? EASYSHIP_KEY
            : `Bearer ${EASYSHIP_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const rates = response.data?.rates || response.data?.data?.rates || [];

    const shipping_fee =
      rates.length > 0
        ? Math.min(...rates.map((r) => r.total_charge || 0))
        : 0;

    return res.json({
      success: true,
      shipping_fee,
      rates_count: rates.length,
      raw: response.data,
    });
  } catch (err) {
    console.log("❌ SHIPPING ERROR:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    return res.status(500).json({
      success: false,
      error: "Shipping failed",
    });
  }
});

module.exports = router;