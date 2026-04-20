"use client";

import Link from "next/link";
import { FaRegUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Usernavbar from "../components/Usernavbar";
import { useQuery } from "@tanstack/react-query";

export default function OrdersPage() {
  const [openOrderId, setOpenOrderId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email;
      if (!email) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return data || [];
    },
  });

  return (
    <div className="flex flex-col">
       <Usernavbar/>
  
    <div className="min-h-screen  bg-white text-black  px-6 py-20 flex justify-center">
     

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

        {isLoading ? (
          <p className="text-xs text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
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
        ) : (
          <div className="border border-black/10">
            {/* TABLE HEADER */}
            <div className="grid grid-cols-4 text-xs tracking-widest border-b p-3 bg-gray-50">
              <span>ORDER</span>
              <span>AMOUNT</span>
              <span>STATUS</span>
              <span>ACTION</span>
            </div>

            {/* TABLE ROWS */}
            {orders.map((order) => (
              <div key={order.id} className="border-b">
                
                {/* MAIN ROW */}
                <div className="grid grid-cols-4 p-3 items-center text-xs">
                  <span>#{order.id.slice(0, 6)}</span>

                  <span>
                    ${Number(order.total_price || order.total || 0).toLocaleString()}
                  </span>

                  <span className={order.status === "delivered" ? "text-green-600" : "text-yellow-600"}>
                    {order.status || "pending"}
                  </span>

                  <button
                    onClick={() =>
                      setOpenOrderId(openOrderId === order.id ? null : order.id)
                    }
                    className="text-[10px] underline"
                  >
                    {openOrderId === order.id ? "Close" : "View"}
                  </button>
                </div>

                {/* EXPANDABLE SECTION */}
                {openOrderId === order.id && (
                  <div className="p-3 bg-gray-50 text-[10px] space-y-1">
                    <p className="font-medium">Items:</p>

                    {Array.isArray(order.items) ? (
                      <>
                        {order.items.map((item, idx) => (
                          <p key={idx}>
                            • {item.name || item.title} x{(() => {
                              const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1);
                              return isNaN(qty) ? 1 : qty;
                            })()}
                          </p>
                        ))}
                        <p className="mt-2 text-gray-700">
                          Total items: {order.items.reduce((sum, item) => {
                            const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1);
                            return sum + (isNaN(qty) ? 1 : qty);
                          }, 0)}
                        </p>
                      </>
                    ) : (
                      <p>{order.items}</p>
                    )}

                    <p className="mt-2 text-gray-500">
                      Email: {order.email}
                    </p>
                    <p className="text-gray-500">
                      Address: {order.address || order.shipping_address || order.customer_address || "No address provided"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
      </div>
  );
}