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
        error: "Missing Easyship API configuration"
      });
    }

    console.log("🚚 EASYSHIP REQUEST", {
      base: BASE_URL,
      hasKey: !!EASYSHIP_KEY,
      country: address.country,
    });

    const response = await axios.post(
      `${BASE_URL}/rates`,
      {
        origin_country_alpha2: "NG",
        destination_country_alpha2: address.country || "NG",

        destination_address: {
          address_line_1:
            typeof address === "string"
              ? address
              : address.address_line_1 || "",
          city: address.city || "Toronto",
          state: address.state || "ON",
          postal_code: address.postal_code || "M5H 2M9",
          country_alpha2: address.country || "NG"
        },

        parcels: [
          {
            total_actual_weight: Math.max(
              0.5,
              items?.reduce((sum, i) => sum + (Number(i.qty) || 1), 0) || 1
            )
          }
        ]
      },
      {
        headers: {
          Authorization: EASYSHIP_KEY.startsWith("Bearer ")
            ? EASYSHIP_KEY
            : `Bearer ${EASYSHIP_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );

    const rates = response.data?.rates || response.data?.data?.rates || [];

    const shipping_fee =
      rates.length > 0
        ? Math.min(...rates.map(r => r.total_charge || 0))
        : 0;

    return res.json({
      success: true,
      shipping_fee,
      raw: response.data
    });

  } catch (err) {
    console.log("❌ SHIPPING ERROR:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    return res.status(500).json({
      success: false,
      error: "Shipping failed"
    });
  }
});

module.exports = router;