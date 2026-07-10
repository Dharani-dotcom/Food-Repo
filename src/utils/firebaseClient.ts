import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { Food, Order, User } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Map Firestore doc to Food
export function mapFoodFromDb(id: string, data: any): Food {
  return {
    id: id,
    name: data.name,
    description: data.description || "",
    price: Number(data.price),
    category: data.category,
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
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    address: data.address || "",
    role: (data.role as "Admin" | "User") || "User",
    createdAt: data.createdAt || data.created_at || new Date().toISOString()
  };
}

// Client-side Direct Firestore fallback functions
export const firebaseFallback = {
  async getFoods(): Promise<Food[]> {
    const colRef = collection(db, "foods");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => mapFoodFromDb(doc.id, doc.data()));
  },

  async getFoodById(id: string): Promise<Food> {
    const docRef = doc(db, "foods", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Food item not found");
    return mapFoodFromDb(snapshot.id, snapshot.data());
  },

  async saveFood(id: string, data: any): Promise<void> {
    const docRef = doc(db, "foods", id);
    await setDoc(docRef, data, { merge: true });
  },

  async deleteFood(id: string): Promise<void> {
    const docRef = doc(db, "foods", id);
    await deleteDoc(docRef);
  },

  async getOrders(): Promise<Order[]> {
    const colRef = collection(db, "orders");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => mapOrderFromDb(doc.id, doc.data()));
  },

  async getOrderById(id: string): Promise<Order> {
    const docRef = doc(db, "orders", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Order not found");
    return mapOrderFromDb(snapshot.id, snapshot.data());
  },

  async saveOrder(id: string, data: any): Promise<void> {
    const docRef = doc(db, "orders", id);
    await setDoc(docRef, data, { merge: true });
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const docRef = doc(db, "orders", id);
    await setDoc(docRef, { orderStatus: status, order_status: status }, { merge: true });
  },

  async getUsers(): Promise<any[]> {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => mapUserFromDb(doc.id, doc.data()));
  },

  async deleteUser(id: string): Promise<void> {
    const docRef = doc(db, "users", id);
    await deleteDoc(docRef);
  }
};
