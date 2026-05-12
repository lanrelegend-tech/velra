const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
let Resend;
try {
  Resend = require("resend").Resend;
} catch (err) {
  console.log("⚠️ Resend package not available");
}

const resend = process.env.RESEND_API_KEY && Resend
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async (to, subject, text) => {
  if (!resend) {
    console.log("⚠️ EMAIL SKIPPED (Resend not configured)");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Velra <onboarding@resend.dev>",
      to,
      subject,
      text
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

// NOWPAYMENTS CRYPTO WEBHOOK (FIXED)
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    console.log("🪙 NOWPAYMENTS WEBHOOK RECEIVED:", body);
    console.log("🔐 HEADERS:", req.headers);
    // NOWPayments requires RAW body for correct hashing
    const payload = req.rawBody || req.bodyRaw || JSON.stringify(body);
    console.log("📦 RAW PAYLOAD:", payload);

    // -----------------------------
    // 1. VERIFY IPN SIGNATURE (FIXED SAFE VERSION)
    // -----------------------------
    const signature = req.headers["x-nowpayments-sig"] || req.headers["X-NOWPAYMENTS-SIG"];

    const generatedSignature = crypto
      .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET)
      .update(payload)
      .digest("hex");

    if (!signature) {
      console.log("⚠️ MISSING NOWPAYMENTS SIGNATURE HEADER");
      return res.sendStatus(401);
    }

    if (signature !== generatedSignature) {
      console.log("❌ INVALID NOWPAYMENTS SIGNATURE");
      console.log("Expected:", generatedSignature);
      console.log("Received:", signature);
      return res.sendStatus(401);
    }

    // -----------------------------
    // 2. EXTRACT DATA SAFELY
    // -----------------------------
    const status = (body.payment_status || "").toLowerCase();
    const orderId = body.order_id || body.payment_id || body?.metadata?.order_id || body?.orderId;

    if (!orderId) {
      console.log("❌ NO ORDER ID IN WEBHOOK");
      return res.sendStatus(400);
    }

    // -----------------------------
    // 3. FIND ORDER
    // -----------------------------
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.log("❌ ORDER NOT FOUND:", error?.message);
      return res.sendStatus(404);
    }

    // -----------------------------
    // 4. PREVENT DUPLICATE EMAILS
    // -----------------------------
    if (order.payment_status === "paid") {
      console.log("⚠️ ORDER ALREADY PROCESSED:", order.id);
      return res.sendStatus(200);
    }

    // -----------------------------
    // 5. VALID PAYMENT STATUS (NOWPAYMENTS)
    // -----------------------------
    const validStatuses = ["finished", "confirmed", "sending", "partially_paid", "complete", "completed", "waiting", "pending"];

    if (!validStatuses.includes(status)) {
      console.log("⏳ PAYMENT NOT COMPLETE:", status);
      return res.sendStatus(200);
    }

    // -----------------------------
    // 6. UPDATE ORDER
    // -----------------------------
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: status || "paid",
        payment_method: "crypto",
        currency: "USDT"
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateError) {
      console.log("❌ ORDER UPDATE ERROR:", updateError.message);
    }

    const finalOrder = updatedOrder || order;

    // -----------------------------
    // 7. PARSE ITEMS SAFELY
    // -----------------------------
    let items = [];

    try {
      items =
        typeof finalOrder.items === "string"
          ? JSON.parse(finalOrder.items)
          : Array.isArray(finalOrder.items)
          ? finalOrder.items
          : [];
    } catch (e) {
      console.log("❌ ITEM PARSE ERROR:", e.message);
    }

    const productList = items.length
      ? items
          .map(
            (i, idx) =>
              `${idx + 1}. ${i?.name || "Product"} x${i?.qty || 1} - $${i?.price || 0}`
          )
          .join("\n")
      : "No items found";

    // -----------------------------
    // 8. SEND EMAIL
    // -----------------------------
    const emailMessage = `Hi ${finalOrder.name},

Your crypto payment was successful 🎉

🧾 Order ID: ${finalOrder.id}
💰 Payment Method: Crypto (USDT)
📦 Status: Paid

🛍 Products:
${productList}

🙏 Thanks for trusting Velra. Your order is being processed.

— Velra Team`;

    if (finalOrder.email) {
      await sendEmail(
        finalOrder.email,
        "Crypto Payment Confirmed 🎉 - Velra",
        emailMessage
      );
    }

    console.log("✅ CRYPTO PAYMENT PROCESSED:", finalOrder.id);

    return res.sendStatus(200);
  } catch (err) {
    console.log("❌ WEBHOOK ERROR:", err.message);
    return res.sendStatus(500);
  }
});

module.exports = router;