"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "johndoe@gmail.com",
    address: "No address added yet",
  });

  const handleSignOut = () => {
    // later you can replace with auth logout logic
    alert("Signed out");
  };

  return (
    <div className="min-h-screen bg-white text-black px-6 py-20 mt-20 flex justify-center">

      <div className="w-full max-w-2xl">

        {/* TITLE */}
        <h1 className="text-2xl tracking-[0.3em] text-center mb-12">
          PROFILE
        </h1>

        {/* CARD */}
        <div className="border border-black/10 p-8 flex flex-col gap-8">

          {/* EMAIL */}
          <div>
            <p className="text-xs tracking-widest text-gray-500 mb-2">
              EMAIL
            </p>
            <p className="text-sm">{user.email}</p>
          </div>

          {/* NAME */}
          <div>
            <p className="text-xs tracking-widest text-gray-500 mb-2">
              NAME
            </p>
            <p className="text-sm">{user.name}</p>
          </div>

          {/* ADDRESS */}
          <div>
            <p className="text-xs tracking-widest text-gray-500 mb-2">
              ADDRESS
            </p>
            <p className="text-sm">{user.address}</p>

            <button className="mt-3 text-xs underline hover:opacity-70">
              Edit Address
            </button>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-10 flex flex-col gap-4">

          {/* GO TO ORDERS */}
          <Link href="/order">
            <button className="w-full border border-black py-3 text-xs tracking-widest hover:bg-black hover:text-white transition">
              VIEW ORDERS
            </button>
          </Link>

          {/* SIGN OUT */}
          <button
            onClick={handleSignOut}
            className="w-full bg-black text-white py-3 text-xs tracking-widest hover:opacity-80 transition"
          >
            SIGN OUT
          </button>

        </div>

      </div>
    </div>
  );
}