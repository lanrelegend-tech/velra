require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
app.use(cors());

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
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

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
        pay_currency: "usdttrc20",
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
app.post("/crypto/webhook", async (req, res) => {
  try {
    const event = req.body;

    console.log("💰 CRYPTO WEBHOOK HIT");

    if (["finished", "confirmed", "completed"].includes(event.payment_status)) {
      await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", event.order_id);

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", event.order_id)
        .maybeSingle();

      if (data?.email) {
        await sendEmail(
          data.email,
          "Payment Successful",
          "Your crypto payment is confirmed 🎉"
        );
      }

      await logWebhook({
        source: "crypto",
        event: "payment_success",
        status: "success",
        payload: event,
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("CRYPTO WEBHOOK ERROR:", err.message);
    res.sendStatus(200);
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});