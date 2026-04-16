"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoSearch } from "react-icons/go";
import { CiShoppingCart } from "react-icons/ci";

function Navbar() {
  const pathname = usePathname();
  const isShop = pathname === "/shop";

  return (
    <div className="group fixed top-0 left-0 w-full z-50">

      {/* BACKGROUND */}
      <div
        className={`absolute inset-0 bg-black transition duration-500 ${
          isShop ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      ></div>

      {/* CONTENT */}
      <div className="relative flex items-center justify-between px-10 py-6 text-white border-b border-white/20">

        {/* LEFT */}
        <div className="flex gap-6 text-xs tracking-widest">

          {/* HOME */}
          <Link href="/" className="relative group/item">
            HOME
            <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/item:w-full"></span>
          </Link>

          {/* SHOP WITH DROPDOWN */}
          <div className="relative group/shop">

            <Link href="/shop" className="relative">
              SHOP
              <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/shop:w-full"></span>
            </Link>

            {/* DROPDOWN */}
            <div className="absolute left-0 top-6 hidden group-hover/shop:flex flex-col bg-black/90 backdrop-blur-md text-xs w-44 p-3 gap-3">

              <Link href="/shop" className="relative group/drop">
                All Products
                <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
              </Link>

             <Link href="/shop/men" className="relative group/drop">
  Men
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>

             <Link href="/shop/women" className="relative group/drop">
  Women
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>

      <Link href="/shop/accessories" className="relative group/drop">
  Accessories
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>


            </div>
          </div>

          {/* OTHER LINKS */}
         
              <Link href="/about" className="relative group/drop">
  About
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>

              <Link href="/faq" className="relative group/drop">
  FAQ
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>

             <Link href="/contact" className="relative group/drop">
  Contact
  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/drop:w-full"></span>
</Link>

        </div>

        {/* BRAND */}
        <div className="text-xl tracking-[0.5em] font-[var(--font-playfair)]">
          V E L R A
        </div>

        {/* RIGHT */}
        <div className="flex gap-6 items-center text-xs tracking-widest">

          <p className="relative group/item cursor-pointer">
            LOGIN
            <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white transition-all duration-300 group-hover/item:w-full"></span>
          </p>

          <GoSearch size={20} className="cursor-pointer hover:opacity-70 transition" />
          <CiShoppingCart size={25} className="cursor-pointer hover:opacity-70 transition" />

        </div>

      </div>
    </div>
  );
}

export default Navbar;