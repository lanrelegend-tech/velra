import Link from "next/link";
import React from "react";

function Usernavbar() {
  return (
    <div className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-black via-gray-900 to-black text-white shadow-lg border-b border-white/10">
      
      <p className="text-xl md:text-2xl font-semibold tracking-[0.4em] bg-gradient-to-r from-white via-gray-300 to-white text-transparent bg-clip-text">
        V E L R A
      </p>

      <Link href="/">
        <button className="px-4 py-2 text-sm border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300">
          Back to home
        </button>
      </Link>

    </div>
  );
}

export default Usernavbar;