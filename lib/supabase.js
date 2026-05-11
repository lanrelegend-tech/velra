import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// SAFE CLIENT (lazy init)
export const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase env missing");
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

// 🔥 BACKWARD COMPATIBILITY (FIXES YOUR BUILD ERROR)
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;