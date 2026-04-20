"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState({ open: false, message: "" });

  const openModal = (message) => {
    setModal({ open: true, message });

    setTimeout(() => {
      setModal({ open: false, message: "" });
    }, 2500);
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("Login error:", error.message);
    openModal(error.message);
    return;
  }

  const user = data.user;

  localStorage.setItem("email", user.email);

  // check admin table
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (admin) {
    router.push("/admin");   // 🔥 admin goes here
  } else {
    const fromCart = localStorage.getItem("fromCart") === "true";

    if (fromCart) {
      router.push("/checkout"); // from cart → checkout
      localStorage.removeItem("fromCart");
    } else {
      router.push("/order"); // normal user → order page
    }
  }

};

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-4">

      <div className="w-full max-w-md">

        {/* TITLE */}
        <h1 className="text-2xl tracking-widest text-center mb-8">
          SIGN IN
        </h1>

        {/* FORM */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="relative w-full overflow-hidden bg-black text-white py-3 text-xs tracking-widest group"
          >
            {/* WHITE HOVER EFFECT */}
            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition duration-300"></span>

            <span className="relative z-10 group-hover:text-black transition-colors duration-300">
              CONTINUE
            </span>
          </button>
        </form>

        {/* FORGOT PASSWORD */}
        <p className="text-xs text-center mt-6 cursor-pointer hover:underline">
          Forgot your password?
        </p>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-[1px] bg-black/20"></div>
          <span className="text-xs">OR</span>
          <div className="flex-1 h-[1px] bg-black/20"></div>
        </div>

        {/* SIGNUP */}
        <Link href="/signup" className="block w-full">
          <button className="relative w-full overflow-hidden bg-black text-white py-3 text-xs tracking-widest group">

            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition duration-300"></span>

            <span className="relative z-10 group-hover:text-black transition-colors duration-300">
              CREATE ACCOUNT
            </span>

          </button>
        </Link>

      </div>
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-5 rounded shadow w-[90%] max-w-sm text-center">
            <p className="text-sm font-medium">{modal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}