import { FaInstagram, FaTiktok, FaTwitter } from "react-icons/fa";

function Footer() {
  return (
    <footer className="w-full bg-black text-white px-10 py-28 font-sans">

      <div className="grid grid-cols-1 md:grid-cols-5 gap-14">

        {/* BRAND */}
        <div>
          <h1 className="text-3xl tracking-[0.6em] mb-4 font-[var(--font-playfair)]">
            VELRA
          </h1>

          <p className="text-sm text-gray-400 leading-6">
            Modern fashion brand built for style, comfort, and confidence.
          </p>

          <div className="flex gap-5 mt-6 text-xl text-gray-300">
            <FaInstagram className="hover:text-white cursor-pointer transition" />
            <FaTiktok className="hover:text-white cursor-pointer transition" />
            <FaTwitter className="hover:text-white cursor-pointer transition" />
          </div>
        </div>

        {/* SHOP */}
        <div>
          <h2 className="mb-5 font-semibold text-sm tracking-[0.3em] text-gray-200">
            SHOP
          </h2>

          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">New In</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Men</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Women</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Accessories</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Sale</p>
        </div>

        {/* HELP */}
        <div>
          <h2 className="mb-5 font-semibold text-sm tracking-[0.3em] text-gray-200">
            HELP
          </h2>

          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Shipping Info</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Returns</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Size Guide</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Track Order</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">FAQ</p>
        </div>

        {/* COMPANY */}
        <div>
          <h2 className="mb-5 font-semibold text-sm tracking-[0.3em] text-gray-200">
            COMPANY
          </h2>

          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">About Us</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Careers</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Sustainability</p>
          <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer">Press</p>
        </div>

        {/* CONTACT */}
        <div>
          <h2 className="mb-5 font-semibold text-sm tracking-[0.3em] text-gray-200">
            CONTACT
          </h2>

          <p className="text-sm text-gray-400 mb-2">support@velra.com</p>
          <p className="text-sm text-gray-400 mb-2">+234 000 000 0000</p>
          <p className="text-sm text-gray-400 mb-2">Lagos, Nigeria</p>
        </div>

      </div>

      {/* NEWSLETTER */}
      <div className="border-t border-gray-800 mt-20 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">

        <p className="text-gray-400 text-sm tracking-wide">
          Subscribe to get updates on new drops
        </p>

        <div className="flex w-full md:w-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 w-full md:w-72 text-black outline-none"
          />
          <button className="bg-white text-black px-6 py-3 text-sm tracking-widest hover:opacity-80 transition">
            SUBSCRIBE
          </button>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="text-center text-xs text-gray-500 mt-12 tracking-widest">
        © {new Date().getFullYear()} VELRA. ALL RIGHTS RESERVED.
      </div>

    </footer>
  );
}

export default Footer;