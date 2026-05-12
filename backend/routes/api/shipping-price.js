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

    // 🔢 Calculate total weight (fallback if no weight provided)
    const totalWeight = items.reduce((sum, item) => {
      const weight = item.weight || 0.5; // default 0.5kg per item
      return sum + weight * (item.qty || 1);
    }, 0);

    // 💰 Base pricing logic (simple MVP pricing)
    let shippingFee = 10;

    // weight-based increase
    if (totalWeight > 2) shippingFee = 15;
    if (totalWeight > 5) shippingFee = 25;
    if (totalWeight > 10) shippingFee = 40;

    // 🚚 delivery option adjustment
    if (deliveryOption === "express") {
      shippingFee += 10;
    }

    // 📍 simple country logic (expand later with real API like Easyship/Shippo)
    if (destination?.country && destination.country !== "CA") {
      shippingFee += 20;
    }

    return res.json({
      shipping_fee: shippingFee,
      currency: "USD",
      total_weight: totalWeight,
    });
  } catch (error) {
    console.error("Shipping price error:", error);
    return res.status(500).json({
      error: "Failed to calculate shipping price",
    });
  }
});

module.exports = router;
