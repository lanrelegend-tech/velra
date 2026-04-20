"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Usernavbar from "../components/Usernavbar";
import { supabase } from "../../../lib/supabase";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState({ open: false, message: "" });
  const [signoutModal, setSignoutModal] = useState(false);
  const router = useRouter();

  const openModal = (message) => {
    setModal({ open: true, message });

    setTimeout(() => {
      setModal({ open: false, message: "" });
    }, 2500);
  };

  const handleSignout = async () => {
    await supabase.auth.signOut();
    setSignoutModal(false);
    openModal("Signed out successfully");
    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

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
    openModal("Profile updated ✅");
  };

  if (loading) {
    return (
      <div className="flex  flex-col">
        <Usernavbar />

        <div className="min-h-screen bg-white text-black px-6 py-20 flex justify-center">
          <div className="w-full max-w-2xl">

            <Skeleton width={180} height={25} className="mx-auto mb-12" />

            <div className="border border-black/10 p-8 flex flex-col gap-6">

              <div>
                <Skeleton width={80} height={10} className="mb-2" />
                <Skeleton width={200} height={12} />
              </div>

              <div>
                <Skeleton width={80} height={10} className="mb-2" />
                <Skeleton width={250} height={20} />
              </div>

              <div>
                <Skeleton width={80} height={10} className="mb-2" />
                <Skeleton width={250} height={20} />
              </div>

              <div>
                <Skeleton width={80} height={10} className="mb-2" />
                <Skeleton width={250} height={20} />
              </div>

            </div>

            <div className="mt-8">
              <Skeleton height={45} />
            </div>

            <div className="mt-10 space-y-4">
              <Skeleton height={45} />
              <Skeleton height={45} />
            </div>

          </div>
        </div>
      </div>
    );
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

            <button
              onClick={() => setSignoutModal(true)}
              className="w-full mt-4 bg-black text-white py-3 text-xs tracking-widest"
            >
              SIGN OUT
            </button>
          </div>

        </div>
      </div>

      {signoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow w-[90%] max-w-sm text-center">
            <h2 className="text-sm text-black font-semibold mb-3">Confirm Sign Out</h2>

            <p className="text-xs text-black mb-6">
              Are you sure you want to sign out?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSignoutModal(false)}
                className="px-3 py-1 bg-gray-200 text-black text-xs rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSignout}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded"
              >
                Yes, Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-5 rounded shadow w-[90%] max-w-sm text-center">
            <p className="text-sm font-medium">{modal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}