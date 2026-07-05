/**
 * Shared Type Definitions for the Food Ordering App
 */

export type UserRole = "Admin" | "User";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  rating: number;
  createdAt: string;
}

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  foodItems: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
  deliveryAddress: string;
  phone: string;
  paymentStatus: "Pending" | "Paid" | "Refunded";
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface CartItem {
  foodId: string;
  food: Food;
  quantity: number;
}
