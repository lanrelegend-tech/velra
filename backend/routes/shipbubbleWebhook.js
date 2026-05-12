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
    const statusRaw = event?.status || event?.event || event?.data?.status;
    const tracking_id = event?.tracking_id || event?.data?.tracking_id;

    const status = (statusRaw || "").toLowerCase();

    console.log("📩 NORMALIZED STATUS:", status);
    console.log("📦 TRACKING ID:", tracking_id);

    if (!tracking_id) {
      console.log("⚠️ Missing tracking_id in webhook");
      return res.sendStatus(200);
    }

    const updateOrder = async (payload) => {
      const { error } = await supabase
        .from("orders")
        .update(payload)
        .eq("tracking_id", tracking_id);

      if (error) {
        console.log("❌ SUPABASE UPDATE ERROR:", error.message);
      }
    };

    if (status === "in_transit" || status === "shipped") {
      console.log("🚛 Package is moving");

      await updateOrder({ status: "shipped" });
    }

    else if (status === "delivered") {
      console.log("📦 Package delivered");

      await updateOrder({
        status: "delivered",
        payment_status: "paid"
      });
    }

    else if (status === "failed" || status === "delivery_failed") {
      console.log("❌ Delivery failed");

      await updateOrder({ status: "delivery_failed" });
    }

    else {
      console.log("ℹ️ Unknown event:", status);
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