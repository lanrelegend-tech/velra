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

    let shippingFee = null;

    // 🚀 TRY SHIPPO FIRST (REAL SHIPPING RATES)
    try {
      const shippo = require("shippo")(process.env.SHIPPO_API_KEY);

      const totalWeight = items.reduce((sum, item) => {
        const weight = item.weight || 0.5;
        return sum + weight * (item.qty || 1);
      }, 0);

      const shipment = await shippo.shipments.create({
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
          country: destination.country || "CA",
        },

        parcels: [
          {
            length: "10",
            width: "10",
            height: "5",
            distance_unit: "in",
            weight: totalWeight,
            mass_unit: "lb",
          },
        ],

        async: false,
      });

      console.log("SHIPPO RESPONSE:", JSON.stringify(shipment, null, 2));

      const rates = shipment?.rates;

      if (!Array.isArray(rates) || rates.length === 0) {
        console.log("❌ EMPTY RATES FROM SHIPPO:", shipment);
        throw new Error("NO_SHIPPO_RATES_RETURNED");
      }

      const cheapest = rates.reduce((min, rate) => {
        const a = Number(rate.amount || rate.price || 999999);
        const b = Number(min.amount || min.price || 999999);
        return a < b ? rate : min;
      });

      shippingFee = Number(cheapest.amount || cheapest.price);

    } catch (err) {
      console.log("Shippo rates failed, using fallback:", err.message);
      console.log("Shippo debug error:", err);
    }

    // 🧠 STRICT FALLBACK (ONLY IF API FAILS COMPLETELY)
    if (!shippingFee) {
      const totalWeight = items.reduce((sum, item) => {
        const weight = item.weight || 0.5;
        return sum + weight * (item.qty || 1);
      }, 0);

      shippingFee = 15;

      if (totalWeight > 2) shippingFee = 20;
      if (totalWeight > 5) shippingFee = 30;
      if (totalWeight > 10) shippingFee = 50;

      if (destination?.country && destination.country !== "CA") {
        shippingFee += 25;
      }

      if (deliveryOption === "express") {
        shippingFee += 15;
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
