"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [modal, setModal] = useState({ open: false, message: "", type: "success" });
  const [deleteId, setDeleteId] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [categoryFilter, setCategoryFilter] = useState("all");

  // MODAL HELPER
  const openModal = (message, type = "success") => {
    setModal({ open: true, message, type });
    setTimeout(() => {
      setModal({ open: false, message: "", type: "success" });
    }, 2500);
  };

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    setLoading(true);

    try {
      const res = await fetch("https://velra-2.onrender.com/products");
      const data = await res.json();

      setProducts(data || []);
    } catch (err) {
      console.log("Fetch error:", err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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

    try {
      const method = editing?.id ? "PUT" : "POST";
      const url = editing?.id
        ? `https://velra-2.onrender.com/products/${editing.id}`
        : "https://velra-2.onrender.com/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result?.error) {
        console.log("Save error:", result);
        openModal(result?.error || "Failed to save product ❌", "error");
        return;
      }

      openModal(editing ? "Product Updated ✅" : "Product Added ✅");
    } catch (err) {
      console.log("Save error:", err.message);
    }

    resetForm();
    await fetchProducts();
    setProducts((prev) => [...prev]);
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
  const deleteProduct = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`https://velra-2.onrender.com/products/${deleteId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        console.log("Delete error:", result.error);
        return;
      }

      setDeleteId(null);
      fetchProducts();
      openModal("Product deleted 🗑️");
    } catch (err) {
      console.log("Delete error:", err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "all" ||
      (Array.isArray(p.category)
        ? p.category.includes(categoryFilter)
        : p.category === categoryFilter);

    return matchSearch && matchCategory;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalProducts = products.length;
  const inStock = products.filter(p => p.in_stock).length;
  const outStock = products.filter(p => !p.in_stock).length;
  const categoryCount = new Set(products.flatMap(p => p.category || [])).size;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 text-black dark:text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-5 space-y-4 hidden md:block">
        <h1 className="text-xl font-bold">Velra Admin</h1>

        <div className="flex flex-col gap-3 text-sm">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/">Store</Link>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-5 px-3 py-1 bg-gray-800 rounded text-xs"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        <h1 className="text-2xl font-bold mb-4">Products Admin</h1>

        {/* ANALYTICS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
            <p className="text-xs text-gray-400">Total Products</p>
            <p className="text-xl font-bold">{totalProducts}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
            <p className="text-xs text-gray-400">In Stock</p>
            <p className="text-xl font-bold text-green-500">{inStock}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
            <p className="text-xs text-gray-400">Out of Stock</p>
            <p className="text-xl font-bold text-red-500">{outStock}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
            <p className="text-xs text-gray-400">Categories</p>
            <p className="text-xl font-bold">{categoryCount}</p>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">

          <input
            className="border p-2 w-full md:w-64"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border p-2"
          >
            <option value="all">All Categories</option>
            {[...new Set(products.map(p => p.category).flat())]
              .filter(Boolean)
              .map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
          </select>

        </div>

        {/* FORM */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow mb-6">

          <div className="border-dashed border-2 p-4 text-center mb-3"
            onDrop={(e) => {
              e.preventDefault();
              setImageFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            Drag & Drop Image Here
          </div>

          <input type="file" className="mb-3" onChange={(e) => setImageFile(e.target.files[0])} />

          <input placeholder="Name" className="border p-2 w-full mb-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Price" className="border p-2 w-full mb-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <textarea placeholder="Description" className="border p-2 w-full mb-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <button onClick={saveProduct} className="bg-black text-white px-4 py-2 rounded">
            {editing ? "Update" : "Add Product"}
          </button>

        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? "Loading..."
            : paginated.map((p) => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow hover:shadow-lg transition relative">

                  {/* STATUS BADGE */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.in_stock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}>
                      {p.in_stock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <img src={p.image || "/placeholder.png"} className="h-40 w-full object-cover rounded-lg" />

                  <div className="mt-3 font-semibold text-base truncate">{p.name}</div>

                  <div className="flex justify-between items-center mt-1">
                    <div className="text-green-600 font-bold">${p.price}</div>
                    <div className="text-xs text-gray-500">
                      Stock: {p.in_stock ? "Available" : "Empty"}
                    </div>
                  </div>

                  <div className="text-xs opacity-70 mt-1 line-clamp-1">
                    {Array.isArray(p.category) ? p.category.join(", ") : p.category}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-blue-500 text-sm hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                </div>
            ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))}>Prev</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>

      </main>

    </div>
  );
}