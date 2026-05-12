const express = require("express");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND DISABLED: Missing API key");
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

router.post("/", async (req, res) => {
  try {
    const event = req.body;

    console.log("🚚 EASYSHIP WEBHOOK:", event);

    const status = (event?.status || "").toLowerCase();
    const tracking = event?.tracking_number || event?.tracking_id;

    if (!tracking) return res.sendStatus(200);
    if (!status) return res.sendStatus(200);

    const { data: order } = await supabase
      .from("orders")
      .select("email")
      .eq("tracking_id", tracking)
      .maybeSingle();

    const customerEmail = order?.email;

    let update = {};

    if (status === "in_transit") {
      update.status = "shipped";

      if (customerEmail) {
        sendEmail(
          customerEmail,
          "Your order has been shipped 🚚",
          "Good news! Your order is now on the way and has been shipped."
        );
      }
    }
    if (status === "delivered") {
      update.status = "delivered";

      if (customerEmail) {
        sendEmail(
          customerEmail,
          "Your order has been delivered 🎉",
          "Your order has been successfully delivered. Thank you for shopping with us!"
        );
      }
    }
    if (status === "failed") {
      update.status = "failed";

      if (customerEmail) {
        sendEmail(
          customerEmail,
          "Delivery update failed ⚠️",
          "We encountered an issue with your delivery. We will resolve it shortly."
        );
      }
    }

    if (Object.keys(update).length === 0) {
      console.log("⚠️ No valid status update from Easyship webhook");
      return res.sendStatus(200);
    }

    await supabase
      .from("orders")
      .update(update)
      .eq("tracking_id", tracking);

    return res.sendStatus(200);

  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.sendStatus(200);
  }
});

module.exports = router;