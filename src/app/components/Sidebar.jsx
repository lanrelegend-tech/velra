
"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

function Sidebar() {
  const [price, setPrice] = useState([1500]);
  const [inStock, setInStock] = useState(true);

  return (
    <div className="flex flex-col gap-10 p-4 text-sm text-black font-sans">

      {/* AVAILABILITY */}
      <div>
        <h1 className="font-semibold mb-3 text-black">Availability</h1>

        <div className="flex items-center justify-between">

          <p className="text-black">
            In stock
          </p>

          {/* TOGGLE */}
          <button
            onClick={() => setInStock(!inStock)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
              inStock ? "bg-black" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow transform transition ${
                inStock ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>

        </div>
      </div>

      {/* PRICE */}
      <div>
        <h1 className="font-semibold mb-4 text-black">Price</h1>

        <p className="mb-4 text-black">
          Up to:{" "}
          <span className="font-medium text-black">
            ${price[0]}
          </span>
        </p>

        {/* SLIDER */}
        <Slider.Root
          className="relative flex items-center w-full h-5"
          value={price}
          max={1500}
          step={10}
          onValueChange={setPrice}
        >
          <Slider.Track className="bg-gray-300 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-black rounded-full h-full" />
          </Slider.Track>

          <Slider.Thumb className="block w-4 h-4 bg-black rounded-full shadow hover:scale-110 transition" />
        </Slider.Root>

        <div className="flex justify-between text-xs text-black mt-3">
          <span>$0</span>
          <span>$1500</span>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;