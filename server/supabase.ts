import { createClient } from "@supabase/supabase-js";
import { User, Food, Order } from "../src/types";

const supabaseUrl = process.env.SUPABASE_URL || "https://cqnqkyjfjidgojfytmmk.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_qtEDuEww2AoSzWPf0PcoDg_ERzZYtTS";

// Export as both a boolean (for legacy files) and a check
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY" &&
  supabaseUrl.trim() !== "" &&
  supabaseAnonKey.trim() !== ""
);

export const isSupabaseConfiguredFn = (): boolean => {
  return isSupabaseConfigured;
};

// Lazy initialize client so it doesn't crash on invalid keys at startup
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  return supabase;
}

// Helpers to transform DB fields to/from Supabase structure
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
    userName: dbOrder.user_name || dbOrder.userName,
    userEmail: dbOrder.user_email || dbOrder.userEmail,
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

export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      error: "Supabase environment variables are missing or default.",
      tables: { users: false, foods: false, orders: false, passwords: false }
    };
  }

  if (!supabase) {
    return {
      connected: false,
      error: "Could not initialize Supabase client.",
      tables: { users: false, foods: false, orders: false, passwords: false }
    };
  }

  const tables = { users: false, foods: false, orders: false, passwords: false };
  let errorMsg: string | undefined;

  try {
    const usersCheck = await supabase.from("users").select("id").limit(1);
    tables.users = !usersCheck.error;

    const foodsCheck = await supabase.from("foods").select("id").limit(1);
    tables.foods = !foodsCheck.error;

    const ordersCheck = await supabase.from("orders").select("id").limit(1);
    tables.orders = !ordersCheck.error;

    const passwordsCheck = await supabase.from("passwords").select("user_id").limit(1);
    tables.passwords = !passwordsCheck.error;

    const missing: string[] = [];
    if (!tables.users) missing.push("users");
    if (!tables.foods) missing.push("foods");
    if (!tables.orders) missing.push("orders");
    if (!tables.passwords) missing.push("passwords");

    if (missing.length > 0) {
      errorMsg = `Supabase connected, but missing table(s): ${missing.join(", ")}. Run the database schema SQL.`;
    }

    return {
      connected: true,
      error: errorMsg,
      tables
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || "An error occurred connecting to Supabase.",
      tables
    };
  }
}

// SQL Schema for users to execute in Supabase SQL editor
export const SQL_SETUP_SCRIPT = `-- Supabase SQL Setup Schema
-- Run this in your Supabase project's SQL Editor to set up the necessary tables.

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create passwords table for authentication
CREATE TABLE IF NOT EXISTS public.passwords (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL
);

-- 3. Create foods table
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  food_items JSONB NOT NULL,
  total_quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  delivery_address TEXT,
  phone TEXT,
  payment_status TEXT DEFAULT 'Pending',
  order_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Set up security policies (Allow public access for development)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to foods" ON public.foods;
CREATE POLICY "Allow public read access to foods" ON public.foods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write access to foods" ON public.foods;
CREATE POLICY "Allow public write access to foods" ON public.foods FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to passwords" ON public.passwords;
CREATE POLICY "Allow public access to passwords" ON public.passwords FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to orders" ON public.orders;
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);

-- 6. Insert initial pre-seeded food items if empty
INSERT INTO public.foods (id, name, description, price, category, image, available, rating, created_at)
VALUES 
('food_1', 'Classic Paneer Tikka', 'Cubes of fresh cottage cheese marinated in spiced yogurt and grilled in a traditional tandoor clay oven with bell peppers and onions.', 249, 'Starters', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW()),
('food_2', 'Old Delhi Butter Chicken', 'Tender tandoori chicken cooked in a rich, creamy, and velvety tomato-butter gravy flavored with fenugreek leaves.', 389, 'Mains', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_3', 'Hyderabadi Dum Biryani', 'Fragrant basmati rice layered with aromatic spices and slow-cooked (dum) to lock in pure traditional flavors, served with raita.', 349, 'Mains', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_4', 'Butter Garlic Naan', 'Soft tandoor-baked leavened flatbread brushed with organic butter and finely chopped fresh garlic.', 69, 'Breads', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=800', true, 4.7, NOW()),
('food_5', 'Creamy Paneer Butter Masala', 'Succulent cottage cheese cubes simmered in a mildly sweet, spicy, onion-tomato cream sauce.', 329, 'Mains', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW()),
('food_6', 'Kesar Gulab Jamun', 'Deep-fried milk solids dumplings soaked in warm saffron-infused sugar syrup, garnishing with pistachio slices.', 99, 'Desserts', 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_7', 'Traditional Mango Lassi', 'Creamy, rich yogurt drink blended sweet with premium Alphonso mango pulp and a pinch of cardamom.', 119, 'Beverages', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800', true, 4.7, NOW()),
('food_8', 'Saffron Masala Chai', 'Rich Indian milk tea slow-brewed with fresh ginger, crushed cardamoms, cloves, and a hint of fine Kashmiri saffron.', 49, 'Beverages', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW())
ON CONFLICT (id) DO NOTHING;
`;

export const SUPABASE_SQL_SCHEMA = SQL_SETUP_SCRIPT;

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  tablesFound: {
    users: boolean;
    passwords: boolean;
    foods: boolean;
    orders: boolean;
  };
  error?: string;
}

