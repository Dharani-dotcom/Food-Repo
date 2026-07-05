import React, { createContext, useContext, useState } from "react";
import { CartItem, Food } from "../types";

interface CartContextType {
  cart: CartItem[];
  addToCart: (food: Food, quantity?: number) => void;
  removeFromCart: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (food: Food, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.foodId === food.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { foodId: food.id, food, quantity }];
    });
  };

  const removeFromCart = (foodId: string) => {
    setCart((prev) => prev.filter((item) => item.foodId !== foodId));
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.foodId === foodId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = Number(
    cart.reduce((total, item) => total + item.food.price * item.quantity, 0).toFixed(2)
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
