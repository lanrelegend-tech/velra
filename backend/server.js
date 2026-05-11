require('dotenv').config();

const express = require('express');
const cors = require('cors');


const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const orderRoutes = require('./routes/order');
const paystackRoutes = require('./routes/paystack');
const app = express();

app.use(cors());
// ✅ Capture raw body for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
console.log("📦 Backend routes initializing...");
app.use('/orders', orderRoutes);
app.use('/paystack', paystackRoutes);


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📧 Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// 📧 Send Email Function
const sendEmail = async (to, subject, text, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text
      });

      console.log('📧 Email sent successfully to:', to);
      return true;

    } catch (err) {
      console.log(`❌ Email attempt ${i + 1} failed:`, err.message);

      if (i === retries - 1) {
        console.log('🚨 Email permanently failed for:', to);
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

    console.log('🪵 Webhook logged:', source, event);

  } catch (err) {
    console.log('❌ Failed to log webhook:', err.message);
  }
};


app.get('/', (req, res) => {
  res.send('Backend connected 🚀');
});

app.get('/products', async (req, res) => {
  try {
    console.log("📥 GET /products hit");
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    console.log("📥 POST /products hit");
    const payload = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Product created successfully',
      product: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    console.log("✏️ PUT /products/:id HIT:", req.params.id);
    console.log("PAYLOAD:", req.body);
    const { id } = req.params;
    const payload = req.body;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Product updated successfully',
      product: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    console.log("🗑️ DELETE /products/:id HIT:", req.params.id);
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Product deleted successfully',
      product: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 🚚 Create delivery assignment
app.post('/deliveries', async (req, res) => {
  try {
    const {
      order_id,
      rider_name,
      rider_phone,
      pickup_address,
      delivery_address,
      delivery_fee
    } = req.body;

    const { data, error } = await supabase
      .from('deliveries')
      .insert([
        {
          order_id,
          rider_name,
          rider_phone,
          pickup_address,
          delivery_address,
          delivery_fee,
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Delivery assigned successfully',
      delivery: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚚 Get all deliveries
app.get('/deliveries', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚚 Get rider deliveries
app.get('/deliveries/rider/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('rider_phone', phone)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚚 Update delivery status
app.put('/deliveries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('deliveries')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const delivery = data?.[0];

    // 📲 Notify customer when delivery status changes
    if (delivery?.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', delivery.order_id)
        .single();

      if (order?.email) {
        let msg = '';

        if (status === 'assigned') {
          msg = `A rider has been assigned to your order 🚚`;
        }

        if (status === 'picked_up') {
          msg = `Your package has been picked up 📦`;
        }

        if (status === 'in_transit') {
          msg = `Your package is on the way 🚚`;
        }

        if (status === 'delivered') {
          msg = `Your package has been delivered ✅`;
        }

        if (msg) {
          await sendEmail(order.email, 'Delivery Update', msg);
        }
      }
    }

    res.json({
      message: 'Delivery updated successfully',
      delivery
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💳 NOWPayments Crypto Payment Init
app.post('/crypto/init', async (req, res) => {
  try {
    const { amount, order_id } = req.body;

    const response = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: order_id,
        order_description: `Order ${order_id}`,
        is_fee_paid_by_user: true
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// 🔐 NOWPayments Webhook (secure verification)
app.post('/crypto/webhook', async (req, res) => {
  try {

    const isDev =
      req.get('x-dev-mode') === 'true' ||
      process.env.NODE_ENV === 'development';

    console.log("DEV CHECK:", {
      env: process.env.NODE_ENV,
      devHeader: req.get('x-dev-mode'),
      isDev
    });

    // =========================
    // 🟢 DEV MODE (NO SIGNATURE CHECK)
    // =========================
    if (isDev) {
      console.log("⚠️ DEV MODE: webhook bypass active");

      const event = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

      console.log("📦 DEV WEBHOOK EVENT:", event);

      const order_id = String(event?.order_id);
      console.log("🔑 Normalized order_id:", order_id);

      if (
        event?.payment_status === 'finished' ||
        event?.payment_status === 'confirmed'
      ) {
        await supabase.from('webhook_logs').insert([
          {
            event: 'payment_received',
            payload: event
          }
        ]);

        console.log("🔄 Updating order ID:", order_id);

        const { data, error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: 'crypto'
          })
          .eq('id', order_id)
          .select();

        if (error) {
          console.log("❌ SUPABASE UPDATE ERROR:", error);
          return res.status(500).json({ error: error.message });
        }

        const order = data?.[0];

        console.log("✅ ORDER UPDATED:", order);

        if (order?.email) {
          await sendEmail(
            order.email,
            'Crypto Payment Confirmed',
            `Crypto payment confirmed 🎉 for order #${order.id}`
          );
        }
      }

      return res.sendStatus(200);
    }

    // =========================
    // 🔐 PRODUCTION MODE (REAL NOWPAYMENTS)
    // =========================
    const signature = req.headers['x-nowpayments-sig'];
    const payload = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
      .update(payload)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      await supabase.from('webhook_logs').insert([
        {
          event: 'failed_signature',
          payload: req.body
        }
      ]);

      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (
      event?.payment_status === 'finished' ||
      event?.payment_status === 'confirmed'
    ) {
      await supabase.from('webhook_logs').insert([
        {
          event: 'payment_received',
          payload: event
        }
      ]);

      const order_id = event?.order_id;

      const { data } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: 'crypto'
        })
        .eq('id', order_id)
        .select();

      const order = data?.[0];

      if (order?.email) {
        await sendEmail(
          order.email,
          'Crypto Payment Confirmed',
          `Crypto payment confirmed 🎉 for order #${order.id}`
        );
      }
    }

    res.sendStatus(200);

  } catch (err) {
    console.log('Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📊 Admin: Get all paid orders (payments dashboard)
app.get('/admin/payments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Admin: Dashboard stats
app.get('/admin/dashboard', async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('*');

    const totalOrders = orders?.length || 0;
    const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0;
    const pendingOrders = orders?.filter(o => o.payment_status === 'unpaid').length || 0;

    res.json({
      totalOrders,
      paidOrders,
      pendingOrders
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💳 NOWPayments Checkout (Order + Crypto Payment)
app.post('/crypto/create-checkout', async (req, res) => {
  try {
    const { name, email, phone, address, amount } = req.body;

    // 1. create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          name,
          email,
          phone,
          address,
          status: 'pending',
          payment_status: 'unpaid'
        }
      ])
      .select();

    if (orderError) {
      console.log("❌ ORDER CREATE ERROR:", orderError);
      return res.status(400).json({ error: orderError.message });
    }

    const order = orderData?.[0];

    console.log("🧾 ORDER CREATED:", order);
    // 📧 Send order creation email (crypto checkout)
    if (order?.email) {
      await sendEmail(
        order.email,
        'Order Created - Awaiting Payment',
        `Hello ${order.name},\n\nYour order has been created 🛒\n\nOrder ID: ${order.id}\nStatus: Pending Payment\nPayment Method: Crypto\n\nPlease complete your payment to confirm your order.\n\nThank you for shopping with Velra ❤️`
      );
    }

    // 2. create payment invoice (NOWPayments)
    const response = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: order.id,
        order_description: `Order ${order.id}`,
        is_fee_paid_by_user: true
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      order,
      payment: response.data
    });

  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (ACTIVE FILE)`);
});