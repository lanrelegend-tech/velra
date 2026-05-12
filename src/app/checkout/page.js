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
    <div style={{ padding: 20 }}>
      <h1>Checkout</h1>

      {/* EMAIL */}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

      {/* ADDRESS */}
      <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <input placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
      <input placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} />

      {/* SHIPPING */}
      <h3>
        Shipping:{' '}
        {loadingShipping
          ? 'Calculating...'
          : shippingFee !== null
          ? `$${shippingFee}`
          : 'Enter address'}
      </h3>

      {/* TOTAL */}
      <h3>Total: ${grandTotal}</h3>

      {/* CART */}
      <div>
        {cart.map((item, i) => (
          <div key={i}>
            {item.name} x {item.qty}
          </div>
        ))}
      </div>

      {/* PAY BUTTONS */}
      <button onClick={payWithPaystack} style={{ marginTop: 20 }}>
        Pay with Paystack 💳
      </button>

      <button onClick={payWithCrypto} style={{ marginTop: 10 }}>
        Pay with Crypto 🪙
      </button>
    </div>
  );
}
