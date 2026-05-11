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

const app = express();

// =========================
// GLOBAL DEBUG LOGGER (IMPORTANT)
// =========================
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

// =========================
// MIDDLEWARE
// =========================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 RAW BODY FIX FOR PAYSTACK
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
app.use("/orders", orderRoutes);
app.use("/paystack", paystackRoutes);
app.use("/crypto", require("./routes/cryptoWebhook"));

// =========================
// WEBHOOK TEST ROUTE (DEBUG)
// =========================
app.get("/webhook-test", (req, res) => {
  console.log("🧪 WEBHOOK TEST HIT");
  res.json({ ok: true });
});

// =========================
// SUPABASE
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// RESEND CLIENT
// =========================
const resend = process.env.RESEND_API_KEY && Resend
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// =========================
// EMAIL SENDING FUNCTION
// =========================
const sendEmail = async (to, subject, text) => {
  if (!resend) {
    console.log("⚠️ EMAIL SKIPPED (Resend not configured)");
    return;
  }
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
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// =========================
// SAFE LOGGING
// =========================
const logWebhook = async (data) => {
  try {
    const { error } = await supabase.from("webhook_logs").insert([data]);

    if (error) {
      console.log("❌ LOG ERROR:", error.message);
    }
  } catch (err) {
    console.log("❌ LOG EXCEPTION:", err.message);
  }
};

// =========================
// PRODUCTS (SAFE)
// =========================
app.get("/products", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log("❌ SUPABASE ERROR (products GET):", error.message);
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
      console.log("❌ SUPABASE ERROR (products POST):", error.message);
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
      console.log("❌ SUPABASE ERROR (deliveries):", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// PAYSTACK INIT (SAFE)
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
// CRYPTO WEBHOOK
// =========================
// 🪙 Crypto webhook moved to routes/crypto.js

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});