"use client";

import Link from "next/link";
import MonthlySalesChart from "@/app/components/MonthlySalesChart";
import ConditionalNavbar from "../../components/ConditionalNavbar";
import { useMemo } from "react";
import { supabase } from "../../../../lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function DashboardOverview() {
  const queryClient = useQueryClient();

  // ✅ FETCH ORDERS (TanStack Query)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <ConditionalNavbar />

      {/* HEADER */}
      <div className="mb-6 mt-20">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm">
          Real-time business performance
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow">
          Total Orders: {totalOrders}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          Revenue: ₦{totalRevenue.toLocaleString()}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          Customers: {totalCustomers}
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white p-4 rounded-xl shadow mb-8">
        <MonthlySalesChart orders={safeOrders} />
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-4">Orders</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th>Email</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : safeOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No orders found
                  </td>
                </tr>
              ) : (
                safeOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td>{order.email}</td>
                    <td>₦{Number(order.total || 0).toLocaleString()}</td>
                    <td>{order.status || "pending"}</td>
                    <td className="flex gap-2">
                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "delivered")
                        }
                        className="text-green-600"
                      >
                        Deliver
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "pending")
                        }
                        className="text-yellow-600"
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