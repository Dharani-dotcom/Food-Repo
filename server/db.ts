import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Food, Order } from "../src/types";
import {
  syncFromSupabase,
  syncCreateUser,
  syncDeleteUser,
  syncUpsertFood,
  syncDeleteFood,
  syncUpsertOrder,
  isSupabaseConfigured
} from "./supabase";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data directory and file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DEFAULT_FOODS: Food[] = [
  {
    id: "food_1",
    name: "Classic Paneer Tikka",
    description: "Cubes of fresh cottage cheese marinated in spiced yogurt and grilled in a traditional tandoor clay oven with bell peppers and onions.",
    price: 249,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_2",
    name: "Old Delhi Butter Chicken",
    description: "Tender tandoori chicken cooked in a rich, creamy, and velvety tomato-butter gravy flavored with fenugreek leaves.",
    price: 389,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_3",
    name: "Hyderabadi Dum Biryani",
    description: "Fragrant basmati rice layered with aromatic spices and slow-cooked (dum) to lock in pure traditional flavors, served with raita.",
    price: 349,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_4",
    name: "Butter Garlic Naan",
    description: "Soft tandoor-baked leavened flatbread brushed with organic butter and finely chopped fresh garlic.",
    price: 69,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.7,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_5",
    name: "Creamy Paneer Butter Masala",
    description: "Succulent cottage cheese cubes simmered in a mildly sweet, spicy, onion-tomato cream sauce.",
    price: 329,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_6",
    name: "Kesar Gulab Jamun",
    description: "Deep-fried milk solids dumplings soaked in warm saffron-infused sugar syrup, garnishing with pistachio slices.",
    price: 99,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.9,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_7",
    name: "Traditional Mango Lassi",
    description: "Creamy, rich yogurt drink blended sweet with premium Alphonso mango pulp and a pinch of cardamom.",
    price: 119,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.7,
    createdAt: new Date().toISOString()
  },
  {
    id: "food_8",
    name: "Saffron Masala Chai",
    description: "Rich Indian milk tea slow-brewed with fresh ginger, crushed cardamoms, cloves, and a hint of fine Kashmiri saffron.",
    price: 49,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    available: true,
    rating: 4.8,
    createdAt: new Date().toISOString()
  }
];

interface Schema {
  users: User[];
  foods: Food[];
  orders: Order[];
  passwords: Record<string, string>; // userId -> hashed_password
}

const ADMIN_ID = "user_admin_default";
const USER_ID = "user_customer_default";

