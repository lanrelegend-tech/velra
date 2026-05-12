require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
let Resend;

try {
  Resend = require("resend").Resend;
} catch (err) {
  console.log("⚠️ Resend package not found. Email service disabled until installed.");
}

const { createClient } = require("@supabase/supabase-js");

const orderRoutes = require("./routes/order");
const paystackRoutes = require("./routes/paystack");
const cryptoWebhookRoutes = require("./routes/cryptoWebhook");
const shippingRoute = require("./routes/api/shipping");
const easyshipWebhook = require("./routes/api/easyshipWebhook");

const app = express();

// =========================
// GLOBAL DEBUG LOGGER
// =========================
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

// =========================
// CORS
// =========================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://velra-s5m1.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// RAW BODY FIX FOR PAYSTACK
// =========================
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ extended: true }));

console.log("📦 Backend initializing...");

// =========================
// ROUTES
// =========================

// Orders
app.use("/orders", orderRoutes);
app.use("/api/orders", orderRoutes);

// Paystack
app.use("/paystack", paystackRoutes);
app.use("/api/paystack", paystackRoutes);

// Crypto
app.use("/crypto", cryptoWebhookRoutes);
app.use("/api/crypto", cryptoWebhookRoutes);

// Shipping
app.use("/shipping-price", shippingRoute);
app.use("/api/shipping-price", shippingRoute);

// Easyship Webhook
app.use("/api/easyship/webhook", easyshipWebhook);

// =========================
// WEBHOOK TEST ROUTE
// =========================
app.get("/webhook-test", (req, res) => {
  console.log("🧪 WEBHOOK TEST HIT");
  res.json({ ok: true });
});

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// =========================
// ADMIN DASHBOARD TEST ROUTE
// =========================
app.get("/admin/dashboard", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not initialized"
      });
    }

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    res.json({
      success: true,
      message: "Admin dashboard connected",
      total_orders: count || 0,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =========================
// RESEND CLIENT
// =========================
const resend = (process.env.RESEND_API_KEY && Resend)
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// =========================
// EMAIL
// =========================
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
// PRODUCTS
// =========================
app.get("/products", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELIVERIES
// =========================
app.post("/deliveries", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("deliveries")
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// PAYSTACK INIT
// =========================
app.post("/paystack/init", (req, res) => {
  res.json({ message: "Use frontend Paystack inline checkout" });
});

// =========================
// CRYPTO INIT
// =========================
app.post("/crypto/init", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.nowpayments.io/v1/payment",
      {
        price_amount: req.body.amount,
        price_currency: "usd",
        pay_currency: req.body.pay_currency || "usdttrc20",
        order_id: req.body.order_id,
        order_description: "Order payment",
      },
      {
        headers: {
          "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// 404
// =========================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  console.log("❌ GLOBAL ERROR:", err.message);

  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("📦 Supabase URL loaded:", !!process.env.SUPABASE_URL);
  console.log("📧 Resend enabled:", !!process.env.RESEND_API_KEY);
});