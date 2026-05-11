const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (to, subject, text, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text
      });

      console.log("📧 EMAIL SENT SUCCESSFULLY:", to);
      return true;

    } catch (err) {
      console.log(`❌ Email attempt ${i + 1} failed:`, err.message);

      if (i === retries - 1) {
        console.log("🚨 Email permanently failed:", to);
        throw err;
      }
    }
  }
};

const logWebhook = async ({ source, event, status, payload, error = null }) => {
  try {
    await supabase.from('webhook_logs').insert([
      {
        source,
        event,
        status,
        payload,
        error
      }
    ]);

    console.log("🪵 WEBHOOK LOGGED:", source, event);
  } catch (err) {
    console.log("❌ WEBHOOK LOG ERROR:", err.message);
  }
};

const verifyPaystack = (req) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const payload = req.rawBody
    ? req.rawBody
    : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === req.headers['x-paystack-signature'];
};

// 💳 PAYSTACK + CRYPTO UNIFIED WEBHOOK
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    console.log("🔥 WEBHOOK ROUTE HIT");
    console.log("📩 HEADERS:", req.headers);
    console.log("📦 BODY RECEIVED:", body);

    console.log("📩 WEBHOOK RECEIVED:", body);

    const eventType = body.event;
    console.log("⚡ PAYSTACK EVENT TYPE:", eventType);

    // 💳 PAYSTACK EVENTS HANDLER
    if (eventType === "charge.success" || eventType === "charge.failed" || eventType === "charge.abandoned") {

      const isValidSignature = verifyPaystack(req);
      console.log("🔐 PAYSTACK SIGNATURE VALID:", isValidSignature);

      if (!isValidSignature) {
        console.log("❌ INVALID PAYSTACK SIGNATURE");

        await logWebhook({
          source: "paystack",
          event: "invalid_signature",
          status: "failed",
          payload: body
        });

        return res.sendStatus(401);
      }

      // =========================
      // ❌ FAILED PAYMENT
      // =========================
      if (eventType === "charge.failed") {
        console.log("❌ PAYMENT FAILED EVENT");

        await logWebhook({
          source: "paystack",
          event: "charge.failed",
          status: "failed",
          payload: body
        });

        return res.sendStatus(200);
      }

      // =========================
      // ⏳ ABANDONED PAYMENT
      // =========================
      if (eventType === "charge.abandoned") {
        console.log("⏳ PAYMENT ABANDONED EVENT");

        await logWebhook({
          source: "paystack",
          event: "charge.abandoned",
          status: "failed",
          payload: body
        });

        return res.sendStatus(200);
      }

      // =========================
      // ✅ SUCCESS PAYMENT ONLY
      // =========================
      const invoice_id = body.data?.metadata?.invoice_id;
      const reference = body.data.reference;

      console.log("🧾 PAYSTACK INVOICE ID:", invoice_id);
      console.log("🔁 PAYSTACK REFERENCE:", reference);

      if (!invoice_id && !reference) {
        await logWebhook({
          source: "paystack",
          event: "missing_invoice",
          status: "failed",
          payload: body
        });

        return res.sendStatus(200);
      }

      await logWebhook({
        source: "paystack",
        event: "charge.success",
        status: "success",
        payload: body
      });

      // 🧾 SAFE ORDER RESOLUTION (invoice-first)
      let order = null;
      console.log("🔍 STARTING ORDER RESOLUTION...");

      if (invoice_id) {
        const resOrder = await supabase
          .from("orders")
          .select("*")
          .eq("invoice_id", invoice_id)
          .single();

        order = resOrder.data;
        console.log("✅ ORDER FOUND (INVOICE):", order);
      }

      if (!order && reference) {
        const resOrder = await supabase
          .from("orders")
          .select("*")
          .eq("payment_ref", reference)
          .single();

        order = resOrder.data;
        console.log("✅ ORDER FOUND (REFERENCE):", order);
      }

      if (!order) {
        console.log("❌ ORDER NOT FOUND");

        await logWebhook({
          source: "paystack",
          event: "order_not_found",
          status: "failed",
          payload: body
        });

        return res.sendStatus(200);
      }

      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "card"
        })
        .eq("id", order.id);

      if (order?.email) {
        console.log("📧 PREPARING EMAIL FOR:", order.email);

        try {
          await sendEmail(
            order.email,
            "Payment Confirmed 🎉",
            `Hi ${order.name},\n\nYour payment is confirmed 🎉\nOrder ID: ${order.id}\nInvoice ID: ${order.invoice_id || invoice_id || "N/A"}`
          );

          console.log("📬 EMAIL SENT CONFIRMED FOR ORDER:", order.id);

        } catch (err) {
          console.log("❌ EMAIL FAILED:", err.message);
        }
      }
    }

    // =========================
    // 🪙 CRYPTO
    // =========================
    if (
      body.payment_status === "finished" ||
      body.payment_status === "confirmed"
    ) {
      const order_id = body.order_id || body.invoice_id;

      const { data: order } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "crypto"
        })
        .eq("id", order_id)
        .select()
        .single();

      if (!order) {
        console.log("❌ CRYPTO ORDER NOT FOUND");
        return res.sendStatus(200);
      }

      try {
        await sendEmail(
          order.email,
          "Crypto Payment Confirmed 🎉",
          `Hi ${order.name}, your crypto payment is confirmed.`
        );

        await logWebhook({
          source: "crypto",
          event: "email_sent",
          status: "success",
          payload: order
        });

      } catch (err) {
        await logWebhook({
          source: "crypto",
          event: "email_failed",
          status: "failed",
          payload: body,
          error: err.message
        });
      }
    }

    res.sendStatus(200);

  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);

    await supabase.from("webhook_logs").insert({
      source: "system",
      event: "webhook_error",
      status: "failed",
      error: err.message,
      payload: req.body
    });

    res.sendStatus(500);
  }
});

module.exports = router;