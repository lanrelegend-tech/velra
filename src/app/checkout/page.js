'use client';

import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('CA');

  const [email, setEmail] = useState('');

  const [cart, setCart] = useState([]);
  const [shippingFee, setShippingFee] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const grandTotal = total + (shippingFee || 0);

  // 📦 LOAD CART
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // 🚚 SHIPPING
  useEffect(() => {
    if (!address || !city || !postalCode || !province || cart.length === 0) return;

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoadingShipping(true);

        const res = await fetch('https://velra-2.onrender.com/api/shipping-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            address,
            city,
            postalCode,
            province,
            country,
            cart
          })
        });

        const data = await res.json();
        setShippingFee(data?.shipping_fee ?? null);
      } catch (err) {
        console.log('Shipping error:', err.message);
        setShippingFee(null);
      } finally {
        setLoadingShipping(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [address, city, postalCode, province, cart]);

  // 💳 PAYSTACK PAYMENT
  const payWithPaystack = () => {
    if (!email || !grandTotal) return alert('Fill email and cart first');

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      email: email,
      amount: Math.round(grandTotal * 100),
      currency: 'NGN',
      callback: function (response) {
        alert('Payment successful: ' + response.reference);
      },
      onClose: function () {
        alert('Payment closed');
      }
    });

    handler.openIframe();
  };

  // 🪙 CRYPTO PAYMENT (NOWPAYMENTS)
  const payWithCrypto = async () => {
    try {
      const res = await fetch('https://velra-2.onrender.com/api/crypto/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_amount: grandTotal,
          price_currency: 'usd',
          order_id: Date.now().toString(),
          order_description: 'Velra Order'
        })
      });

      const data = await res.json();

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert('Crypto payment failed');
      }
    } catch (err) {
      console.log(err);
      alert('Crypto payment error');
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'serif', color: '#111' }}>

      {/* TOP BAR */}
      <div style={{ padding: '30px 60px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontWeight: 300, letterSpacing: 2 }}>CHECKOUT</h1>
      </div>

      {/* CONTAINER */}
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 20px', gap: 60 }}>

        {/* LEFT - FORM */}
        <div style={{ flex: 1 }}>

          <h3 style={{ fontWeight: 400, marginBottom: 20 }}>Contact</h3>
          <input style={inputStyle} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <h3 style={{ fontWeight: 400, marginTop: 40 }}>Delivery</h3>
          <input style={inputStyle} placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input style={inputStyle} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input style={inputStyle} placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          <input style={inputStyle} placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} />

        </div>

        {/* RIGHT - SUMMARY */}
        <div style={{ width: 360, border: '1px solid #eee', padding: 30, height: 'fit-content' }}>

          <h3 style={{ fontWeight: 400 }}>Order Summary</h3>

          <div style={{ marginTop: 20 }}>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span>{item.name} x {item.qty}</span>
                <span>${item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <hr style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>${total}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span>Shipping</span>
            <span>
              {loadingShipping
                ? '...'
                : shippingFee !== null
                ? `$${shippingFee}`
                : '—'}
            </span>
          </div>

          <hr style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Total</span>
            <span>${grandTotal}</span>
          </div>

          <button onClick={payWithPaystack} style={btnPrimary}>
            Pay with Paystack
          </button>

          <button onClick={payWithCrypto} style={btnSecondary}>
            Pay with Crypto
          </button>

        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px 10px',
  marginBottom: 12,
  border: 'none',
  borderBottom: '1px solid #ddd',
  outline: 'none',
  fontSize: 14,
  background: 'transparent',
  color: '#111'
};

const btnPrimary = {
  width: '100%',
  padding: 14,
  marginTop: 20,
  background: '#111',
  color: '#fff',
  border: 'none',
  cursor: 'pointer'
};

const btnSecondary = {
  width: '100%',
  padding: 14,
  marginTop: 10,
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  cursor: 'pointer'
};
