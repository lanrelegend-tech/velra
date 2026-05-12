"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("https://velra-2.onrender.com/admin/dashboard");

        if (!res.ok) {
          router.push("/login");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.log("❌ ADMIN CHECK FAILED:", err.message);
        router.push("/login");
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">

        {/* NAVBAR SKELETON */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl mb-6 px-6 py-4 flex items-center justify-between">
          <Skeleton width={120} height={20} />

          <div className="flex gap-4">
            <Skeleton width={60} height={15} />
            <Skeleton width={60} height={15} />
            <Skeleton width={60} height={15} />
            <Skeleton width={60} height={15} />
          </div>
        </div>

        {/* TITLE SKELETON */}
        <div className="mt-20 mb-6">
          <Skeleton width={220} height={35} />
        </div>

        {/* CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow">
              <Skeleton width={180} height={20} />
              <Skeleton width={260} height={15} className="mt-4" />
            </div>
          ))}
        </div>

      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-100 flex">

    {/* SIDEBAR */}
    <aside className="w-64 bg-white border-r h-screen p-5 hidden md:block">
      <h1 className="text-xl font-bold mb-8">Velra Admin</h1>

      <nav className="flex flex-col gap-4 text-sm">
        <Link href="/admin" className="text-gray-700 hover:text-black font-medium">
          Dashboard
        </Link>

        <Link href="/admin/products" className="text-gray-700 hover:text-black font-medium">
          Products
        </Link>

        <Link href="/admin/orders" className="text-gray-700 hover:text-black font-medium">
          Orders
        </Link>

        <Link href="/" className="text-gray-700 hover:text-black font-medium">
          Storefront
        </Link>
      </nav>
    </aside>

    {/* MAIN AREA */}
    <div className="flex-1">

      {/* TOP BAR */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <input
          placeholder="Search orders, products..."
          className="w-1/2 px-4 py-2 border rounded-lg text-sm outline-none"
        />

        <div className="text-sm font-medium">Admin Panel</div>
      </div>

      {/* CONTENT */}
      <div className="p-6">

        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Total Sales</p>
            <h2 className="text-xl font-bold">₦0</h2>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Orders</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Products</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Customers</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link href="/admin/products">
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
              <h2 className="text-lg font-semibold">Manage Products</h2>
              <p className="text-gray-500 text-sm mt-2">
                Add, edit, and manage your store inventory
              </p>
            </div>
          </Link>

          <Link href="/admin/orders">
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer">
              <h2 className="text-lg font-semibold">View Orders</h2>
              <p className="text-gray-500 text-sm mt-2">
                Track and update customer orders
              </p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  </div>
);
}