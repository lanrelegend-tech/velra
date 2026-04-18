import { supabase } from "./supabase";

/**
 * GET PRODUCTS (with optional category)
 */
export const getProducts = async (category = null) => {
  let query = supabase.from("products").select("*");

  if (category && category !== "all") {
    query = query.contains("category", [category]);
  }

  const { data, error } = await query.order("id", { ascending: false });

  if (error) {
    console.log(error.message);
    return [];
  }

  return data;
};

/**
 * BACKEND SEARCH PRODUCTS
 */
export const searchProducts = async (searchTerm = "") => {
  if (!searchTerm) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${searchTerm}%`);

  if (error) {
    console.log(error.message);
    return [];
  }

  return data;
};