import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  limit, 
  query 
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { User, Food, Order } from "../src/types";

// Load configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse firebase-applet-config.json:", err);
  }
}

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize app & firestore
const app = isFirebaseConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = app 
  ? (firebaseConfig.firestoreDatabaseId ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : getFirestore(app))
  : null;

export interface FirebaseStatus {
  configured: boolean;
  connected: boolean;
  collectionsFound: {
    users: boolean;
    passwords: boolean;
    foods: boolean;
    orders: boolean;
  };
  error?: string;
}

let connectionStatus: FirebaseStatus = {
  configured: isFirebaseConfigured,
  connected: false,
  collectionsFound: {
    users: false,
    passwords: false,
    foods: false,
    orders: false
  }
};

export function getFirebaseStatus(): FirebaseStatus {
  return connectionStatus;
}

export async function testFirebaseConnection(): Promise<FirebaseStatus> {
  if (!isFirebaseConfigured || !db) {
    return {
      configured: false,
      connected: false,
      collectionsFound: { users: false, passwords: false, foods: false, orders: false },
      error: "Firebase environment variables are missing."
    };
  }

  try {
    // In firestore, reading collections is the best way to verify connection.
    // If we can get docs or even an empty collection, then it's connected.
    await getDocs(query(collection(db, "users"), limit(1)));
    await getDocs(query(collection(db, "passwords"), limit(1)));
    await getDocs(query(collection(db, "foods"), limit(1)));
    await getDocs(query(collection(db, "orders"), limit(1)));

    connectionStatus = {
      configured: true,
      connected: true,
      collectionsFound: {
        users: true,
        passwords: true,
        foods: true,
        orders: true
      }
    };
    return connectionStatus;
  } catch (err: any) {
    connectionStatus = {
      configured: true,
      connected: false,
      collectionsFound: { users: false, passwords: false, foods: false, orders: false },
      error: err.message || "Failed to connect to Firestore."
    };
    return connectionStatus;
  }
}

// Map Firestore doc to Food
export function mapFoodFromDb(id: string, data: any): Food {
  return {
    id: id,
    name: data.name || "",
    description: data.description || "",
    price: Number(data.price || 0),
    category: data.category || "Mains",
    image: data.image || "",
    available: data.available !== false,
    rating: Number(data.rating || 4.5),
    createdAt: data.createdAt || data.created_at || new Date().toISOString()
  };
}

// Map Firestore doc to Order
export function mapOrderFromDb(id: string, data: any): Order {
  let items = data.foodItems || data.food_items || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  return {
    id: id,
    userId: data.userId || data.user_id || "",
    userName: data.userName || data.user_name || "Guest Customer",
    userEmail: data.userEmail || data.user_email || "",
    foodItems: Array.isArray(items) ? items : [],
    totalQuantity: Number(data.totalQuantity || data.total_quantity || 0),
    totalPrice: Number(data.totalPrice || data.total_price || 0),
    deliveryAddress: data.deliveryAddress || data.delivery_address || "",
    phone: data.phone || "",
    paymentStatus: (data.paymentStatus || data.payment_status || "Pending") as "Pending" | "Paid" | "Refunded",
    orderStatus: (data.orderStatus || data.order_status || "Pending") as any,
    createdAt: data.createdAt || data.created_at || new Date().toISOString()
  };
}

// Map Firestore doc to User
export function mapUserFromDb(id: string, data: any): User {
  return {
    id: id,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    role: (data.role as "Admin" | "User") || "User",
    createdAt: data.createdAt || data.created_at || new Date().toISOString()
  };
}

// Check connection and sync cloud data to local cache
export async function syncFromFirebase(): Promise<{
  users?: User[];
  passwords?: Record<string, string>;
  foods?: Food[];
  orders?: Order[];
  success: boolean;
}> {
  if (!db) {
    connectionStatus.configured = false;
    return { success: false };
  }

  console.log("Checking Firestore connection and synchronizing database...");
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const passwordsSnap = await getDocs(collection(db, "passwords"));
    const foodsSnap = await getDocs(collection(db, "foods"));
    const ordersSnap = await getDocs(collection(db, "orders"));

    connectionStatus = {
      configured: true,
      connected: true,
      collectionsFound: {
        users: true,
        passwords: true,
        foods: true,
        orders: true
      }
    };

    const passwordsRecord: Record<string, string> = {};
    passwordsSnap.docs.forEach(doc => {
      const d = doc.data();
      passwordsRecord[doc.id] = d.password_hash || d.passwordHash || "";
    });

    return {
      users: usersSnap.docs.map(doc => mapUserFromDb(doc.id, doc.data())),
      passwords: passwordsRecord,
      foods: foodsSnap.docs.map(doc => mapFoodFromDb(doc.id, doc.data())),
      orders: ordersSnap.docs.map(doc => mapOrderFromDb(doc.id, doc.data())),
      success: true
    };
  } catch (err: any) {
    console.error("❌ Failed to connect or sync from Firebase:", err.message);
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    return { success: false };
  }
}

// Background sync helpers
export async function syncCreateUser(user: User, passwordHash: string) {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", user.id), {
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    }, { merge: true });

    await setDoc(doc(db, "passwords", user.id), {
      passwordHash: passwordHash,
      password_hash: passwordHash
    }, { merge: true });

    console.log(`Synced user ${user.email} to Firestore successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync user ${user.email} to Firestore:`, err.message);
  }
}

export async function syncDeleteUser(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "users", id));
    await deleteDoc(doc(db, "passwords", id));
    console.log(`Deleted user ${id} from Firestore successfully.`);
  } catch (err: any) {
    console.error(`Failed to delete user ${id} from Firestore:`, err.message);
  }
}

export async function syncUpsertFood(food: Food) {
  if (!db) return;
  try {
    await setDoc(doc(db, "foods", food.id), {
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      image: food.image,
      available: food.available,
      rating: food.rating,
      createdAt: food.createdAt
    }, { merge: true });
    console.log(`Synced food ${food.name} to Firestore successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync food ${food.name} to Firestore:`, err.message);
  }
}

export async function syncDeleteFood(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "foods", id));
    console.log(`Deleted food ${id} from Firestore successfully.`);
  } catch (err: any) {
    console.error(`Failed to delete food ${id} from Firestore:`, err.message);
  }
}

export async function syncUpsertOrder(order: Order) {
  if (!db) return;
  try {
    await setDoc(doc(db, "orders", order.id), {
      userId: order.userId,
      userName: order.userName,
      userEmail: order.userEmail,
      foodItems: order.foodItems,
      totalQuantity: order.totalQuantity,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      phone: order.phone,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt
    }, { merge: true });
    console.log(`Synced order ${order.id} to Firestore successfully.`);
  } catch (err: any) {
    console.error(`Failed to sync order ${order.id} to Firestore:`, err.message);
  }
}
