const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 📧 Email setup
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
  } catch (err) {
    console.log('❌ EMAIL ERROR:', err.message);
    console.log('❌ EMAIL FAILED TO:', to);
  }
};

// 🛒 CREATE ORDER
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, payment_method, items } = req.body;

    const invoice_id = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          name,
          email,
          phone,
          address,
          items: items || [],
          status: 'pending',
          payment_status: 'unpaid',
          payment_method: payment_method || 'card',
          invoice_id
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const order = Array.isArray(data) ? data[0] : data;

    return res.json({ 
      message: 'Order created', 
      order,
      invoice_id
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 📦 GET ALL ORDERS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 💳 PAYMENT SUCCESS
router.put('/:id/payment-success', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const order = data;

    if (order?.email) {
      try {
        await sendEmail(
          order.email,
          'Payment Confirmed - Velra',
          `Hi ${order.name},\n\nYour payment has been confirmed 🎉\n\nOrder ID: ${order.id}\nInvoice ID: ${order.invoice_id || 'N/A'}\n\n🛒 Items Purchased:\n${Array.isArray(order.items) && order.items.length
  ? order.items
      .map(i => `- ${i?.name || "Item"} x${i?.qty || 1}`)
      .join("\n")
  : "No items available"}\n\nWe are processing your order.`
        );
      } catch (err) {
        console.log('❌ PAYMENT EMAIL ERROR:', err.message);
      }
    }

    return res.json({ message: 'Payment updated', order });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✏️ UPDATE ORDER STATUS
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const order = Array.isArray(data) ? data[0] : data;

    if (order?.email) {
      try {
        await sendEmail(
          order.email,
          'Order Update - Velra',
          `Hi ${order.name},\n\nYour order status is now: ${status}`
        );
      } catch (err) {
        console.log('❌ STATUS EMAIL ERROR:', err.message);
      }
    }

    return res.json({ message: 'Order updated', order });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
