const express = require("express");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async (to, subject, text) => {
  if (!resend) {
    console.log("RESEND DISABLED");
    return;
  }

  try {
    await resend.emails.send({
      from: "Velra Store <onboarding@resend.dev>",
      to,
      subject,
      text,
    });
  } catch (err) {
    console.log("RESEND ERROR:", err.message);
  }
};

// 🚚 SHIPPO TRACKING WEBHOOK
router.post("/", async (req, res) => {
  try {
    const event = req.body;

    console.log("🚚 SHIPPO WEBHOOK:", event);

    // 🔐 Shippo webhooks do NOT use x-webhook-secret header
    // Keep this simple unless signature verification is implemented
    const webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET;
    if (webhookSecret) {
      console.log("ℹ️ Webhook secret is set but not verified (Shippo requires signature verification for production)");
    }

    const status = (event?.data?.tracking_status || event?.tracking_status || "").toLowerCase();
    const tracking = event?.data?.tracking_number || event?.tracking_number || event?.tracking_id;

    if (!tracking) return res.sendStatus(200);

    const { data: order } = await supabase
      .from("orders")
      .select("email, status")
      .eq("tracking_id", tracking)
      .maybeSingle();

    if (!order) return res.sendStatus(200);

    // 🔁 Prevent duplicate updates
    const statusMap = {
      in_transit: "shipped",
      transit: "shipped",
      delivered: "delivered",
      failure: "failed",
      exception: "failed",
    };

    const newStatus = statusMap[status];
    if (!newStatus) return res.sendStatus(200);

    if (order.status === newStatus) {
      console.log("⚠️ Duplicate status ignored");
      return res.sendStatus(200);
    }

    let update = {
      status: newStatus,
    };

    const customerEmail = order?.email;

    if (newStatus === "shipped") {
      if (customerEmail) {
        await sendEmail(
          customerEmail,
          "Your order has been shipped 🚚",
          "Good news! Your order is now on the way."
        );
      }
    }

    if (newStatus === "delivered") {
      if (customerEmail) {
        await sendEmail(
          customerEmail,
          "Your order has been delivered 🎉",
          "Your order has been successfully delivered. Thank you for shopping with us!"
        );
      }
    }

    if (newStatus === "failed") {
      if (customerEmail) {
        await sendEmail(
          customerEmail,
          "Delivery update failed ⚠️",
          "We encountered an issue with your delivery. We will resolve it shortly."
        );
      }
    }

    await supabase
      .from("orders")
      .update(update)
      .eq("tracking_id", tracking);

    console.log("📦 SHIPPO TRACKING UPDATE:", { tracking, status, newStatus });

    return res.sendStatus(200);
  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.sendStatus(200);
  }
});

module.exports = router;