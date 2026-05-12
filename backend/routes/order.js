const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const createShipment = require('../services/shippo');
let Resend;

try {
  Resend = require('resend').Resend;
} catch (err) {
  console.log('⚠️ Resend package not found. Email service disabled.');
}

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY && Resend
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async (to, subject, text) => {
  if (!resend) {
    console.log('⚠️ EMAIL SKIPPED (Resend not configured)');
    return;
  }

  try {
    const { error } = await resend.emails.send({
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

// 💳 PAYMENT SUCCESS (FIXED - NO DUPLICATE EMAILS)
router.put('/:id/payment-success', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. GET EXISTING ORDER FIRST (FOR DUPLICATE EMAIL PREVENTION)
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const wasAlreadyPaid = existingOrder.payment_status === 'paid';

    // 2. UPDATE ORDER
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        shipping_status: 'processing'
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const order = data;

    // 🚚 CREATE SHIPPO SHIPMENT ON FIRST PAYMENT ONLY
    if (!wasAlreadyPaid && order && !order.tracking_id) {
      try {
        const shipment = await createShipment(order);

        if (shipment) {
          await supabase
            .from('orders')
            .update({
              tracking_id: shipment.tracking_id || shipment.id || null,
              courier: shipment.courier || 'Shippo',
              shipping_status: 'processing'
            })
            .eq('id', order.id);

          console.log('🚚 SHIPPO SHIPMENT CREATED:', shipment.tracking_id || shipment.id);
        }
      } catch (err) {
        console.log('❌ SHIPPO SHIPMENT ERROR:', err.message);
      }
    }

    // prevent duplicate email (ONLY SEND IF IT WAS NOT PREVIOUSLY PAID)
    if (order.email && !wasAlreadyPaid) {
      let items = [];
      try {
        items = typeof order.items === 'string'
          ? JSON.parse(order.items)
          : Array.isArray(order.items)
          ? order.items
          : [];
      } catch (e) {
        items = [];
      }

      const productList = items.length
        ? items.map(i => `- ${i?.name || 'Item'} x${i?.qty || 1}`).join('\n')
        : 'No items available';

      await sendEmail(
        order.email,
        'Payment Confirmed - Velra',
        `Hi ${order.name},\n\nYour payment has been confirmed 🎉\n\nOrder ID: ${order.id}\nInvoice ID: ${order.invoice_id || 'N/A'}\n\n🛒 Items:\n${productList}\n\nThank you for trusting Velra.`
      );
    }

    return res.json({ message: 'Payment updated', order });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// NOTE: Prevent email spam - only send updates when status exists
// ✏️ UPDATE ORDER STATUS (FIXED)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, payment_ref } = req.body;

    const updateData = {};

    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (payment_ref !== undefined) updateData.payment_ref = payment_ref;

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const order = Array.isArray(data) ? data[0] : data;

    if (order?.email && status) {
      await sendEmail(
        order.email,
        'Order Update - Velra',
        `Hi ${order.name},\n\nYour order status is now: ${status || 'updated'}`
      );
    }

    return res.json({ message: 'Order updated', order });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
