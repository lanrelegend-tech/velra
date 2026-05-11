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
      const res = await fetch("http://localhost:3001/orders");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch orders");

      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // 🔥 auto refresh every 5 seconds
    refetchIntervalInBackground: true,
  });

  const safeOrders = orders || [];

  // 📊 STATS
  const totalOrders = safeOrders.length;

  const totalRevenue = useMemo(() => {
    return safeOrders.reduce((sum, order) => {
      return sum + Number(order.total_price || 0);
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

  // 📊 PAYMENT ANALYTICS
  const paidOrders = safeOrders.filter(
    (o) => o.payment_status === "paid"
  ).length;

  const unpaidOrders = safeOrders.filter(
    (o) => o.payment_status !== "paid"
  ).length;

  const cryptoOrders = safeOrders.filter(
    (o) => o.payment_method === "crypto"
  ).length;

  const cardOrders = safeOrders.filter(
    (o) => o.payment_method === "card"
  ).length;

  // 💰 Revenue split
  const cryptoRevenue = safeOrders
    .filter((o) => o.payment_method === "crypto" && o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const cardRevenue = safeOrders
    .filter((o) => o.payment_method === "card" && o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  // 🔥 UPDATE STATUS
  async function updateOrderStatus(id, status) {
    try {
      const res = await fetch(`http://localhost:3001/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to update status");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      alert(err.message);
    }
  }

    return (
    <div className="min-h-screen p-8 space-y-10 mb-20 bg-gray-50 text-black">
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
      <div className="grid md:grid-cols-3 gap-4 mb-6">
  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Total Orders</p>
    <p className="text-2xl font-semibold text-blue-600">{totalOrders}</p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Paid Orders</p>
    <p className="text-2xl font-semibold text-green-600">{paidOrders}</p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Unpaid Orders</p>
    <p className="text-2xl font-semibold text-red-500">{unpaidOrders}</p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Crypto Orders</p>
    <p className="text-2xl font-semibold text-purple-600">{cryptoOrders}</p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Card Orders</p>
    <p className="text-2xl font-semibold text-indigo-600">{cardOrders}</p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-xs text-gray-500">Revenue</p>
    <p className="text-2xl font-semibold text-green-600">
      ${totalRevenue.toLocaleString()}
    </p>
  </div>
</div>

      {/* CHART */}
      <div className="p-5 border rounded-xl bg-white">
        <MonthlySalesChart orders={safeOrders} />
      </div>

      {/* REVENUE BREAKDOWN */}
      <div className="grid md:grid-cols-2 gap-4">
  <div className="p-5 border rounded-xl bg-white">
    <p className="text-sm text-gray-500">Crypto Revenue</p>
    <p className="text-2xl font-semibold text-purple-600">
      ${cryptoRevenue.toLocaleString()}
    </p>
  </div>

  <div className="p-5 border rounded-xl bg-white">
    <p className="text-sm text-gray-500">Card Revenue</p>
    <p className="text-2xl font-semibold text-blue-600">
      ${cardRevenue.toLocaleString()}
    </p>
  </div>
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
                <th className="py-3 text-left">Payment</th>
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
                      <td className="py-4 px-2"><Skeleton width={90} height={10} /></td>
                    </tr>
                  ))}
                </>
              ) : safeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No orders found
                  </td>
                </tr>
              ) : (
                safeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-2">{order.email}</td>
                    <td className="py-4 px-2">${Number(order.total_price || 0).toLocaleString()}</td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status || "pending"}
                        </span>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {order.payment_status || "unpaid"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      {order.address || order.shipping_address || order.customer_address || "No address"}
                    </td>
                    <td className="py-4 px-2 text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
  order.payment_method === "crypto"
    ? "bg-purple-100 text-purple-700"
    : order.payment_method === "card"
    ? "bg-blue-100 text-blue-700"
    : "bg-gray-100 text-gray-600"
}`}>
  {order.payment_method || "unknown"}
</span>
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