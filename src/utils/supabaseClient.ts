import { createClient } from "@supabase/supabase-js";
import { Food, Order, User } from "../types";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://cqnqkyjfjidgojfytmmk.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_qtEDuEww2AoSzWPf0PcoDg_ERzZYtTS";

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY" &&
  supabaseUrl.trim() !== "" &&
  supabaseAnonKey.trim() !== ""
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helpers to map data fields
export function mapFoodFromDb(dbFood: any): Food {
  return {
    id: dbFood.id,
    name: dbFood.name,
    description: dbFood.description || "",
    price: Number(dbFood.price),
    category: dbFood.category,
    image: dbFood.image || "",
    available: dbFood.available !== false,
    rating: Number(dbFood.rating || 4.5),
    createdAt: dbFood.created_at || dbFood.createdAt || new Date().toISOString()
  };
}

export function mapOrderFromDb(dbOrder: any): Order {
  let items = dbOrder.food_items || dbOrder.foodItems;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  return {
    id: dbOrder.id,
    userId: dbOrder.user_id || dbOrder.userId,
    userName: dbOrder.user_name || dbOrder.userName || "Guest Customer",
    userEmail: dbOrder.user_email || dbOrder.userEmail || "",
    foodItems: Array.isArray(items) ? items : [],
    totalQuantity: Number(dbOrder.total_quantity || dbOrder.totalQuantity || 0),
    totalPrice: Number(dbOrder.total_price || dbOrder.totalPrice || 0),
    deliveryAddress: dbOrder.delivery_address || dbOrder.deliveryAddress || "",
    phone: dbOrder.phone || "",
    paymentStatus: (dbOrder.payment_status || dbOrder.paymentStatus || "Pending") as "Pending" | "Paid" | "Refunded",
    orderStatus: (dbOrder.order_status || dbOrder.orderStatus || "Pending") as any,
    createdAt: dbOrder.created_at || dbOrder.createdAt || new Date().toISOString()
  };
}

export function mapUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone || "",
    address: dbUser.address || "",
    role: (dbUser.role as "Admin" | "User") || "User",
    createdAt: dbUser.created_at || dbUser.createdAt || new Date().toISOString()
  };
}
