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
        const res = await fetch("https://velra-1.onrender.com/admin/dashboard");

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
    <div className="min-h-screen  text-black bg-gray-100 p-6">
      {/* ADMIN NAVBAR */}
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
              LogOut
            </span>
          </Link>
        </div>
      </div>

      <h1 className="text-3xl mt-20 font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Link href="/admin/products">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg cursor-pointer">
            <h2 className="text-xl font-semibold">Manage Products</h2>
            <p className="text-gray-500 mt-2">
              Add, edit or delete products
            </p>
          </div>
        </Link>

        <Link href="/admin/orders">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg cursor-pointer">
            <h2 className="text-xl font-semibold">View Orders</h2>
            <p className="text-gray-500 mt-2">
              See customer orders and update status
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}