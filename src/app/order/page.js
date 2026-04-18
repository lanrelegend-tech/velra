"use client";

import Link from "next/link";
import { FaRegUser } from "react-icons/fa";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-white text-black mt-20 px-6 py-20 flex justify-center">

      <div className="w-full max-w-4xl">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-12">

          {/* LEFT TITLE */}
          <h1 className="text-2xl tracking-[0.3em]">
            ORDERS
          </h1>

          {/* RIGHT PROFILE ICON */}
          <Link href="/profile" className="relative group">

            <div className="flex items-center gap-2 cursor-pointer">

              <span className="text-xs tracking-widest opacity-70 group-hover:opacity-100 transition">
                PROFILE
              </span>

              <FaRegUser
                size={16}
                className="hover:opacity-70 transition"
              />

            </div>

            {/* UNDERLINE */}
            <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-black transition-all group-hover:w-full"></span>

          </Link>

        </div>

        {/* EMPTY STATE */}
        <div className="border border-black/10 p-10 text-center">

          <h2 className="text-sm tracking-widest mb-4">
            YOU HAVE NO ORDERS YET
          </h2>

          <p className="text-xs text-gray-500 mb-8">
            When you place orders, they will appear here.
          </p>

          <Link href="/shop">
            <button className="relative overflow-hidden bg-black text-white px-8 py-3 text-xs tracking-widest group">

              <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition duration-300"></span>

              <span className="relative z-10 group-hover:text-black transition">
                START SHOPPING
              </span>

            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}