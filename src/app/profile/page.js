"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Usernavbar from "../components/Usernavbar";
import { supabase } from "../../../lib/supabase";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    email: "",
    name: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const authName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "";

        const { data, error } = await supabase
          .from("profiles")
          .select("name, address, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.log("Profile fetch error:", error.message);
        }

        setProfile((prev) => ({
          ...prev,
          email: user.email || "",
          name: data?.name?.trim() ? data.name : authName,
          address: data?.address || "",
          phone: data?.phone || "",
        }));
      } catch (err) {
        console.log("Profile load failed:", err.message);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
    });

    setEditing(false);
    alert("Profile updated");
  };

  if (loading) {
    return <p className="p-10 text-center">Loading...</p>;
  }

  return (
    <div className="flex flex-col">
      <Usernavbar />

      <div className="min-h-screen bg-white text-black px-6 py-20 flex justify-center">
        <div className="w-full max-w-2xl">

          <h1 className="text-2xl tracking-[0.3em] text-center mb-12">
            PROFILE
          </h1>

          <div className="border border-black/10 p-8 flex flex-col gap-6">

            <div>
              <p className="text-xs tracking-widest text-gray-500 mb-2">EMAIL</p>
              <p className="text-sm">{profile.email}</p>
            </div>

            <div>
              <p className="text-xs tracking-widest text-gray-500 mb-2">NAME</p>
              {editing ? (
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
              ) : (
                <p className="text-sm">{profile.name}</p>
              )}
            </div>

            <div>
              <p className="text-xs tracking-widest text-gray-500 mb-2">ADDRESS</p>
              {editing ? (
                <input
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
              ) : (
                <p className="text-sm">{profile.address}</p>
              )}
            </div>

            <div>
              <p className="text-xs tracking-widest text-gray-500 mb-2">PHONE</p>
              {editing ? (
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
              ) : (
                <p className="text-sm">{profile.phone}</p>
              )}
            </div>

          </div>

          <div className="mt-8 flex gap-4">
            {editing ? (
              <button
                onClick={handleSave}
                className="w-full bg-black text-white py-3 text-xs tracking-widest"
              >
                SAVE
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full border border-black py-3 text-xs tracking-widest"
              >
                EDIT PROFILE
              </button>
            )}
          </div>

          <div className="mt-10">
            <Link href="/order">
              <button className="w-full border border-black py-3 text-xs tracking-widest hover:bg-black hover:text-white transition">
                VIEW ORDERS
              </button>
            </Link>

            <Link href="/">
              <button className="w-full mt-4 bg-black text-white py-3 text-xs tracking-widest">
                SIGN OUT
              </button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}