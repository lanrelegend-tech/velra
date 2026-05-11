const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Velra <onboarding@resend.dev>',
      to,
      subject,
      text
    });

    if (error) {
      console.log('❌ RESEND ERROR:', error);
    } else {
      console.log('📧 EMAIL SENT:', to);
    }
  } catch (err) {
    console.log('❌ EMAIL ERROR:', err.message);
  }
};

// =========================
// WEBHOOK LOGGER
// =========================
const logWebhook = async (data) => {
  try {
    await supabase.from('webhook_logs').insert([data]);
    console.log('🪵 LOGGED:', data.event);
  } catch (err) {
    console.log('LOG ERROR:', err.message);
  }
};

// =========================
// PAYSTACK WEBHOOK
// =========================
router.post('/', async (req, res) => {
  try {
    console.log('🔥 WEBHOOK HIT');

    const secret = process.env.PAYSTACK_SECRET_KEY;

    // SAFE RAW BODY HANDLING
    const payload =
      typeof req.rawBody === "string"
        ? req.rawBody
        : JSON.stringify(req.body);

    const signature = req.headers['x-paystack-signature'];

    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    const isValid = hash === signature;

    // =========================
    // DEBUG MODE (ALLOW MANUAL TESTS)
    // =========================
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      req.headers['x-dev-mode'] === 'true';

    if (!isValid && !isDev) {
      console.log("❌ INVALID PAYSTACK SIGNATURE");

      await logWebhook({
        source: 'paystack',
        event: 'invalid_signature',
        status: 'failed',
        payload: req.body
      });

      return res.sendStatus(200);
    }

    console.log('🔐 SIGNATURE VALID OR DEV MODE:', isValid || isDev);

    const event = req.body;

    console.log('📦 FULL PAYSTACK BODY:', JSON.stringify(event, null, 2));

    console.log('📩 EVENT:', event?.event);

    // =========================
    // SUCCESS PAYMENT
    // =========================
    if (event?.event === 'charge.success') {
      const invoice_id = event?.data?.metadata?.invoice_id;
      const reference = event?.data?.reference;

      let order = null;

      // 0. ORDER ID LOOKUP (PRIMARY FIX FOR FRONTEND FLOW)
      const order_id = event?.data?.metadata?.order_id?.toString()?.trim();
      console.log("🧾 WEBHOOK ORDER_ID FROM METADATA:", order_id);

      if (order_id) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .maybeSingle();

        if (error) {
          console.log("❌ SUPABASE ERROR (order_id lookup):", error.message);
        }

        if (data) {
          order = data;
        }
        if (order) {
          console.log("✅ ORDER FOUND VIA ORDER_ID:", order.id);
        }
      }

      // 1. Invoice lookup
      if (!order && invoice_id) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('invoice_id', invoice_id)
          .maybeSingle();

        if (error) {
          console.log("❌ SUPABASE ERROR (invoice lookup):", error.message);
        }

        order = data;
      }

      // 2. Fallback reference lookup
      if (!order && reference) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_ref', reference)
          .maybeSingle();

        if (error) {
          console.log("❌ SUPABASE ERROR (reference lookup):", error.message);
        }

        order = data;
      }

      if (!order) {
        console.log('❌ ORDER NOT FOUND - CHECK metadata.order_id / invoice_id / reference');
        console.log("📦 METADATA DEBUG:", event?.data?.metadata);

        await logWebhook({
          source: 'paystack',
          event: 'order_not_found',
          status: 'failed',
          payload: event
        });

        return res.sendStatus(200);
      }

      // UPDATE ORDER
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          payment_method: 'card'
        })
        .eq('id', order.id);

      console.log('✅ ORDER UPDATED:', order.id);

      // SEND EMAIL
      if (order.email) {
        let items = [];

        try {
          items =
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : Array.isArray(order.items)
              ? order.items
              : [];
        } catch (e) {
          console.log("❌ ITEM PARSE ERROR:", e.message);
          items = [];
        }

        const productList = items.length
          ? items
              .map(
                (i, idx) =>
                  `${idx + 1}. ${i?.name || "Product"} x${i?.qty || 1} - ₦${i?.price || "0"}`
              )
              .join("\n")
          : "No items found";

        const emailMessage = `Hi ${order.name},

Your payment was successful 🎉

🧾 Order ID: ${order.id}
📦 Order Status: ${order.status || "paid"}

🛍 Products:
${productList}

💰 Total Amount: ₦${order.total || "N/A"}

🙏 Thanks for trusting Velra. We truly appreciate your order and we are preparing it for delivery.

If you have any questions, feel free to contact us anytime.

— Velra Team`;

        await sendEmail(
          order.email,
          "Payment Confirmed 🎉 - Velra",
          emailMessage
        );
      }

      await logWebhook({
        source: 'paystack',
        event: 'charge.success',
        status: 'success',
        payload: event
      });
    }

    // =========================
    // FAILED PAYMENT
    // =========================
    if (event?.event === 'charge.failed') {
      console.log('❌ PAYMENT FAILED');

      await logWebhook({
        source: 'paystack',
        event: 'charge.failed',
        status: 'failed',
        payload: event
      });
    }

    return res.sendStatus(200);

  } catch (err) {
    console.log('WEBHOOK ERROR:', err.message);

    await logWebhook({
      source: 'paystack',
      event: 'system_error',
      status: 'failed',
      error: err.message,
      payload: req.body
    });

    return res.sendStatus(200);
  }
});

module.exports = router;