const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// EMAIL TRANSPORT
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// =========================
// EMAIL SENDER (SAFE)
// =========================
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });

    console.log("📧 EMAIL SENT:", to);
  } catch (err) {
    console.log("❌ EMAIL FAILED:", err.message);
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

      console.log("🧾 INVOICE:", invoice_id);
      console.log("🔁 REF:", reference);

      let order = null;

      if (invoice_id) {
        const res1 = await supabase
          .from("orders")
          .select("*")
          .eq("invoice_id", invoice_id)
          .maybeSingle();

        order = res1.data;
      }

      if (!order && reference) {
        const res2 = await supabase
          .from("orders")
          .select("*")
          .eq("payment_ref", reference)
          .maybeSingle();

        order = res2.data;
      }

      if (!order) {
        console.log("❌ ORDER NOT FOUND");

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