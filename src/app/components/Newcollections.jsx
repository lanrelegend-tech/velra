function Newcollections() {
  return (
    <div className="w-full py-20 px-10 font-sans text-black">

      <h1 className="text-center text-4xl tracking-[0.4em] font-[var(--font-playfair)]">
        New In
      </h1>

      <p className="text-center mt-3 mb-12 text-gray-500 tracking-wide">
        Explore our new collection
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

        {/* CARD */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">

          <img
            src="/maleshoe1.jpg"
            alt="product"
            className="w-full h-72 object-cover"
          />

          <div className="p-3 flex flex-col gap-2 items-center">

            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>

            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold tracking-wider">$5,000</p>

            {/* COLOR OPTIONS */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Available:</span>

              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full border bg-black cursor-pointer"></div>
                <div className="w-4 h-4 rounded-full border bg-white cursor-pointer"></div>
              </div>
            </div>

          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/fullcloth1.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>

            <div className="flex gap-2 mt-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <div className="w-4 h-4 rounded-full bg-white border"></div>
            </div>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/maletop3.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>

            <div className="flex gap-2 mt-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <div className="w-4 h-4 rounded-full bg-white border"></div>
            </div>
          </div>
        </div>

        {/* CARD 4 */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/fullcloth2.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>

            <div className="flex gap-2 mt-2">
              <div className="w-4 h-4 rounded-full bg-black"></div>
              <div className="w-4 h-4 rounded-full bg-white border"></div>
            </div>
          </div>
        </div>

        {/* CARD 5 */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/maletop5.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

        {/* CARD 6 */}
        <div className="bg-white text-black flex flex-col hover:scale-105 transition duration-300 shadow-sm">
          <img src="/maletop2.jpg" className="w-full h-72 object-cover" />
          <div className="p-3 flex flex-col gap-2 items-center">
            <button className="bg-black text-white px-6 py-2 text-xs tracking-widest mt-2 hover:opacity-80 transition">
              QUICK VIEW
            </button>
            <p className="text-sm tracking-wide">HF Tee 023DXP</p>
            <p className="font-semibold">$5,000</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Newcollections;