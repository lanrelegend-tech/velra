"use client";

import { useState } from "react";

function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How long does delivery take?",
      a: "Delivery usually takes 2–5 working days depending on your location in Nigeria.",
    },
    {
      q: "Can I return an item?",
      a: "Yes, you can return items within 7 days if they are unworn and in original condition.",
    },
    {
      q: "How do I track my order?",
      a: "You will receive a tracking link once your order is shipped.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept bank transfer and card payments.",
    },
  ];

  return (
    <div className="w-full min-h-screen px-10 py-28 text-black font-sans">

      {/* TITLE */}
      <div className="text-center mb-14">
        <h1 className="text-3xl tracking-widest font-[var(--font-playfair)]">
          HELP CENTER
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          FAQs & Policies
        </p>
      </div>

      {/* FAQ LIST */}
      <div className="max-w-3xl mx-auto flex flex-col gap-4">

        {faqs.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 p-4 cursor-pointer"
            onClick={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">{item.q}</p>
              <span>{openIndex === index ? "-" : "+"}</span>
            </div>

            {openIndex === index && (
              <p className="text-gray-600 mt-3 text-sm">
                {item.a}
              </p>
            )}
          </div>
        ))}

        {/* 🔥 POLICY SECTION INSIDE FAQ */}
        <div className="mt-12 border-t pt-10 flex flex-col gap-6 text-sm">

          <h2 className="text-lg font-semibold tracking-widest">
            POLICIES
          </h2>

          <div>
            <h3 className="font-semibold">Shipping Policy</h3>
            <p className="text-gray-600">
              Orders are processed in 24–48 hours. Delivery takes 2–5 days.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Return Policy</h3>
            <p className="text-gray-600">
              Returns are accepted within 7 days if items are unused and in original condition.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Privacy Policy</h3>
            <p className="text-gray-600">
              Your data is safe and only used for order processing.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default FAQPage;