let connectionStatus: SupabaseStatus = {
  configured: isSupabaseConfigured,
  connected: false,
  tablesFound: {
    users: false,
    passwords: false,
    foods: false,
    orders: false
  }
};

export function getSupabaseStatus(): SupabaseStatus {
  return connectionStatus;
}

// Check connection and sync cloud data to local cache if tables exist
export async function syncFromSupabase(): Promise<{
  users?: User[];
  passwords?: Record<string, string>;
  foods?: Food[];
  orders?: Order[];
  success: boolean;
}> {
  if (!supabase) {
    connectionStatus.configured = false;
    return { success: false };
  }

  console.log("Checking Supabase connection and tables...");
  
  try {
    const status = { ...connectionStatus };
    status.configured = true;

    // 1. Check users table
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .limit(1);
    
    status.tablesFound.users = !usersErr;

    // 2. Check passwords table
    const { error: pwdErr } = await supabase
      .from("passwords")
      .select("*")
      .limit(1);
    status.tablesFound.passwords = !pwdErr;

    // 3. Check foods table
    const { error: foodErr } = await supabase
      .from("foods")
      .select("*")
      .limit(1);
    status.tablesFound.foods = !foodErr;

    // 4. Check orders table
    const { error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .limit(1);
    status.tablesFound.orders = !orderErr;

    const allTablesExist = 
      status.tablesFound.users && 
      status.tablesFound.passwords && 
      status.tablesFound.foods && 
      status.tablesFound.orders;

    if (!allTablesExist) {
      const missing = Object.entries(status.tablesFound)
        .filter(([_, found]) => !found)
        .map(([name]) => name)
        .join(", ");
      
      status.connected = true; // Connection OK, but tables missing
      status.error = `Missing database tables: ${missing}. Please run the setup SQL.`;
      connectionStatus = status;
      
      console.warn("⚠️ Supabase connected, but tables are missing in PostgreSQL database.");
      console.log(SQL_SETUP_SCRIPT);
      return { success: false };
    }

    // Since all tables exist, let's download the full dataset to synchronize local state!
    console.log("Supabase connected and tables verified! Synchronizing database...");
    
    const [
      { data: allUsers },
      { data: allPasswords },
      { data: allFoods },
      { data: allOrders }
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("passwords").select("*"),
      supabase.from("foods").select("*"),
      supabase.from("orders").select("*")
    ]);

    status.connected = true;
    status.error = undefined;
    connectionStatus = status;

    // Reconstruct passwords record (userId -> passwordHash)
    const passwordsRecord: Record<string, string> = {};
    if (allPasswords) {
      allPasswords.forEach((p: any) => {
        passwordsRecord[p.user_id || p.userId] = p.password_hash || p.passwordHash;
      });
    }

    return {
      users: ((allUsers || []).map(mapUserFromDb)) || [],
      passwords: passwordsRecord,
      foods: ((allFoods || []).map(mapFoodFromDb)) || [],
      orders: ((allOrders || []).map(mapOrderFromDb)) || [],
      success: true
    };

  } catch (err: any) {
    console.error("❌ Failed to connect or sync from Supabase:", err.message);
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    return { success: false };
  }
}

// Background sync helpers (non-blocking, fails gracefully)
export async function syncCreateUser(user: User, passwordHash: string) {
  if (!supabase || !connectionStatus.connected) return;
  try {
    const { error: userErr } = await supabase.from("users").upsert({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone,
      address: user.address,
      role: user.role,
      created_at: user.createdAt
    });
    if (userErr) throw userErr;

    const { error: pwdErr } = await supabase.from("passwords").upsert({
      user_id: user.id,
      password_hash: passwordHash
    });
    if (pwdErr) throw pwdErr;

    console.log(`Synced user ${user.email} to Supabase successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync user ${user.email} to Supabase:`, err.message);
  }
}

export async function syncDeleteUser(id: string) {
  if (!supabase || !connectionStatus.connected) return;
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    console.log(`Deleted user ${id} from Supabase successfully.`);
  } catch (err: any) {
    console.error(`Failed to delete user ${id} from Supabase:`, err.message);
  }
}

export async function syncUpsertFood(food: Food) {
  if (!supabase || !connectionStatus.connected) return;
  try {
    const { error } = await supabase.from("foods").upsert({
      id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      image: food.image,
      available: food.available,
      rating: food.rating,
      created_at: food.createdAt
    });
    if (error) throw error;
    console.log(`Synced food ${food.name} to Supabase successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync food ${food.name} to Supabase:`, err.message);
  }
}

export async function syncDeleteFood(id: string) {
  if (!supabase || !connectionStatus.connected) return;
  try {
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) throw error;
    console.log(`Deleted food ${id} from Supabase successfully.`);
  } catch (err: any) {
    console.error(`Failed to delete food ${id} from Supabase:`, err.message);
  }
}

export async function syncUpsertOrder(order: Order) {
  if (!supabase || !connectionStatus.connected) return;
  try {
    const { error } = await supabase.from("orders").upsert({
      id: order.id,
      user_id: order.userId,
      user_name: order.userName,
      user_email: order.userEmail,
      food_items: JSON.stringify(order.foodItems),
      total_quantity: order.totalQuantity,
      total_price: order.totalPrice,
      delivery_address: order.deliveryAddress,
      phone: order.phone,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      created_at: order.createdAt
    });
    if (error) throw error;
    console.log(`Synced order ${order.id} to Supabase successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync order ${order.id} to Supabase:`, err.message);
  }
}
