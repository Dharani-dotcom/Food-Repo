import React from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    if (user) {
      navigate("/checkout");
    } else {
      navigate("/auth", { state: { redirect: "/checkout", message: "Please sign in or create an account to place an order." } });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col text-zinc-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="font-sans font-bold text-lg">Your Basket ({cartCount})</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex-col flex items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4 border border-zinc-850">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">Your basket is empty</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">
                    Explore our delectable menu and add items to your cart to begin your gourmet journey.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.foodId}
                    className="flex gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-all"
                  >
                    <img
                      src={item.food.image}
                      alt={item.food.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover bg-zinc-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-zinc-100">{item.food.name}</p>
                      <p className="text-xs text-zinc-500">{item.food.category}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-2 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <p className="text-sm font-bold text-orange-400">₹{item.food.price * item.quantity}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.foodId)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer self-start"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-md flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Estimated Delivery</span>
                    <span className="text-emerald-400 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-900">
                    <span>Total Amount</span>
                    <span className="text-orange-400">₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-orange-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
