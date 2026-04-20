"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import Link from "next/link";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    sizes: "",
    in_stock: true,
    image: "",
  });

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("Fetch error:", error.message);
      return;
    }

    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      description: "",
      category: "",
      sizes: "",
      in_stock: true,
      image: "",
    });
    setImageFile(null);
    setEditing(null);
  };

  // UPLOAD IMAGE
  const uploadImage = async () => {
  if (!imageFile) {
    return editing?.image || null;
  }

  const filePath = `products/${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.log("UPLOAD ERROR:", uploadError.message);
    return null;
  }

  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(filePath);

  console.log("UPLOAD DEBUG DATA:", data);

  return data?.publicUrl || null;
};

  // SAVE PRODUCT
  const saveProduct = async () => {
    const imageUrl = await uploadImage();
    const finalImage = imageUrl || editing?.image || "";

    const payload = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      category: (form.category || "").split(",").map(c => c.trim()).filter(Boolean),
      sizes: (form.sizes || "").split(",").map(s => s.trim()).filter(Boolean),
      in_stock: form.in_stock,
      image: finalImage,
    };

    if (editing?.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editing.id);

      if (error) {
        console.log("Update error:", error.message);
        return;
      }

      alert("Updated ✅");
    } else {
      const { error } = await supabase
        .from("products")
        .insert([payload]);

      if (error) {
        console.log("Insert error:", error.message);
        return;
      }

      alert("Added ✅");
    }

    resetForm();
    fetchProducts();
  };

  // EDIT PRODUCT
  const startEdit = (product) => {
    setEditing(product);

    setForm({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      category: Array.isArray(product.category)
        ? product.category.join(",")
        : product.category || "",
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(",")
        : product.sizes || "",
      in_stock: product.in_stock ?? true,
      image: product.image || "",
    });
  };

  // DELETE PRODUCT
  const deleteProduct = async (id) => {
    if (!confirm("Delete product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Delete error:", error.message);
      return;
    }

    fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen  bg-gray-100 p-6 text-black">

      {/* ADMIN NAVBAR */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl mb-6 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          Admin Panel
        </h2>

        <div className="flex gap-4 text-sm">
          <Link href="/admin">
            <span className="text-gray-700 hover:text-black font-medium">
              Dashboard
            </span>
          </Link>

          <Link href="/admin/products">
            <span className="text-gray-700 hover:text-black font-medium">
              Products
            </span>
          </Link>

          <Link href="/admin/orders">
            <span className="text-gray-700 hover:text-black font-medium">
              Orders
            </span>
          </Link>

          <Link href="/">
            <span className="text-gray-700 hover:text-black font-medium">
              Store
            </span>
          </Link>
        </div>
      </div>

      <h1 className="text-2xl font-bold mt-20 mb-4">Products Admin</h1>

      <input
        className="border p-2 w-full mb-6"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FORM */}
      <div className="bg-white p-4 rounded shadow mb-6">

        <input
          placeholder="Name"
          className="border p-2 w-full mb-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Price"
          className="border p-2 w-full mb-2"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full mb-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          placeholder="Category (comma separated)"
          className="border p-2 w-full mb-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          placeholder="Sizes (S,M,L)"
          className="border p-2 w-full mb-2"
          value={form.sizes}
          onChange={(e) => setForm({ ...form, sizes: e.target.value })}
        />

        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={form.in_stock}
            onChange={(e) =>
              setForm({ ...form, in_stock: e.target.checked })
            }
          />
          In Stock
        </label>

        <input
          type="file"
          className="mb-3"
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        <button
          onClick={saveProduct}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {editing ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {filtered.map((p) => (
          <div key={p.id} className="bg-white p-3 rounded shadow">

            <img
              src={p.image || "/placeholder.png"}
              className="h-32 w-full object-contain mb-2"
            />

            <h3 className="font-semibold">{p.name}</h3>
            <p>₦{p.price}</p>
            <p className="text-xs">
              {Array.isArray(p.category) ? p.category.join(", ") : p.category}
            </p>
            <p className="text-xs">{p.description}</p>
            <p className="text-xs">
              {Array.isArray(p.sizes) ? p.sizes.join(", ") : p.sizes}
            </p>

            <div className="flex justify-between mt-2">
              <button onClick={() => startEdit(p)} className="text-blue-500 text-sm">
                Edit
              </button>

              <button onClick={() => deleteProduct(p.id)} className="text-red-500 text-sm">
                Delete
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}