const express = require("express");
const router = express.Router();

// 📦 SHIPPING PRICE CALCULATION ROUTE
router.post("/", async (req, res) => {
  try {
    const { origin_country, destination, items, deliveryOption } = req.body;

    if (!destination || !items) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // 🚀 TRY EASYSHIP FIRST (REAL SHIPPING RATES)
    let shippingFee = null;

    try {
      const easyshipRes = await fetch("https://public-api.easyship.com/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.EASYSHIP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          origin_country: origin_country || "CA",
          destination: {
            country: destination.country,
            city: destination.city,
            state: destination.state,
            postal_code: destination.postal_code,
            address_line_1: destination.address_line_1,
          },
          parcels: items.map((item) => ({
            weight: item.weight || 0.5,
            quantity: item.qty || 1,
          })),
        }),
      });

      const easyshipData = await easyshipRes.json();

      // try to extract cheapest rate safely
      const rates = easyshipData?.rates || easyshipData?.data?.rates;

      if (rates && rates.length > 0) {
        shippingFee = Number(rates[0].total_charge || rates[0].price || rates[0].rate);
      }
    } catch (err) {
      console.log("Easyship rates failed, using fallback:", err.message);
    }

    // 🧠 FALLBACK IF EASYSHIP FAILS
    if (!shippingFee) {
      const totalWeight = items.reduce((sum, item) => {
        const weight = item.weight || 0.5;
        return sum + weight * (item.qty || 1);
      }, 0);

      shippingFee = 10;

      if (totalWeight > 2) shippingFee = 15;
      if (totalWeight > 5) shippingFee = 25;
      if (totalWeight > 10) shippingFee = 40;

      if (destination?.country && destination.country !== "CA") {
        shippingFee += 20;
      }

      if (deliveryOption === "express") {
        shippingFee += 10;
      }
    }

    return res.json({
      shipping_fee: shippingFee,
      currency: "USD",
    });
  } catch (error) {
    console.error("Shipping price error:", error);
    return res.status(500).json({
      error: "Failed to calculate shipping price",
    });
  }
});

module.exports = router;
