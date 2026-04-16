"use client";

function ContactPage() {
  return (
    <div className="w-full min-h-screen px-10 py-28 text-black font-sans">

      {/* TITLE */}
      <div className="text-center mb-14">
        <h1 className="text-3xl tracking-widest font-[var(--font-playfair)]">
          CONTACT US
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          We’d love to hear from you
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

        {/* FORM */}
        <div className="flex flex-col gap-5">

          <input
            type="text"
            placeholder="Your Name"
            className="border border-gray-300 p-3 outline-none focus:border-black"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="border border-gray-300 p-3 outline-none focus:border-black"
          />

          <input
            type="text"
            placeholder="Subject"
            className="border border-gray-300 p-3 outline-none focus:border-black"
          />

          <textarea
            placeholder="Message"
            rows="6"
            className="border border-gray-300 p-3 outline-none focus:border-black"
          />

          <button className="bg-black text-white py-3 tracking-widest hover:opacity-80 transition">
            SEND MESSAGE
          </button>

        </div>

        {/* INFO */}
        <div className="flex flex-col gap-6 text-sm">

          <div>
            <h2 className="font-semibold mb-1">Email</h2>
            <p className="text-gray-600">support@velra.com</p>
          </div>

          <div>
            <h2 className="font-semibold mb-1">Phone</h2>
            <p className="text-gray-600">+234 000 000 0000</p>
          </div>

          <div>
            <h2 className="font-semibold mb-1">Address</h2>
            <p className="text-gray-600">Lagos, Nigeria</p>
          </div>

          <div>
            <h2 className="font-semibold mb-1">Response Time</h2>
            <p className="text-gray-600">Within 24 hours</p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ContactPage;