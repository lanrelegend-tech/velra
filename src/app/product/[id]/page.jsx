"use client";

import { useCart } from "@/app/context/CartContext";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      console.log("URL ID:", id);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", Number(id)); // int8 safe

      console.log("RAW DATA:", data);
      console.log("RAW ERROR:", error);

      if (error) {
        console.log("Supabase error:", error.message);
        setLoading(false);
        return;
      }

      const item = data?.[0] || null;

      setProduct(item);

      // 🔥 FETCH RELATED PRODUCTS (simple fallback: other products)
      if (item) {
        const { data: relatedData } = await supabase
          .from("products")
          .select("*")
          .neq("id", item.id)
          .limit(4);

        setRelated(relatedData || []);
      }

      // set default size safely
      if (item?.sizes?.length) {
        setSize(item.sizes[0]);
      }

      setLoading(false);
    };

    if (id) loadProduct();
  }, [id]);

  // 🔥 LOADING STATE (clean & safe)
  if (loading) {
    return <div className="p-10 text-center">Loading product...</div>;
  }

  // 🔥 NOT FOUND STATE
  if (!product) {
    return <div className="p-10 text-center">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-white px-6 mt-40 py-20 text-black">
      <div className="max-w-6xl mx-auto">

        {/* 3 COLUMN LAYOUT */}
        <div className="grid md:grid-cols-3 gap-10 items-start">

          {/* LEFT - IMAGE (SMALLER, CLEAN) */}
          <div className="md:sticky md:top-20">
            <div className="rounded-2xl border bg-neutral-50 p-4">
              <img
                src={product.image}
                className="w-full max-h-[520px] object-contain rounded-xl hover:scale-[1.02] transition"
              />
            </div>
          </div>

          {/* MIDDLE - PRODUCT DETAILS */}
          <div className="flex flex-col gap-6">

            <h1 className="text-3xl font-light tracking-wide">
              {product.name}
            </h1>

            <p className="text-xl font-semibold">
              ${product.price.toLocaleString()}
            </p>

            {/* SIZE */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-gray-500 mb-2">
                  Select Size
                </p>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-4 py-2 border rounded-full text-sm ${
                        size === s ? "bg-black text-white" : ""
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QTY */}
            <div>
              <p className="text-xs uppercase text-gray-500 mb-2">
                Quantity
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                  className="w-9 h-9 border rounded-full"
                >
                  -
                </button>

                <span className="font-medium">{qty}</span>

                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 border rounded-full"
                >
                  +
                </button>
              </div>
            </div>

            {/* TOTAL */}
            <div className="pt-2 border-t font-semibold">
              Total: ${(product.price * qty).toLocaleString()}
            </div>

            {/* ADD TO CART */}
            <button
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  size,
                  qty,
                })
              }
              className="w-full bg-black text-white py-3 rounded-xl"
            >
              Add to Cart
            </button>
          </div>

          {/* RIGHT - RELATED PRODUCTS (SIDE BY SIDE / GRID) */}
          <div>
            <h2 className="text-sm uppercase tracking-widest mb-4 text-gray-500">
              Related
            </h2>

            {related.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {related.map((item) => (
                  <a
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="flex gap-3 border rounded-xl p-2 hover:shadow-sm transition bg-white"
                  >
                    <img
                      src={item.image}
                      className="w-16 h-16 object-cover rounded-md"
                    />

                    <div className="flex flex-col justify-center">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${item.price?.toLocaleString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No related products</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}