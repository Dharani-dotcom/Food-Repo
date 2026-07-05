import React, { useState } from "react";
import { Food } from "../types";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Plus, Minus, ShoppingCart, ShoppingBag } from "lucide-react";

interface FoodDetailModalProps {
  food: Food | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (!food) return null;

  const handleAddToCart = () => {
    addToCart(food, quantity);
    showToast(`Added ${quantity}x ${food.name} to basket!`, "success");
    onClose();
  };

  const increaseQty = () => setQuantity((q) => q + 1);
  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-zinc-100 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: Image */}
          <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[250px] relative shrink-0">
            <img
              src={food.image}
              alt={food.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950 via-transparent to-transparent md:from-transparent md:via-transparent" />
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              {/* Category Badge & Rating */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/10">
                  {food.category}
                </span>
                
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{food.rating.toFixed(1)}</span>
                </div>
              </div>

              <h2 className="font-sans font-extrabold text-xl md:text-2xl leading-snug tracking-tight text-white mt-1">
                {food.name}
              </h2>

              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mt-1">
                {food.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {/* Price & Quantity Adjuster */}
              <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                <div>
                  <p className="text-xs text-zinc-500">Unit Price</p>
                  <p className="text-xl font-bold text-orange-400">₹{food.price}</p>
                </div>

                <div className="flex flex-col items-end">
                  <p className="text-xs text-zinc-500 mb-1">Select Quantity</p>
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button
                      onClick={decreaseQty}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{quantity}</span>
                    <button
                      onClick={increaseQty}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total price & Cart button */}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Total Price</span>
                  <span className="text-lg font-extrabold text-white">
                    ₹{food.price * quantity}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!food.available}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl shadow-lg transition-all ${
                    food.available
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-orange-600/20 active:scale-[0.98] cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {food.available ? "Add to Basket" : "Sold Out"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
