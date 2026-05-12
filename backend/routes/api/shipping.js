const express = require("express");
const shippoLib = require("shippo");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { address = {}, items = [] } = req.body;

    const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

    if (!SHIPPO_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing Shippo API key",
      });
    }

    const shippo = shippoLib(SHIPPO_API_KEY);

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

      return "CA"; // safe default
    })();

    const destination = {
      address_line_1: isStringAddress
        ? address
        : address.address_line_1 || "",
      city: (!isStringAddress && address.city) || "Toronto",
      state: (!isStringAddress && address.state) || "",
      postal_code: (!isStringAddress && address.postal_code) || "",
      country_alpha2: country,
    };

    console.log("🚚 SHIPPO RATE REQUEST", {
      country,
      city: destination.city,
      hasKey: !!SHIPPO_API_KEY,
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
    // SHIPPO RATES API
    // =========================
    const shipment = await shippo.shipment.create({
      address_from: {
        name: "Velra",
        street1: "Toronto",
        city: "Toronto",
        state: "ON",
        zip: "M5V3L9",
        country: "CA",
      },

      address_to: {
        name: "Customer",
        street1: destination.address_line_1 || "Unknown",
        city: destination.city || "Toronto",
        state: destination.state || "ON",
        zip: destination.postal_code || "M5V3L9",
        country: country,
      },

      parcels: [
        {
          length: "10",
          width: "10",
          height: "5",
          distance_unit: "in",
          weight: weight,
          mass_unit: "lb",
        },
      ],

      async: false,
    });

    const rates = shipment.rates || [];

    const validRates = Array.isArray(rates)
      ? rates.filter((r) => Number(r.amount) > 0)
      : [];

    let shipping_fee = null;
    let source = "shippo";

    if (validRates.length > 0) {
      shipping_fee = Math.min(
        ...validRates.map((r) => Number(r.amount))
      );
    } else {
      shipping_fee = 15;
      source = "fallback";
    }

    return res.json({
      success: true,
      shipping_fee: Math.max(shipping_fee, 15),
      source,
      rates_count: validRates.length,
      weight,
      currency: "USD",
      courier: validRates[0]?.provider || "Shippo",
      estimated_days:
        validRates[0]?.estimated_days || null,
    });
  } catch (err) {
    console.log("❌ SHIPPO ERROR:", err.message);

    // fallback response (never break checkout)
    return res.json({
      success: false,
      shipping_fee: 15,
      error: "shipping_unavailable",
      source: "fallback_error",
    });
  }
});

module.exports = router;