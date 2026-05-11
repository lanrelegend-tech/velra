const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// =========================
// EMAIL SENDER (SAFE)
// =========================
const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Velra <onboarding@resend.dev>",
      to,
      subject,
      text,
    });

    if (error) {
      console.log("❌ RESEND ERROR:", error);
    } else {
      console.log("📧 EMAIL SENT:", to);
    }
  } catch (err) {
    console.log("❌ EMAIL ERROR:", err.message);
  }
};

// =========================
// WEBHOOK LOGGER
// =========================
const logWebhook = async (data) => {
  try {
    await supabase.from("webhook_logs").insert([data]);
  } catch (err) {
    console.log("❌ LOG ERROR:", err.message);
  }
};

// =========================
// PAYSTACK SIGNATURE VERIFY
// IMPORTANT FIX: use rawBody fallback
// =========================
const verifyPaystack = (req) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const payload =
    typeof req.rawBody === "string"
      ? req.rawBody
      : JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  return hash === req.headers["x-paystack-signature"];
};

// =========================
// WEBHOOK ROUTE
// =========================
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    console.log("🔥 WEBHOOK HIT");
    console.log("📩 EVENT:", body?.event);

    // ALWAYS VERIFY FIRST
    const valid = verifyPaystack(req);
    console.log("🔐 SIGNATURE:", valid);

    if (!valid) {
      await logWebhook({
        source: "paystack",
        event: "invalid_signature",
        status: "failed",
        payload: body,
      });

      return res.sendStatus(200);
    }

    const event = body?.event;

    // =========================
    // FAILED PAYMENT
    // =========================
    if (event === "charge.failed") {
      console.log("❌ PAYMENT FAILED");

      await logWebhook({
        source: "paystack",
        event,
        status: "failed",
        payload: body,
      });

      return res.sendStatus(200);
    }

    // =========================
    // ABANDONED PAYMENT
    // =========================
    if (event === "charge.abandoned") {
      console.log("⏳ PAYMENT ABANDONED");

      await logWebhook({
        source: "paystack",
        event,
        status: "failed",
        payload: body,
      });

      return res.sendStatus(200);
    }

    // =========================
    // SUCCESS PAYMENT
    // =========================
    if (event === "charge.success") {
      const invoice_id = body?.data?.metadata?.invoice_id;
      const reference = body?.data?.reference;

      // 🔥 STRICT SINGLE SOURCE OF TRUTH: order_id ONLY
      const orderId = body?.data?.metadata?.order_id;

      console.log("📦 ORDER_ID FROM METADATA:", orderId);

      let order = null;

      if (orderId) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (error) {
          console.log("❌ SUPABASE ERROR (order_id):", error.message);
        }

        if (data) {
          order = data;
        }
      }

      if (!order) {
        console.log("❌ ORDER NOT FOUND (INVALID ORDER_ID)");

        await logWebhook({
          source: "paystack",
          event,
          status: "failed",
          payload: body,
        });

        return res.sendStatus(200);
      }

      // UPDATE ORDER
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "card",
        })
        .eq("id", order.id);

      console.log("✅ ORDER UPDATED");

      // SEND EMAIL
      if (order.email) {
        console.log("📧 SENDING EMAIL TO:", order.email);

        await sendEmail(
          order.email,
          "Payment Successful 🎉",
          `Hi ${order.name}, your payment is confirmed. Order ID: ${order.id}`
        );
      }

      await logWebhook({
        source: "paystack",
        event,
        status: "success",
        payload: body,
      });
    }

    return res.sendStatus(200);
  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);

    await logWebhook({
      source: "system",
      event: "error",
      status: "failed",
      error: err.message,
      payload: req.body,
    });

    return res.sendStatus(200);
  }
});

module.exports = router;