"use client";

import { saveOrder } from "../../../lib/saveOrders";// ✅ FIXED NAME
import { supabase } from "../../../lib/supabase";

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

  // ✅ LOAD USER DATA FROM CUSTOMERS TABLE
  useEffect(() => {
    const loadUser = async () => {
      try {
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

  // ✅ PAYMENT FUNCTION
  const handlePayment = () => {
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

    const handler = window.PaystackPop.setup({
      key: "pk_test_499eccfecb3ba036608bc11567ea7a641205b940",
      email,
      amount: total * 100,
      currency: "NGN",

      metadata: {
        name,
        phone,
        address,
      },

      callback: function (response) {
  (async () => {
    console.log("Payment success:", response);

    const orderData = {
      name,
      email,
      phone,
      address,
      items: cart,
      total,
      payment_ref: response.reference,
      status: "paid",
    };

    const saved = await saveOrder(orderData);

    console.log("Saved order:", saved);

    if (!saved) {
      openModal("Order failed to save");
      return;
    }

    clearCart();
    router.push("/order");
  })();
},

      onClose: function () {
        openModal("Payment cancelled");
      },
    });

    handler.openIframe();
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

              <p>₦{(item.price * item.qty).toLocaleString()}</p>
            </div>
          ))}

        </div>

        <div className="flex justify-between font-semibold mt-5 border-t pt-3">
          <p>Total</p>
          <p>₦{total.toLocaleString()}</p>
        </div>

        <button
          onClick={handlePayment}
          className="w-full bg-black text-white py-3 mt-5 hover:opacity-80 transition"
        >
          Pay Now
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