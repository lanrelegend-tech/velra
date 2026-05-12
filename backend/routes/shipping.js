const express = require("express");
const router = express.Router();

router.post("/shipping-price", async (req, res) => {
  try {
    const { address, items } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Delivery address is required" });
    }

    const response = await fetch(
      "https://api.shipbubble.com/v1/shipping/rates",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SHIPBUBBLE_SANDBOX_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: process.env.SHIPBUBBLE_STORE_ID || undefined,

          pickup_address: {
            name: "Velra Store",
            address: "Lagos, Nigeria",
            phone: process.env.STORE_PHONE || "0000000000"
          },

          delivery_address: {
            address: address
          },

          package: {
            description: "Fashion order",
            weight: items?.length || 1,
            quantity: items?.length || 1
          }
        }),
      }
    );

    const data = await response.json();

    return res.json({
      success: true,
      shipping_fee: data?.price || data?.data?.price || 0,
      raw: data
    });
  } catch (err) {
    console.log("❌ SHIPPING ERROR:", {
      message: err.message,
      response: err.response?.data || null
    });
    return res.status(500).json({ error: "Shipping calculation failed" });
  }
});

module.exports = router;