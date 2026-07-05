import React, { useState, useEffect } from "react";
import { Food } from "../types";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { FoodDetailModal } from "../components/FoodDetailModal";
import { SkeletonCard } from "../components/SkeletonLoader";
import { Search, Star, Flame, Award, Clock, ArrowUpDown } from "lucide-react";
import { apiFetch } from "../utils/api";

export const MenuPage: React.FC = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  
  // Modal tracking
  const [activeFood, setActiveFood] = useState<Food | null>(null);

  // Categories list
  const categories = ["All", "Starters", "Mains", "Breads", "Desserts", "Beverages"];

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await apiFetch("/api/foods");
        if (response.ok) {
          const data = await response.json();
          setFoods(data);
        }
      } catch (err) {
        console.error("Failed to load foods:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Filter & Search Logic
  const filteredFoods = foods
    .filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            food.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0; // Default
    });

  const handleQuickAdd = (food: Food, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening detail modal
    addToCart(food, 1);
    showToast(`Added ${food.name} to basket!`, "success");
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen pb-16">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-zinc-900 border-b border-zinc-900 py-16 md:py-24 px-4 md:px-8">
        {/* Background gradient graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/10 via-zinc-950/20 to-zinc-950 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex-1 text-center md:text-left">
            {/* Promo Tag */}
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Indian Gourmet Delivery</span>
            </div>

            <h1 className="font-sans font-extrabold text-4xl md:text-6xl tracking-tight leading-none text-white mb-6">
              Authentic <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Indian</span> Culinary Delights
            </h1>

            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl mb-8">
              Welcome to Masala Kitchen, where our master chefs select fresh, fragrant spices and organic ingredients to prepare classic tandoori starters, aromatic slow-cooked biryanis, and velvety butter curries. Indulge your senses.
            </p>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-4 py-2.5 rounded-2xl">
                <Award className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold">Premium Quality</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-4 py-2.5 rounded-2xl">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold">Fast Delivery (25 mins)</span>
              </div>
            </div>
          </div>

          {/* Featured Food visual side */}
          <div className="flex-1 max-w-md w-full shrink-0 relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl blur opacity-30 group-hover:opacity-45 transition-all" />
            <div className="relative bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800"
                alt="Classic Paneer Tikka"
                className="w-full h-56 object-cover rounded-2xl bg-zinc-800"
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Featured Dish</p>
                  <h3 className="text-sm font-extrabold text-white">Classic Paneer Tikka</h3>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & LISTING STAGE */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        
        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          
          {/* Category Rail (Framer Motion replacement: standard flex gap overflow-x-auto) */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-orange-600 to-red-600 border-orange-500 text-white shadow-lg shadow-orange-600/10"
                    : "bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search menu..."
                className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-100 outline-none transition-colors"
              />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-850 focus:border-orange-500 rounded-xl py-2.5 pl-4 pr-10 text-xs text-zinc-300 outline-none transition-colors cursor-pointer"
              >
                <option value="default">Sort Options</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ArrowUpDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. MENU CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-500 text-sm font-semibold">No food items match your filters.</p>
            <p className="text-zinc-600 text-xs mt-1">Try resetting your search query or choosing another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                onClick={() => setActiveFood(food)}
                className="group bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 rounded-3xl overflow-hidden p-4 flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 cursor-pointer"
              >
                {/* Image and badges */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-800 shrink-0">
                  <img
                    src={food.image}
                    alt={food.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Rating badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 border border-zinc-800/30 backdrop-blur-md px-2 py-1 rounded-lg text-amber-400 text-xs font-bold shadow-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{food.rating.toFixed(1)}</span>
                  </div>
                  {/* Sold out overlay */}
                  {!food.available && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase px-3 py-1.5 rounded-xl">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[9px] font-extrabold uppercase text-orange-500 tracking-widest leading-none">
                    {food.category}
                  </span>
                  <h3 className="font-sans font-bold text-base text-white group-hover:text-orange-400 transition-colors truncate">
                    {food.name}
                  </h3>
                  <p className="text-zinc-500 text-xs leading-normal line-clamp-2">
                    {food.description}
                  </p>
                </div>

                {/* Bottom details & Button */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-1">
                  <span className="text-base font-extrabold text-white">₹{food.price}</span>
                  <button
                    onClick={(e) => food.available && handleQuickAdd(food, e)}
                    disabled={!food.available}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg transition-all ${
                      food.available
                        ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-orange-600/10 cursor-pointer active:scale-95"
                        : "bg-zinc-850 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DETAIL MODAL */}
      {activeFood && (
        <FoodDetailModal food={activeFood} onClose={() => setActiveFood(null)} />
      )}
    </div>
  );
};
