
"use client";

import { useState } from "react";

function Allproduct() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Featured");

  const options = [
    "Featured",
    "Newest",
    "Price: Low to High",
    "Price: High to Low",
  ];

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

        {/* CARD 1 */}
        <div className="bg-white flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/maleshoe1.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">

            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>

            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>

            <div className="flex gap-2 mt-2">
              <div className="w-4 h-4 rounded-full bg-black border"></div>
              <div className="w-4 h-4 rounded-full bg-white border"></div>
            </div>

          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white flex flex-col hover:scale-105 transition shadow-sm">
          <img src="/fullcloth1.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white flex flex-col hover:scale-105 transition shadow-sm">
          <img src="/maletop3.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

        {/* CARD 4 */}
        <div className="bg-white flex flex-col hover:scale-105 transition shadow-sm">
          <img src="/fullcloth2.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

        {/* CARD 5 */}
        <div className="bg-white flex flex-col hover:scale-105 transition shadow-sm">
          <img src="/maletop5.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

        {/* CARD 6 */}
        <div className="bg-white flex flex-col hover:scale-105 transition shadow-sm">
          <img src="/maletop2.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Allproduct;