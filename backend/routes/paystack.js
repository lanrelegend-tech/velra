const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📧 REAL EMAIL SYSTEM (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// 📧 EMAIL SYSTEM (with retry)
const sendEmail = async (to, subject, text, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text
      });

      console.log("📧 EMAIL SENT SUCCESSFULLY TO:", to);
      return true;

    } catch (err) {
      console.log(`❌ Email attempt ${i + 1} failed:`, err.message);

      if (i === retries - 1) {
        console.log("🚨 Email permanently failed for:", to);
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

router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // ⚠️ Ensure raw payload consistency for signature verification
    const payload = req.rawBody
      ? req.rawBody.toString()
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    const signature = req.headers['x-paystack-signature'];

    // 🔐 Verify webhook
    if (!signature || hash !== signature) {
      console.log("❌ Invalid Paystack signature", {
        expected: hash,
        received: signature
      });

      await logWebhook({
        source: "paystack",
        event: "invalid_signature",
        status: "failed",
        payload: req.body,
        error: "Signature mismatch"
      });

      return res.sendStatus(401);
    }

    const event = req.body;

    console.log("📩 PAYSTACK EVENT:", event.event);

    // 💳 SUCCESS PAYMENT ONLY
    if (event.event === "charge.success") {
      // 🧾 Invoice-based resolution (primary) with fallback
      const invoice_id = event.data?.metadata?.invoice_id;
      const reference = event.data.reference;

      console.log("🧾 Invoice ID:", invoice_id);

      if (!invoice_id && !reference) {
        console.log("❌ No invoice_id or reference found in Paystack payload");
        return res.sendStatus(200);
      }

      await logWebhook({
        source: "paystack",
        event: "charge.success",
        status: "success",
        payload: event
      });

      console.log("💳 Payment success:", reference);

      // 🔎 SAFE ORDER RESOLUTION (invoice-first)
      let order = null;

      // 🧾 1. Try invoice_id first (MOST RELIABLE)
      if (invoice_id) {
        const result = await supabase
          .from("orders")
          .select("*")
          .eq("invoice_id", invoice_id)
          .maybeSingle();

        order = result.data;
      }

      // 🔁 2. Fallback to Paystack reference (legacy support)
      if (!order && reference) {
        const result = await supabase
          .from("orders")
          .select("*")
          .eq("payment_ref", reference)
          .maybeSingle();

        order = result.data;
      }

      // ❌ 3. If still not found, log and exit safely
      if (!order) {
        console.log("❌ ORDER NOT FOUND:", { invoice_id, reference });
        console.log("🧾 DEBUG PAYLOAD:", { invoice_id, reference, event: event?.event });

        await logWebhook({
          source: "paystack",
          event: "order_not_found",
          status: "failed",
          payload: event,
          error: "No matching order found"
        });

        return res.sendStatus(200);
      }

      // ✅ 4. NOW UPDATE THE ORDER SAFELY USING ID
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: "card"
        })
        .eq("id", order.id)
        .select()
        .single();

      if (updateError) {
        console.log("❌ ORDER UPDATE ERROR:", updateError.message);
        return res.sendStatus(200);
      }

      console.log("✅ ORDER UPDATED:", updatedOrder);

      // 📧 EMAIL NOTIFICATION
      if (order && order.email) {
        try {
          await sendEmail(
            order.email,
            "Payment Confirmed - Velra",
            `Hi ${order.name},\n\nYour payment has been confirmed 🎉\n\nOrder ID: ${order.id}\nInvoice ID: ${order.invoice_id || invoice_id || reference}\n\nWe are processing your order.`
          );

          await logWebhook({
            source: "paystack",
            event: "email_sent",
            status: "success",
            payload: order
          });

        } catch (err) {
          await logWebhook({
            source: "paystack",
            event: "email_failed",
            status: "failed",
            payload: order,
            error: err.message
          });
        }
      }
    }

    return res.sendStatus(200);

  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.sendStatus(500);
  }
});

module.exports = router;