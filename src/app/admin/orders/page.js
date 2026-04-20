"use client";

import Link from "next/link";
import MonthlySalesChart from "@/app/components/MonthlySalesChart";
import ConditionalNavbar from "../../components/ConditionalNavbar";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function DashboardOverview() {
  const queryClient = useQueryClient();

  // ✅ FETCH ORDERS (TanStack Query)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { supabase } = await import("../../../../lib/supabase");

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const safeOrders = orders || [];

  // 📊 STATS
  const totalOrders = safeOrders.length;

  const totalRevenue = useMemo(() => {
    return safeOrders.reduce((sum, order) => {
      return sum + Number(order.total || 0);
    }, 0);
  }, [safeOrders]);

  const totalCustomers = new Set(
    safeOrders.map((o) => o.email)
  ).size;

  const pendingOrders = safeOrders.filter(
    (o) => o.status === "pending"
  ).length;

  const deliveredOrders = safeOrders.filter(
    (o) => o.status === "delivered"
  ).length;

  const deliveredRate =
    totalOrders === 0
      ? 0
      : Math.round((deliveredOrders / totalOrders) * 100);

  const avgOrderValue =
    totalOrders === 0
      ? 0
      : Math.round(totalRevenue / totalOrders);

  // 🔥 UPDATE STATUS
  async function updateOrderStatus(id, status) {
    const { supabase } = await import("../../../../lib/supabase");

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }

    return (
    <div className="min-h-screen p-8 space-y-10 bg-gray-50 text-black">
       <div className="bg-white border border-gray-200 shadow-sm rounded-xl mb-6 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          Admin Panel
        </h2>

        <div className="flex gap-4 text-sm">
          <Link href="/admin">
            <span className="text-gray-700 hover:text-black font-medium">
              Dashboard
            </span>
          </Link>

          <Link href="/admin/products">
            <span className="text-gray-700 hover:text-black font-medium">
              Products
            </span>
          </Link>

          <Link href="/admin/orders">
            <span className="text-gray-700 hover:text-black font-medium">
              Orders
            </span>
          </Link>

          <Link href="/">
            <span className="text-gray-700 hover:text-black font-medium">
              Store
            </span>
          </Link>
        </div>
      </div>


      {/* HEADER */}
      <div className="mb-6 mt-20">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">Dashboard Overview</h1>
        <p className="text-sm">
          Real-time business performance
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 border rounded-xl bg-white hover:shadow-sm transition">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-2xl font-semibold text-blue-600">{totalOrders}</p>
        </div>

        <div className="p-5 border rounded-xl bg-white hover:shadow-sm transition">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-2xl font-semibold text-green-600">${totalRevenue.toLocaleString()}</p>
        </div>

        <div className="p-5 border rounded-xl bg-white hover:shadow-sm transition">
          <p className="text-xs text-gray-500">Customers</p>
          <p className="text-2xl font-semibold text-purple-600">{totalCustomers}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="p-5 border rounded-xl bg-white">
        <MonthlySalesChart orders={safeOrders} />
      </div>

      {/* TABLE */}
      <div className="p-5 border rounded-xl bg-white">
        <h2 className="font-bold mb-4">Orders</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide bg-gray-100">
                <th className="py-3 text-left">Email</th>
                <th className="py-3 text-left">Total</th>
                <th className="py-3 text-left">Status</th>
                <th className="py-3 text-left">Address</th>
                <th className="py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <>
                  {/* HEADER SKELETON ROW */}
                  <tr className="bg-gray-100">
                    <td className="py-3 px-2"><Skeleton width={120} height={10} /></td>
                    <td className="py-3 px-2"><Skeleton width={60} height={10} /></td>
                    <td className="py-3 px-2"><Skeleton width={60} height={10} /></td>
                    <td className="py-3 px-2"><Skeleton width={120} height={10} /></td>
                    <td className="py-3 px-2"><Skeleton width={80} height={10} /></td>
                  </tr>

                  {/* ROW SKELETONS */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-4 px-2"><Skeleton width={140} height={10} /></td>
                      <td className="py-4 px-2"><Skeleton width={60} height={10} /></td>
                      <td className="py-4 px-2"><Skeleton width={70} height={10} /></td>
                      <td className="py-4 px-2"><Skeleton width={160} height={10} /></td>
                      <td className="py-4 px-2"><Skeleton width={90} height={10} /></td>
                    </tr>
                  ))}
                </>
              ) : safeOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No orders found
                  </td>
                </tr>
              ) : (
                safeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-2">{order.email}</td>
                    <td className="py-4 px-2">${Number(order.total || 0).toLocaleString()}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      {order.address || order.shipping_address || order.customer_address || "No address"}
                    </td>
                    <td className="py-4 px-2 flex gap-3">
                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "delivered")
                        }
                        className="px-3 py-1 border rounded-md text-xs hover:bg-blue-50 hover:border-blue-400 transition"
                      >
                        Deliver
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "pending")
                        }
                        className="px-3 py-1 border rounded-md text-xs hover:bg-blue-50 hover:border-blue-400 transition"
                      >
                        Pending
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}