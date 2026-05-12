const { createClient } = require('@supabase/supabase-js');
const express = require("express");
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/", async (req, res) => {
  try {
    console.log("🚚 SHIPBUBBLE WEBHOOK HIT");

    const event = req.body || {};
    const status = event?.status || event?.event || event?.data?.status;
    const tracking_id = event?.tracking_id || event?.data?.tracking_id;

    switch (status) {
      case "in_transit":
        console.log("🚛 Package is moving");

        if (tracking_id) {
          await supabase
            .from("orders")
            .update({ status: "shipped" })
            .eq("tracking_id", tracking_id);
        }
        break;

      case "delivered":
        console.log("📦 Package delivered");

        if (tracking_id) {
          await supabase
            .from("orders")
            .update({ status: "delivered", payment_status: "paid" })
            .eq("tracking_id", tracking_id);
        }
        break;

      case "failed":
        console.log("❌ Delivery failed");

        if (tracking_id) {
          await supabase
            .from("orders")
            .update({ status: "delivery_failed" })
            .eq("tracking_id", tracking_id);
        }
        break;

      default:
        console.log("ℹ️ Unknown event");
    }

    console.log("📩 SHIPBUBBLE EVENT RECEIVED:", {
      status,
      tracking_id,
      raw: event
    });
    return res.sendStatus(200);
  } catch (err) {
    console.log("❌ WEBHOOK ERROR:", err.message);
    return res.sendStatus(200);
  }
});

module.exports = router;