"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getProducts } from "../../../lib/getProduct";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function Femalecloths() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getProducts(["women"]);
      setProducts(data);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="w-full py-24 px-10 font-sans text-black">

      <h1 className="text-center text-4xl tracking-[0.4em] font-[var(--font-playfair)]">
        Ladies
      </h1>

      <p className="text-center mt-3 mb-12 text-gray-500 tracking-wide">
        Explore our new Ladies collection
      </p>

      <div className="flex overflow-x-auto gap-6 pb-4 scroll-smooth">

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
                </div>
              </div>
            ))
          : products.map((item) => (
            <div
              key={item.id}
              className="bg-white flex flex-col hover:scale-105 transition duration-300 shadow-sm rounded-lg overflow-hidden min-w-[250px] flex-shrink-0"
            >

              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-contain bg-neutral-50 p-2"
              />

              <div className="p-3 flex flex-col gap-2 items-center">
                <Link href={`/product/${item.id}`}>
                  <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
                    QUICK VIEW
                  </button>
                </Link>

                <p className="text-sm tracking-wide">VELRA {item.name}</p>
                <p className="font-semibold">${item.price}</p>

                {/* Sizes (optional display instead of colors) */}
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                  {item.sizes?.map((size) => (
                    <span
                      key={size}
                      className="text-xs border px-2 py-1"
                    >
                      {size}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          ))}

      </div>
    </div>
  );
}

export default Femalecloths;