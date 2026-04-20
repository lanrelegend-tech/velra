"use client";

import { useCart } from "../context/CartContext";
import PaystackPop from "@paystack/inline-js";
import Link from "next/link";
import { BsCartX, BsList, BsX } from "react-icons/bs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoSearch } from "react-icons/go";
import { CiShoppingCart } from "react-icons/ci";
import { useRouter } from "next/navigation";
import { searchProducts } from "../../../lib/getProduct";
import { CiLogin } from "react-icons/ci";

function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

 const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [mobileOpen, setMobileOpen] = useState(false);

  // SCROLL EFFECT
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔒 LOCK BODY SCROLL (IMPORTANT FIX)
  useEffect(() => {
    if (cartOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [cartOpen, searchOpen]);

  // 🔥 DEBOUNCE SEARCH (FIXED)
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      const data = await searchProducts(search);
      setResults(data);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="group fixed top-0 left-0 right-0 w-screen z-50">

      {/* BACKGROUND */}
      <div
        className={`absolute inset-0 bg-black transition duration-500 ${
          isHome && !scrolled ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      />

      <div className="relative flex items-center justify-between px-10 py-6 text-white border-b border-white/20">

        {/* LEFT */}
        <div className="hidden md:flex gap-6 text-xs tracking-widest">
          <Link href="/">HOME</Link>

          <div className="relative">
            <div onClick={() => setShopOpen(!shopOpen)} className="cursor-pointer">
              SHOP
            </div>

            {shopOpen && (
              <div className="absolute top-full mt-2 bg-black p-4 flex flex-col gap-3 text-xs z-50">
                <Link href="/shop">All Products</Link>
                <Link href="/shop/men">Men</Link>
                <Link href="/shop/women">Women</Link>
                <Link href="/shop/accessories">Accessories</Link>
              </div>
            )}
          </div>

          <Link href="/about">ABOUT</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">CONTACT</Link>
        </div>

        {/* BRAND */}
        <div className="text-xl tracking-[0.5em]">V E L R A</div>

        {/* RIGHT */}
        <div className="flex gap-6 items-center text-xs">

         <Link href="/login" className="hidden md:block">Login</Link>

          <div className="md:hidden">
            <BsList size={26} onClick={() => setMobileOpen(true)} />
          </div>

          <GoSearch size={20} onClick={() => setSearchOpen(true)} />

          <div className="relative">
            <CiShoppingCart size={25} onClick={() => setCartOpen(true)} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </div>
        </div>

        {/* CART SIDEBAR */}
        {cartOpen && (
          <div className="fixed inset-0 z-50">

            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setCartOpen(false)}
            />

            {/* PANEL */}
            <div className="absolute right-0 top-0 h-full w-full md:w-[520px] bg-white text-black flex flex-col">

              <div className="p-5 border-b flex justify-between">
                <h2>CART</h2>
                <button onClick={() => setCartOpen(false)}>×</button>
              </div>

              {/* SCROLL AREA */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                    <BsCartX size={70} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item, i) => (
                    <div key={i} className="flex gap-3 border p-3">

                      <img src={item.image} className="w-16 h-16 object-contain" />

                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p>Size: {item.size}</p>
                        <p>Qty: {item.qty}</p>

                        <div className="flex gap-2 items-center mt-2">
                          <button  className="px-2 border" onClick={() => updateQty(item.id, item.size, "dec")}>-</button>
                          <span>{item.qty}</span>
                          <button className="px-2 border" onClick={() => updateQty(item.id, item.size, "inc")}>+</button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>

                    </div>
                  ))
                )}

              </div>
              {/* FOOTER ACTIONS */}
<div className="border-t p-4 space-y-3">

  <button
    onClick={clearCart}
    className="w-full border py-2 text-sm hover:bg-black hover:text-white transition"
  >
    Clear Cart
  </button>

  <button
    onClick={() => {
      setCartOpen(false);
      localStorage.setItem("fromCart", "true");
  router.push("/login");
    }}
    className="w-full bg-black text-white py-2 text-sm hover:opacity-80 transition"
  >
    Proceed to Payment
  </button>

</div>
            </div>
          </div>
        )}

        {/* SEARCH SIDEBAR */}
        {searchOpen && (
          <div className="fixed inset-0 z-50">

            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSearchOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-full md:w-[520px] bg-white text-black flex flex-col">

              <div className="p-5 border-b flex justify-between">
                <h2>SEARCH</h2>
                <button onClick={() => setSearchOpen(false)}>×</button>
              </div>

              <div className="p-5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-b py-2 outline-none"
                  placeholder="Search products..."
                />
              </div>

              <div className="flex-1 overflow-y-auto p-5">

                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      router.push(`/product/${item.id}`);
                      setSearchOpen(false);
                      setSearch("");
                    }}
                    className="flex gap-3 border p-3 cursor-pointer hover:bg-gray-100"
                  >
                    <img src={item.image} className="w-12 h-12 object-cover" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs opacity-70">₦{item.price}</p>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </div>
        )}

      </div>

      {mobileOpen && (
  <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">

    {/* HEADER */}
    <div className="flex justify-between items-center p-6 border-b border-white/20">
      <p className="tracking-[0.2em]">V E L R A</p>
      <BsX size={30} onClick={() => setMobileOpen(false)} />
    </div>

    {/* LINKS */}
    <div className="flex flex-col gap-6 p-10 text-lg">

      <Link href="/" onClick={() => setMobileOpen(false)}>HOME</Link>

      <p className="text-sm opacity-70">SHOP</p>
      <Link href="/shop" onClick={() => setMobileOpen(false)}>All Products</Link>
      <Link href="/shop/men" onClick={() => setMobileOpen(false)}>Men</Link>
      <Link href="/shop/women" onClick={() => setMobileOpen(false)}>Women</Link>
      <Link href="/shop/accessories" onClick={() => setMobileOpen(false)}>Accessories</Link>

      <Link href="/about" onClick={() => setMobileOpen(false)}>ABOUT</Link>
      <Link href="/faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
      <Link href="/contact" onClick={() => setMobileOpen(false)}>CONTACT</Link>
      <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
        <CiLogin />
        LOGIN
      </Link>

    </div>

  </div>
)}

    </div>
  );
}

export default Navbar;