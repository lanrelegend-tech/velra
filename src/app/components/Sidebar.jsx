"use client";

import * as Slider from "@radix-ui/react-slider";

function Sidebar({ price, setPrice, inStock, setInStock }) {
  return (
    <div className="flex flex-col gap-10 p-4 text-sm text-black w-full md:w-[280px] max-h-screen overflow-y-auto">

      {/* AVAILABILITY */}
      <div>
        <h1 className="font-semibold mb-3">Availability</h1>

        <div className="flex items-center justify-between">
          <p>In stock</p>

          <button
            onClick={() => setInStock(!inStock)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
              inStock ? "bg-black" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition transform ${
                inStock ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* PRICE */}
      <div>
        <h1 className="font-semibold mb-4">Price</h1>

        <p className="mb-3">
          Up to: <span className="font-medium">${price[0]}</span>
        </p>

        <Slider.Root
          className="relative flex items-center w-full h-5"
          value={price}
          max={10000}
          step={10}
          onValueChange={setPrice}
        >
          <Slider.Track className="bg-gray-300 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-black h-full rounded-full" />
          </Slider.Track>

          <Slider.Thumb className="w-4 h-4 bg-black rounded-full shadow" />
        </Slider.Root>

        <div className="flex justify-between text-xs mt-3">
          <span>$0</span>
          <span>$10000</span>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;