import { createClient } from "@supabase/supabase-js";

export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase env missing - client not created");
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};