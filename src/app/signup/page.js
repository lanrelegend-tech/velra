"use client";

import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const openModal = (msg) => {
    setMessage(msg);
    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
      setMessage("");
    }, 2000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const fullName = `${form.firstName} ${form.lastName}`;

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: fullName,
        },
      },
    });

    if (error) {
      console.log("Signup error:", error.message);
      openModal(error.message);
      return;
    }

    // ✅ CREATE CUSTOMER RECORD WITH ERROR HANDLING
    if (data?.user) {
      const { error: insertError } = await supabase
        .from("customers")
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: fullName,
          },
        ]);

      if (insertError) {
        console.log("Customer insert error:", insertError.message);
      }
    }

    console.log("Signup success:", data);

    openModal("Account created successfully ✅");

    await new Promise((res) => setTimeout(res, 1200));

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black px-4">

      <div className="w-full max-w-md">

        <h1 className="text-2xl tracking-widest text-center mb-8">
          CREATE ACCOUNT
        </h1>

        {/* FORM */}
        <form onSubmit={handleSignup} className="flex flex-col gap-6">

          {/* FIRST NAME */}
          <input
            type="text"
            placeholder="First Name"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
          />

          {/* LAST NAME */}
          <input
            type="text"
            placeholder="Last Name"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
          />

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Password"
            className="border-b border-black outline-none py-3 text-sm placeholder:text-gray-400"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          {/* BUTTON */}
          <button
            type="submit"
            className="relative overflow-hidden bg-black text-white py-3 text-xs tracking-widest group"
          >
            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition duration-300"></span>

            <span className="relative z-10 group-hover:text-black">
              CREATE ACCOUNT
            </span>
          </button>

        </form>

        {/* LOGIN LINK */}
        <p className="text-xs text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="underline cursor-pointer">
            Sign in
          </Link>
        </p>

      </div>

      <Transition appear show={isOpen} as="div">
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>

          {/* Backdrop */}
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          {/* Center container */}
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
              <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">

                <Dialog.Title className="text-sm font-semibold text-black">
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