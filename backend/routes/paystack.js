const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// EMAIL SETUP
// =========================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text
    });

    console.log('📧 EMAIL SENT:', to);
  } catch (err) {
    console.log('❌ EMAIL ERROR:', err.message);
    console.log('❌ FAILED EMAIL TO:', to);
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

      // 1. Invoice lookup
      if (invoice_id) {
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
        console.log('❌ ORDER NOT FOUND');

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
          payment_status: 'paid',
          payment_method: 'card'
        })
        .eq('id', order.id);

      console.log('✅ ORDER UPDATED:', order.id);

      // SEND EMAIL
      if (order.email) {
        await sendEmail(
          order.email,
          'Payment Confirmed 🎉',
          `Hi ${order.name},\n\nYour payment is successful.\nOrder ID: ${order.id}\n\nThank you for your order.`
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