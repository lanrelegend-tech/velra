"use client";

import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { useState, useEffect } from "react";
import { getProducts } from "../../../../lib/getProduct";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function MenPage() {
  const [open, setOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [price, setPrice] = useState([10000]);
  const [inStock, setInStock] = useState(true);

  const options = [
    { label: "All", value: "all" },
    { label: "Newest", value: "newest" },
    { label: "Price: Low to High", value: "low-high" },
    { label: "Price: High to Low", value: "high-low" },
  ];

  const [selected, setSelected] = useState(options[0].label);
  const [sortBy, setSortBy] = useState(options[0].value);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getProducts(["men"]);
      setProducts(data);
      setLoading(false);
    };

    load();
  }, []);

  // SORTING
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "high-low":
        return b.price - a.price;

      case "low-high":
        return a.price - b.price;

      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);

      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);

      default:
        return 0;
    }
  });

  // FILTERING (FIXED STOCK FIELD)
  const filteredProducts = sortedProducts
    .filter((item) => item.price <= price[0])
    .filter((item) => {
      if (!inStock) return true;
      return item.in_stock === true;
    });

  return (
    <div className="w-full flex mt-40 mb-30 text-black">

      {/* SIDEBAR */}
      <aside className="w-1/5">
        <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r">
          <Sidebar
            price={price}
            setPrice={setPrice}
            inStock={inStock}
            setInStock={setInStock}
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="w-4/5 px-6">

        {/* FILTER */}
        <div className="flex justify-end mb-6 relative">
          <div
            onClick={() => setOpen(!open)}
            className="text-sm cursor-pointer tracking-wide select-none"
          >
            {selected} ▾
          </div>

          {open && (
            <div className="absolute top-6 right-0 bg-white border shadow-md w-52 z-50">
              {options.map((item) => (
                <p
                  key={item.value}
                  onClick={() => {
                    setSelected(item.label);
                    setSortBy(item.value);
                    setOpen(false);
                  }}
                  className="px-4 py-3 text-sm hover:bg-black hover:text-white cursor-pointer"
                >
                  {item.label}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white flex flex-col shadow-sm rounded-lg overflow-hidden"
                >
                  <div className="w-full h-64">
                    <Skeleton height="100%" />
                  </div>

                  <div className="p-3 flex flex-col gap-2 items-center">
                    <Skeleton width={120} height={12} />
                    <Skeleton width={80} height={12} />
                    <Skeleton width={100} height={30} />

                    <div className="flex gap-2 flex-wrap justify-center">
                      <Skeleton width={40} height={20} />
                      <Skeleton width={40} height={20} />
                    </div>
                  </div>
                </div>
              ))
            : filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white flex flex-col hover:scale-105 transition duration-300 shadow-sm rounded-lg overflow-hidden"
                >

                  <img
                    src={item.image}
                    className="w-full h-64 object-contain bg-neutral-50 p-2"
                  />

                  <div className="p-3 flex flex-col gap-2 items-center">

                    <Link href={`/product/${item.id}`}>
                      <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
                        QUICK VIEW
                      </button>
                    </Link>

                    <p className="text-sm tracking-wide">
                      VELRA {item.name}
                    </p>

                    <p className="font-semibold">${item.price}</p>

                    <div className="flex gap-2 flex-wrap justify-center">
                      {item.sizes?.map((size) => (
                        <span key={size} className="text-xs border px-2 py-1">
                          {size}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              ))}

        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white w-[90%] md:w-[500px] p-5 relative">

            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 right-3 text-xl"
            >
              ✕
            </button>

            <img
              src={selectedProduct.image}
              className="w-full h-72 object-contain bg-neutral-50 p-2"
            />

            <h2 className="mt-3 text-lg font-semibold">
              {selectedProduct.name}
            </h2>

            <p className="font-bold">₦{selectedProduct.price}</p>

            <p className="text-sm text-gray-500 mt-2">
              {selectedProduct.description}
            </p>

            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedProduct.sizes?.map((size) => (
                <span key={size} className="border px-3 py-1 text-xs">
                  {size}
                </span>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MenPage;