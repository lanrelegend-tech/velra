const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
let Resend;
try {
  Resend = require("resend").Resend;
} catch (err) {
  console.log("⚠️ Resend package not available");
}

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY && Resend
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!process.env.RESEND_API_KEY) {
  console.log("❌ RESEND_API_KEY missing in environment");
}

// =========================
// EMAIL SENDER (PRODUCTION SAFE VERSION)
// =========================
const sendEmail = async (to, subject, text) => {
  if (!resend) {
    console.log("⚠️ EMAIL SKIPPED (Resend not configured)");
    return false;
  }
  try {
    console.log("📤 EMAIL ATTEMPT:", { to, subject });

    const { data, error } = await resend.emails.send({
      from: "Velra <onboarding@resend.dev>",
      to,
      subject,
      text,
    });

    if (error) {
      console.log("❌ RESEND ERROR:", error);
      return false;
    }

    console.log("📧 EMAIL SENT SUCCESS:", data);
    return true;
  } catch (err) {
    console.log("❌ EMAIL CRASH:", err.message);
    return false;
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
  if (!secret) {
    console.log("❌ PAYSTACK_SECRET_KEY NOT SET");
    return false;
  }

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
      const orderId =
        body?.data?.metadata?.order_id ||
        body?.data?.metadata?.orderId ||
        body?.data?.metadata?.invoice_id ||
        body?.data?.reference;

      const cleanOrderId = orderId?.toString()?.trim();

      console.log("🧾 WEBHOOK ORDER_ID FROM METADATA:", cleanOrderId);
      console.log("📦 METADATA DEBUG:", body?.data?.metadata);

      let order = null;
      console.log("🔎 LOOKING UP ORDER IN SUPABASE...");

      if (cleanOrderId) {
        console.log("🔍 SUPABASE QUERY BY ORDER_ID:", cleanOrderId);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", cleanOrderId)
          .maybeSingle();

        if (error) {
          console.log("❌ SUPABASE ERROR (order_id):", error.message);
        }

        if (data) {
          order = data;
        }
      }

      if (!order) {
        console.log("❌ ORDER NOT FOUND");

        await logWebhook({
          source: "paystack",
          event,
          status: "failed",
          reason: "order_not_found",
          payload: body,
        });

        return res.sendStatus(200);
      }

      // PREVENT DOUBLE PROCESSING
      if (order.payment_status === "paid") {
        console.log("⚠️ ORDER ALREADY PROCESSED - SKIPPING DUPLICATE WEBHOOK");
        return res.sendStatus(200);
      }

      // UPDATE ORDER
      await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "paid",
          payment_method: "card",
        })
        .eq("id", order.id);

      console.log("✅ ORDER UPDATED");

      // SEND EMAIL
      if (order.email) {
        console.log("📧 SENDING EMAIL TO:", order.email);
let items = [];
try {
  items = Array.isArray(order.items)
    ? order.items
    : JSON.parse(order.items || "[]");
} catch (e) {
  console.log("❌ ERROR PARSING ORDER ITEMS:", e.message);
  items = [];
}

const productList = items
  .map((item, i) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const total = price * qty;

    return `${i + 1}. ${item.name}\n   Qty: ${qty}\n   Price: ₦${price.toLocaleString()}\n   Total: ₦${total.toLocaleString()}`;
  })
  .join("\n\n");

const emailMessage = `
🎉 PAYMENT CONFIRMED SUCCESSFULLY

Hi ${order.name || "Customer"},

Your payment has been successfully processed.

🧾 ORDER DETAILS
------------------------
Order ID: ${order.id}

📦 ITEMS PURCHASED:
${productList || "No items found"}

💰 TOTAL PAID: ₦${Number(order.total || 0).toLocaleString()}

📍 DELIVERY ADDRESS:
${order.address || "Not provided"}

📞 PHONE:
${order.phone || "Not provided"}

🧡 Thank you for shopping with Velra!
We appreciate your order.
`;

await sendEmail(
  order.email,
  `Payment Successful 🎉 - Order ${order.id}`,
  emailMessage
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