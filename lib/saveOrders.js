import { supabase } from "./supabase";

export const saveOrder = async (order) => {
  const { data, error } = await supabase
    .from("orders")
    .insert([order])
    .select(); // 🔥 IMPORTANT

  if (error) {
    console.log("❌ Order save error FULL:", error);
    alert(error.message); // 👈 shows real issue
    return null;
  }

  console.log("✅ Order saved:", data);
  return data;
};