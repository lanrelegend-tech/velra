

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts } from "../../../lib/getProduct";

function Newcollections() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getProducts(["np"]);
      setProducts(data || []);
    };

    load();
  }, []);

  return (
    <div className="w-full py-24 px-6 md:px-10 font-sans text-black">

      <h1 className="text-center text-4xl tracking-[0.4em] font-[var(--font-playfair)]">
        N E W I N
      </h1>

      <p className="text-center mt-3 mb-12 text-gray-500 tracking-wide">
        Explore our new collection
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {products.map((item) => (
          <div
            key={item.id}
            className="bg-white flex flex-col hover:scale-105 transition duration-300 shadow-sm rounded-lg overflow-hidden"
          >

            <img
              src={item.image}
              alt={item.name}
              className="w-full h-72 object-contain bg-neutral-50 p-2"
            />

            <div className="p-4 flex flex-col gap-2 items-center">

              <Link href={`/product/${item.id}`}>
                <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
                  QUICK VIEW
                </button>
              </Link>

              <p className="text-sm tracking-wide text-center">
                VELRA {item.name}
              </p>

              <p className="font-semibold">
                ${item.price?.toLocaleString()}
              </p>

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

export default Newcollections;