const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { address = {}, items = [] } = req.body;

    const EASYSHIP_KEY = process.env.EASYSHIP_API_KEY;
    const BASE_URL = process.env.EASYSHIP_BASE_URL || "https://api.easyship.com";

    if (!EASYSHIP_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing Easyship API key",
      });
    }

    // =========================
    // SAFE ADDRESS NORMALIZATION
    // =========================
    const isStringAddress = typeof address === "string";

    const country = (() => {
      if (!isStringAddress && address.country) return address.country;

      if (!isStringAddress && address.postal_code) {
        const postal = String(address.postal_code).toUpperCase();

        // Canada postal code pattern (A1A)
        if (/^[A-Z]\d[A-Z]/.test(postal)) return "CA";
      }

      return "NG"; // safe default
    })();

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
      (items || []).reduce((sum, i) => {
        const qty = Number(i.qty || 1);
        const itemWeight = Number(i.weight || 0.5);
        return sum + qty * itemWeight;
      }, 0)
    );

    // =========================
    // EASYSHIP RATES API
    // =========================
    const response = await axios.post(
      `${BASE_URL}/2023-01/rates`,
      {
        origin_country_alpha2: "CA",
        destination_country_alpha2: country,
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

    const rates =
  response.data?.data?.rates ||
  response.data?.rates ||
  [];

    const validRates = Array.isArray(rates)
  ? rates.filter((r) => r?.total_charge > 0)
  : [];
    let shipping_fee = null;
    let source = "api";

    if (validRates.length > 0) {
      shipping_fee = Math.min(
        ...validRates.map((r) => Number(r.total_charge))
      );
    } else {
      // fallback ensures checkout never breaks
      shipping_fee = 15;
      source = "fallback";
    }

    return res.json({
      success: true,
      shipping_fee,
      source,
      rates_count: rates.length,
      weight,
      currency: "USD",
    });
  } catch (err) {
    console.log("❌ SHIPPING ERROR:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    // fallback response (never break checkout)
    return res.json({
      success: true,
      shipping_fee: 15,
      source: "fallback_error",
      error: "Easyship failed, using fallback rate",
    });
  }
});

module.exports = router;