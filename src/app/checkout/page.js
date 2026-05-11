"use client";

import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";

function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paystackReady, setPaystackReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("idle");
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");

  // ✅ LOAD USER DATA FROM CUSTOMERS TABLE
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        console.log("CUSTOMER DATA:", data);
        console.log("CUSTOMER ERROR:", error);

        if (error) {
          console.log("Customer fetch error:", error.message);
        }

        const meta = user.user_metadata || {};

        // ✅ safe fallbacks (no email-as-name anymore)
        setName(data?.name || meta.name || "");
        setAddress(data?.address || "");
        setPhone(data?.phone || "");
        setEmail(data?.email || user.email || "");

      } catch (err) {
        console.log("Load user failed:", err.message);
      }
    };

    loadUser();
  }, []);

  // ✅ LOAD PAYSTACK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;

    script.onload = () => setPaystackReady(true);

    document.body.appendChild(script);
  }, []);

  // ✅ EMAIL VALIDATION
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const openModal = (msg) => {
    setMessage(msg);
    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
      setMessage("");
    }, 2000);
  };

  // ✅ TOTAL
  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  // 💳 CRYPTO PAYMENT (NOWPAYMENTS)
  const handleCryptoPayment = async () => {
    setLoading(true);
    setStep("creating_order");
    openModal("Preparing crypto payment...");
    setError("");

    if (!name || !address || !phone || !email) {
      setLoading(false);
      openModal("Fill all fields");
      return;
    }

    try {
      setStep("creating_invoice");
      const res = await fetch("https://velra-2.onrender.com/crypto/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          amount: total,
          payment_method: "crypto"
        }),
      });

      const data = await res.json();

      console.log("CRYPTO RESPONSE:", data);

      const paymentUrl =
        data?.payment?.invoice_url ||
        data?.payment?.payment_url ||
        data?.payment?.url;

      if (!paymentUrl) {
        setError("Crypto payment failed");
        setStep("idle");
        openModal("Crypto payment failed");
        setLoading(false);
        return;
      }

      setPaymentData(data?.payment);
      setStep("redirecting");
      setLoading(false);
      openModal("Redirecting to payment...");
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 800);

    } catch (err) {
      console.log(err);
      setError("Crypto payment error");
      setStep("idle");
      setLoading(false);
      openModal("Crypto payment error");
    }
  };

  // ✅ PAYMENT FUNCTION
  const handlePayment = async () => {
    if (!name || !address || !phone || !email) {
      openModal("Fill all fields");
      return;
    }

    if (!isValidEmail(email)) {
      openModal("Enter a valid email address");
      return;
    }

    if (!paystackReady || !window.PaystackPop) {
      openModal("Payment system is still loading");
      return;
    }

    // 🧾 CREATE ORDER FIRST (so webhook can find it)
    const orderRes = await fetch("https://velra-2.onrender.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        address,
        items: cart,
        total,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "card",
      }),
    });

    // 🚨 STOP EARLY IF REQUEST FAILED
    if (!orderRes.ok) {
      console.log("❌ ORDER REQUEST FAILED:", orderRes.status);
      openModal("Failed to create order. Try again.");
      return;
    }

    let savedOrder;
    try {
      savedOrder = await orderRes.json();
    } catch (err) {
      console.log("❌ INVALID JSON RESPONSE FROM ORDER API:", err);
      openModal("Server error. Try again.");
      return;
    }

    console.log("🧾 RAW ORDER RESPONSE:", savedOrder);

    // 🧾 FINAL ORDER ID (STRICT - ONLY TRUST BACKEND ORDER UUID)
    const orderId =
      savedOrder?.order?.id ||
      savedOrder?.data?.id ||
      savedOrder?.id ||
      null;

    const cleanedOrderId = typeof orderId === "string" ? orderId.trim() : orderId;

    console.log("🧾 FINAL ORDER ID:", cleanedOrderId);

    console.log("🔥 PAYSTACK METADATA CHECK:", {
      order_id: cleanedOrderId,
      name,
      phone,
      address,
    });

    // 🚨 HARD STOP IF INVALID OR MISSING
    if (!cleanedOrderId) {
      console.log("❌ INVALID ORDER RESPONSE:", savedOrder);
      openModal("Failed to create order. Try again.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: "pk_test_499eccfecb3ba036608bc11567ea7a641205b940",
      email,
      amount: total * 100,
      currency: "NGN",

      metadata: {
        name: name?.toString()?.trim(),
        phone: phone?.toString()?.trim(),
        address: address?.toString()?.trim(),
        order_id: cleanedOrderId,
      },

      callback: function (response) {
  (async () => {
    console.log("Payment success:", response);

    // 🔄 UPDATE ORDER WITH PAYMENT REF
    await fetch("https://velra-2.onrender.com/orders/" + cleanedOrderId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_ref: response.reference,
        payment_status: "paid",
      }),
    });

    clearCart();
    router.push("/order/success");
  })();
},

      onClose: function () {
        openModal("Payment cancelled");
      },
    });

    handler.openIframe();
  };

  const retryPayment = () => {
    setError("");
    setStep("idle");

    if (paymentMethod === "crypto") {
      handleCryptoPayment();
    } else {
      handlePayment();
    }
  };

  return (
    <div className="min-h-screen mt-32 px-6 md:px-20 flex flex-col md:flex-row gap-10 text-black">

      {/* LEFT */}
      <div className="flex-1 space-y-4">

        <h1 className="text-2xl font-semibold">Checkout</h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 outline-none"
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-3 outline-none"
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 outline-none"
        />

        <textarea
          placeholder="Delivery Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border p-3 outline-none h-32"
        />

      </div>

      {/* RIGHT */}
      <div className="w-full md:w-[400px] border p-5 h-fit">

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Select Payment Method</p>

          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`px-3 py-1 border ${
                paymentMethod === "card" ? "bg-black text-white" : ""
              }`}
            >
              Card (Paystack)
            </button>

            <button
              onClick={() => setPaymentMethod("crypto")}
              className={`px-3 py-1 border ${
                paymentMethod === "crypto" ? "bg-black text-white" : ""
              }`}
            >
              Crypto (USDT)
            </button>
          </div>
        </div>

        {step !== "idle" && (
          <div className="mb-3 text-sm text-blue-600 font-medium">
            {step === "creating_order" && "Creating order..."}
            {step === "creating_invoice" && "Creating payment invoice..."}
            {step === "redirecting" && "Redirecting to payment..."}
          </div>
        )}

        {error && (
          <div className="mb-3 text-sm text-red-600 font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={retryPayment} className="underline text-black">
              Retry
            </button>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">

          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-sm border-b pb-2">
              <div>
                <p>{item.name}</p>
                <p className="text-xs opacity-60">
                  Size: {item.size} × {item.qty}
                </p>
              </div>

              <p>${(item.price * item.qty).toLocaleString()}</p>
            </div>
          ))}

        </div>

        {paymentMethod === "crypto" && paymentData && (
          <div className="border p-3 mb-3 text-xs bg-gray-50">
            <p className="font-semibold mb-1">Crypto Payment Details</p>
            <p>Amount: {paymentData?.pay_amount}</p>
            <p>Currency: {paymentData?.pay_currency}</p>
            <p className="break-all">Address: {paymentData?.pay_address}</p>
            <p className="break-all">Invoice: {paymentData?.invoice_url}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Paying with: <span className="font-semibold capitalize">{paymentMethod}</span>
        </div>

        <div className="flex justify-between font-semibold mt-5 border-t pt-3">
          <p>Total</p>
          <p>${total.toLocaleString()}</p>
        </div>

        <button
          disabled={loading || cart.length === 0}
          onClick={paymentMethod === "card" ? handlePayment : handleCryptoPayment}
          className={`w-full bg-black text-white py-3 mt-5 transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
          }`}
        >
          {loading ? "Processing..." : paymentMethod === "card" ? "Pay with Card" : "Pay with Crypto"}
        </button>

      </div>

      <Transition appear show={isOpen} as="div">
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>

          <div className="fixed inset-0 bg-black/60" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white text-black p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm text-center">
                <Dialog.Title className="text-sm font-semibold">
                  {message}
                </Dialog.Title>
              </Dialog.Panel>
            </Transition.Child>
          </div>

        </Dialog>
      </Transition>
    </div>
  );
}

export default CheckoutPage;