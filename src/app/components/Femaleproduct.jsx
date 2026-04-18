"use client";
import Link from "next/link";

import { useState ,useEffect} from "react";
import { getProducts } from "../../../lib/getProduct";


function Femaleproduct() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Featured");
  const [products, setProducts] = useState([]);

  const options = [
    "Featured",
    "Newest",
    "Price: Low to High",
    "Price: High to Low",
  ];

  useEffect(() => {
      const load = async () => {
        const data = await getProducts(["women"]);
        setProducts(data);
      };
  
      load();
    }, []);

  return (
    <div className="w-full py-20 px-10 font-sans text-black">

      {/* TOP FILTER BAR */}
      <div className="flex items-end justify-end mb-10 relative">

        {/* SELECTED FILTER */}
        <div
          onClick={() => setOpen(!open)}
          className="text-sm cursor-pointer tracking-wide select-none"
        >
          {selected} ▾
        </div>

        {/* DROPDOWN */}
        {open && (
          <div className="absolute top-6 right-0 bg-white border shadow-md w-52 z-50">

            {options.map((item) => (
              <p
                key={item}
                onClick={() => {
                  setSelected(item);
                  setOpen(false);
                }}
                className="px-4 py-3 text-sm hover:bg-black hover:text-white cursor-pointer transition"
              >
                {item}
              </p>
            ))}

          </div>
        )}
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

        {products.map((item) => (
          <div
            key={item.id}
            className="bg-white flex flex-col hover:scale-105 transition duration-300 shadow-sm"
          >

            <img
              src={item.image}
              alt={item.name}
              className="w-full h-72 object-cover"
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

export default Femaleproduct;