function seedDefaultData(data: Schema): Schema {
  let changed = false;

  if (!data.users) data.users = [];
  if (!data.orders) data.orders = [];
  if (!data.passwords) data.passwords = {};

  // Check if admin email exists
  const hasAdmin = data.users.some(u => u.email.toLowerCase() === "admin@masalakitchen.in");
  if (!hasAdmin) {
    const adminUser: User = {
      id: ADMIN_ID,
      name: "Admin Chief",
      email: "admin@masalakitchen.in",
      phone: "+91 98765 43210",
      address: "Connaught Place, New Delhi, Delhi 110001",
      role: "Admin",
      createdAt: new Date().toISOString()
    };
    data.users.push(adminUser);
    data.passwords[ADMIN_ID] = bcrypt.hashSync("admin123", 10);
    changed = true;
  }

  // Check if default user email exists
  const hasUser = data.users.some(u => u.email.toLowerCase() === "user@masalakitchen.in");
  if (!hasUser) {
    const customerUser: User = {
      id: USER_ID,
      name: "Rohan Sharma",
      email: "user@masalakitchen.in",
      phone: "+91 91234 56789",
      address: "Saket, New Delhi, Delhi 110017",
      role: "User",
      createdAt: new Date().toISOString()
    };
    data.users.push(customerUser);
    data.passwords[USER_ID] = bcrypt.hashSync("user123", 10);
    changed = true;
  }

  // Check if we need to seed sample orders
  if (data.orders.length === 0) {
    const sampleOrders: Order[] = [
      {
        id: "order_seed_1",
        userId: USER_ID,
        userName: "Rohan Sharma",
        userEmail: "user@masalakitchen.in",
        foodItems: [
          {
            foodId: "food_2",
            name: "Old Delhi Butter Chicken",
            price: 389,
            image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800",
            quantity: 1
          },
          {
            foodId: "food_4",
            name: "Butter Garlic Naan",
            price: 69,
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=800",
            quantity: 2
          }
        ],
        totalQuantity: 3,
        totalPrice: 527,
        deliveryAddress: "Saket, New Delhi, Delhi 110017",
        phone: "+91 91234 56789",
        paymentStatus: "Paid",
        orderStatus: "Delivered",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "order_seed_2",
        userId: USER_ID,
        userName: "Rohan Sharma",
        userEmail: "user@masalakitchen.in",
        foodItems: [
          {
            foodId: "food_3",
            name: "Hyderabadi Dum Biryani",
            price: 349,
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
            quantity: 1
          },
          {
            foodId: "food_7",
            name: "Traditional Mango Lassi",
            price: 119,
            image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800",
            quantity: 1
          }
        ],
        totalQuantity: 2,
        totalPrice: 468,
        deliveryAddress: "Saket, New Delhi, Delhi 110017",
        phone: "+91 91234 56789",
        paymentStatus: "Paid",
        orderStatus: "Preparing",
        createdAt: new Date().toISOString()
      }
    ];
    data.orders = sampleOrders;
    changed = true;
  }

  // Ensure default foods are populated if empty
  if (!data.foods || data.foods.length === 0) {
    data.foods = DEFAULT_FOODS;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  return data;
}

function readDb(): Schema {
  if (!fs.existsSync(DB_FILE)) {
    const initial: Schema = {
      users: [],
      foods: DEFAULT_FOODS,
      orders: [],
      passwords: {}
    };
    const seeded = seedDefaultData(initial);
    return seeded;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return seedDefaultData(parsed);
  } catch (err) {
    console.error("Error reading database file. Reinitializing...", err);
    const initial: Schema = {
      users: [],
      foods: DEFAULT_FOODS,
      orders: [],
      passwords: {}
    };
    const seeded = seedDefaultData(initial);
    return seeded;
  }
}

function writeDb(data: Schema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const dbService = {
  // Users
  getUsers(): User[] {
    return readDb().users;
  },

  getUserByEmail(email: string): User | undefined {
    return readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(id: string): User | undefined {
    return readDb().users.find((u) => u.id === id);
  },

  getUserPassword(userId: string): string | undefined {
    return readDb().passwords[userId];
  },

  createUser(user: User, passwordHash: string): User {
    const data = readDb();
    data.users.push(user);
    data.passwords[user.id] = passwordHash;
    writeDb(data);
    
    // Background sync to Supabase
    syncCreateUser(user, passwordHash);
    
    return user;
  },

  updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt">>): User | undefined {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    
    data.users[index] = {
      ...data.users[index],
      ...updates
    };
    writeDb(data);
    
    // Sync update to Supabase
    const passwordHash = data.passwords[id] || "";
    syncCreateUser(data.users[index], passwordHash);
    
    return data.users[index];
  },

  deleteUser(id: string): boolean {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    data.users.splice(index, 1);
    delete data.passwords[id];
    writeDb(data);
    
    // Background sync to Supabase
    syncDeleteUser(id);
    
    return true;
  },

  // Foods
  getFoods(): Food[] {
    return readDb().foods;
  },

  getFoodById(id: string): Food | undefined {
    return readDb().foods.find((f) => f.id === id);
  },

  createFood(food: Omit<Food, "id" | "createdAt">): Food {
    const data = readDb();
    const newFood: Food = {
      ...food,
      id: "food_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    data.foods.push(newFood);
    writeDb(data);
    
    // Background sync to Supabase
    syncUpsertFood(newFood);
    
    return newFood;
  },

  updateFood(id: string, updates: Partial<Omit<Food, "id" | "createdAt">>): Food | null {
    const data = readDb();
    const index = data.foods.findIndex((f) => f.id === id);
    if (index === -1) return null;
    const updatedFood = {
      ...data.foods[index],
      ...updates
    };
    data.foods[index] = updatedFood;
    writeDb(data);
    
    // Background sync to Supabase
    syncUpsertFood(updatedFood);
    
    return updatedFood;
  },

  deleteFood(id: string): boolean {
    const data = readDb();
    const index = data.foods.findIndex((f) => f.id === id);
    if (index === -1) return false;
    data.foods.splice(index, 1);
    writeDb(data);
    
    // Background sync to Supabase
    syncDeleteFood(id);
    
    return true;
  },

  // Orders
  getOrders(): Order[] {
    return readDb().orders;
  },

  getOrderById(id: string): Order | undefined {
    return readDb().orders.find((o) => o.id === id);
  },

  getOrdersByUser(userId: string): Order[] {
    return readDb().orders.filter((o) => o.userId === userId);
  },

  createOrder(order: Omit<Order, "id" | "createdAt">): Order {
    const data = readDb();
    const newOrder: Order = {
      ...order,
      id: "order_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    data.orders.push(newOrder);
    writeDb(data);
    
    // Background sync to Supabase
    syncUpsertOrder(newOrder);
    
    return newOrder;
  },

  updateOrderStatus(id: string, status: Order["orderStatus"]): Order | null {
    const data = readDb();
    const index = data.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    data.orders[index].orderStatus = status;
    writeDb(data);
    
    // Background sync to Supabase
    syncUpsertOrder(data.orders[index]);
    
    return data.orders[index];
  }
};

// Initialize cloud sync on start
export async function initSupabaseSync() {
  if (!isSupabaseConfigured) {
    console.log("ℹ️ Supabase environment variables not configured. Operating in local-only mode.");
    return;
  }

  console.log("🔄 Starting Supabase cloud synchronization...");
  try {
    const syncResult = await syncFromSupabase();
    if (syncResult.success) {
      const data = readDb();
      let modified = false;

      if (syncResult.users && syncResult.users.length > 0) {
        data.users = syncResult.users;
        modified = true;
      }
      if (syncResult.passwords && Object.keys(syncResult.passwords).length > 0) {
        data.passwords = syncResult.passwords;
        modified = true;
      }
      if (syncResult.foods && syncResult.foods.length > 0) {
        data.foods = syncResult.foods;
        modified = true;
      }
      if (syncResult.orders && syncResult.orders.length > 0) {
        data.orders = syncResult.orders;
        modified = true;
      }

      const seeded = seedDefaultData(data);
      writeDb(seeded);

      // Seed Supabase with defaults if it was completely empty
      if (!syncResult.foods || syncResult.foods.length === 0) {
        console.log("Seeding default foods to Supabase...");
        for (const food of seeded.foods) {
          await syncUpsertFood(food);
        }
      }
      if (!syncResult.users || syncResult.users.length === 0) {
        console.log("Seeding default users to Supabase...");
        for (const user of seeded.users) {
          await syncCreateUser(user, seeded.passwords[user.id]);
        }
      }
      if (!syncResult.orders || syncResult.orders.length === 0) {
        console.log("Seeding default orders to Supabase...");
        for (const order of seeded.orders) {
          await syncUpsertOrder(order);
        }
      }

      console.log("✅ Supabase cloud-sync initialization completed successfully! Local cache updated.");
    } else {
      console.warn("⚠️ Supabase sync skipped or failed. Operating in local-only mode.");
    }
  } catch (err: any) {
    console.error("❌ Exception during Supabase startup sync:", err.message);
  }
}

// Trigger initial synchronization
initSupabaseSync().catch(err => {
  console.error("Unhandled error in initSupabaseSync:", err);
});
