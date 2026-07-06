import React, { useState, useEffect } from "react";
import { Food, Order, User, OrderStatus } from "../types";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { apiFetch } from "../utils/api";
import {
  Users,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Check,
  Activity,
  AlertCircle,
  Eye,
  FileText,
  Database,
  Copy,
  CheckSquare,
  RefreshCw
} from "lucide-react";

type TabType = "overview" | "orders" | "menu" | "users" | "database";

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase Sync States
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseSql, setSupabaseSql] = useState<string>("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  // Modal / Form state for Food Edit/Add
  const [isEditing, setIsEditing] = useState(false);
  const [foodForm, setFoodForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    category: "Starters",
    image: "",
    available: true,
    rating: 5.0
  });

  const categories = ["Starters", "Mains", "Breads", "Desserts", "Beverages"];

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Image is too large. Please select an image under 3MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFoodForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Image is too large. Please select an image under 3MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFoodForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Security gate
  useEffect(() => {
    if (user && user.role !== "Admin") {
      showToast("Access denied. Admin credentials required.", "error");
      navigate("/");
    }
  }, [user, navigate, showToast]);

  const fetchSupabaseStatus = async () => {
    try {
      setIsSyncingDb(true);
      const res = await apiFetch("/api/supabase-status");
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus({
          configured: data.configured,
          connected: data.connected,
          error: data.error,
          tablesFound: data.tables
        });
        setSupabaseSql(data.sql || "");
      }
    } catch (err) {
      console.error("Error loading Supabase status:", err);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch foods
      const foodsRes = await apiFetch("/api/foods");
      if (foodsRes.ok) {
        const foodsData = await foodsRes.json();
        setFoods(foodsData);
      }

      // Fetch orders
      const ordersRes = await apiFetch("/api/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      // Fetch users
      const usersRes = await apiFetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch Supabase status
      await fetchSupabaseStatus();
    } catch (err) {
      console.error("Error loading admin datasets:", err);
      showToast("Failed to load dashboard statistics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.IO real-time support
  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      socket.emit("joinAdmins");
    });

    // Handle incoming live orders instantly
    socket.on("newOrder", (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      showToast(`🔔 New order placed by ${newOrder.userName}!`, "success");
    });

    return () => {
      socket.disconnect();
    };
  }, [showToast]);

  // Calculations for Metrics
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = Number(
    orders
      .filter((o) => o.orderStatus !== "Cancelled")
      .reduce((sum, o) => sum + o.totalPrice, 0)
      .toFixed(2)
  );

  const pendingOrders = orders.filter((o) => o.orderStatus === "Pending").length;
  const activeOrders = orders.filter(
    (o) => ["Accepted", "Preparing", "Ready", "Out for Delivery"].includes(o.orderStatus)
  ).length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "Delivered").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "Cancelled").length;

  // Food CRUDS
  const handleAddFoodClick = () => {
    setFoodForm({
      id: "",
      name: "",
      description: "",
      price: "",
      category: "Starters",
      image: "",
      available: true,
      rating: 5.0
    });
    setIsEditing(true);
  };

  const handleEditFoodClick = (food: Food) => {
    setFoodForm({
      id: food.id,
      name: food.name,
      description: food.description,
      price: food.price.toString(),
      category: food.category,
      image: food.image,
      available: food.available,
      rating: food.rating
    });
    setIsEditing(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.description || !foodForm.price) {
      showToast("Please complete all food details.", "warning");
      return;
    }

    try {
      const isNew = !foodForm.id;
      const url = isNew ? "/api/foods" : `/api/foods/${foodForm.id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        name: foodForm.name,
        description: foodForm.description,
        price: Number(foodForm.price),
        category: foodForm.category,
        image: foodForm.image,
        available: foodForm.available,
        rating: Number(foodForm.rating)
      };

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(`Food item ${isNew ? "added" : "updated"} successfully!`, "success");
        setIsEditing(false);
        // Refresh foods
        const updatedRes = await apiFetch("/api/foods");
        if (updatedRes.ok) setFoods(await updatedRes.json());
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to save food item.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error saving food item.", "error");
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const response = await apiFetch(`/api/foods/${id}`, { method: "DELETE" });
      if (response.ok) {
        setFoods((prev) => prev.filter((f) => f.id !== id));
        showToast("Food item deleted.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Order Status Updates
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast(`Order status updated to ${newStatus}`, "success");
        // Update local order list status
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to update order status.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User deletion
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      const response = await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast("User account deleted.", "success");
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to delete user.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title / Banner header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="font-sans font-extrabold text-3xl tracking-tight text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
              Restaurant Operator Hub
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Analyze metrics, update live order channels, build gourmets, and moderate users
            </p>
          </div>

          {/* Quick Tab Selectors */}
          <div className="flex bg-zinc-900 border border-zinc-850 p-1 rounded-xl flex-wrap gap-1">
            {(["overview", "orders", "menu", "users", "database"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md shadow-orange-600/10"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {tab === "database" ? "Database Sync" : tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <>
            {/* ======================= OVERVIEW TAB ======================= */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* 4-Column Metrics Summary Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* Revenue Card */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Gross Revenue</p>
                      <p className="text-xl font-extrabold text-white mt-0.5">₹{totalRevenue}</p>
                    </div>
                  </div>

                  {/* Orders Card */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Purchases</p>
                      <p className="text-xl font-extrabold text-white mt-0.5">{totalOrders}</p>
                    </div>
                  </div>

                  {/* Active Orders Card */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 animate-pulse">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Deliveries</p>
                      <p className="text-xl font-extrabold text-white mt-0.5">{activeOrders + pendingOrders}</p>
                    </div>
                  </div>

                  {/* Users Card */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Customer Accounts</p>
                      <p className="text-xl font-extrabold text-white mt-0.5">{totalUsers}</p>
                    </div>
                  </div>
                </div>

                {/* Split segment: Category Analytics & Recent Order highlights */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Category Popularity (col-span-5) */}
                  <div className="lg:col-span-5 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-zinc-850 pb-2.5">
                      Category Analytics
                    </h3>
                    
                    <div className="space-y-4 pt-2 text-xs">
                      {categories.map((cat) => {
                        const count = foods.filter((f) => f.category === cat).length;
                        const percentage = foods.length > 0 ? (count / foods.length) * 100 : 0;

                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between font-semibold">
                              <span className="text-zinc-300">{cat}</span>
                              <span className="text-zinc-500">{count} items</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Orders List (col-span-7) */}
                  <div className="lg:col-span-7 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 backdrop-blur-md space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-zinc-850 pb-2.5">
                      Recent Orders
                    </h3>

                    {orders.length === 0 ? (
                      <p className="text-zinc-600 text-xs py-8 text-center">No orders registered on the system.</p>
                    ) : (
                      <div className="divide-y divide-zinc-900 space-y-3 pt-2">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex justify-between items-center pt-3 text-xs">
                            <div>
                              <p className="font-bold text-zinc-200">{order.userName}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{order.foodItems.length} items &bull; {order.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-400">₹{order.totalPrice}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{order.orderStatus}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ======================= ORDERS TAB ======================= */}
            {activeTab === "orders" && (
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-base font-bold text-white border-b border-zinc-850 pb-3 mb-5">
                  Manage Purchases ({orders.length})
                </h3>

                {orders.length === 0 ? (
                  <p className="text-zinc-600 text-xs py-12 text-center">No purchases recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto text-xs text-zinc-300">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-850 text-zinc-400 font-bold">
                          <th className="py-3 px-2">Order ID</th>
                          <th className="py-3 px-2">Customer</th>
                          <th className="py-3 px-2">Items Ordered</th>
                          <th className="py-3 px-2">Price</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {orders.map((order) => {
                          const summary = order.foodItems.map(i => `${i.quantity}x ${i.name}`).join(", ");
                          return (
                            <tr key={order.id} className="hover:bg-zinc-900/20">
                              <td className="py-4.5 px-2 font-mono font-bold text-[10px] text-zinc-500">{order.id}</td>
                              <td className="py-4.5 px-2">
                                <p className="font-bold text-zinc-200">{order.userName}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{order.phone}</p>
                              </td>
                              <td className="py-4.5 px-2 max-w-[200px] truncate" title={summary}>{summary}</td>
                              <td className="py-4.5 px-2 font-bold text-orange-400">₹{order.totalPrice}</td>
                              <td className="py-4.5 px-2">
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[11px] font-bold text-white outline-none cursor-pointer focus:border-orange-500"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Ready">Ready</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-4.5 px-2 text-right">
                                <button
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Track
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ======================= MENU TAB ======================= */}
            {activeTab === "menu" && (
              <div className="space-y-6">
                
                {/* Header adder panel control */}
                <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl backdrop-blur-md">
                  <div>
                    <h3 className="text-sm font-bold text-white">Menu Builder</h3>
                    <p className="text-[11px] text-zinc-500">Add, edit, or delete items on the gourmet restaurant listing</p>
                  </div>
                  
                  <button
                    onClick={handleAddFoodClick}
                    className="flex items-center gap-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer hover:scale-105 duration-150"
                  >
                    <Plus className="w-4 h-4" />
                    New Gourmet
                  </button>
                </div>

                {/* Form Drawer overlays */}
                {isEditing && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setIsEditing(false)}></div>
                    <form 
                      onSubmit={handleSaveFood}
                      className="relative bg-zinc-950 border border-zinc-900 p-6 md:p-8 rounded-3xl max-w-lg w-full text-zinc-100 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                      <h2 className="text-lg font-bold text-white border-b border-zinc-850 pb-2.5">
                        {foodForm.id ? "Edit Gourmet Item" : "Create New Gourmet Item"}
                      </h2>

                      {/* Name input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-zinc-400 uppercase">Gourmet Name</label>
                          <input
                            type="text"
                            value={foodForm.name}
                            onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 outline-none rounded-xl py-2.5 px-4 text-white"
                            placeholder="Truffle Fries"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-zinc-400 uppercase">Unit Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={foodForm.price}
                            onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 outline-none rounded-xl py-2.5 px-4 text-white"
                            placeholder="250"
                          />
                        </div>
                      </div>

                      {/* Category and Image */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-zinc-400 uppercase">Category</label>
                          <select
                            value={foodForm.category}
                            onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 outline-none rounded-xl py-2.5 px-4 text-white cursor-pointer"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-zinc-400 uppercase">Product Image / Photo</label>
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center min-h-[96px] ${
                              isDragging 
                                ? "border-orange-500 bg-orange-950/15" 
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            {foodForm.image ? (
                              <div className="flex items-center gap-3 w-full">
                                <img 
                                  src={foodForm.image} 
                                  alt="Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 object-cover rounded-lg border border-zinc-800 shrink-0"
                                />
                                <div className="flex-1 text-left min-w-0">
                                  <p className="text-[10px] text-zinc-400 truncate">Photo selected successfully</p>
                                  <button
                                    type="button"
                                    onClick={() => setFoodForm({ ...foodForm, image: "" })}
                                    className="text-rose-500 text-[10px] font-bold hover:underline cursor-pointer"
                                  >
                                    Remove photo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="cursor-pointer block w-full py-1.5">
                                <span className="text-[10px] font-semibold text-orange-500 hover:text-orange-400">Click to upload photo</span>
                                <span className="text-[9px] text-zinc-500 block mt-0.5">or drag & drop (under 3MB)</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleFileChange} 
                                  className="hidden" 
                                />
                              </label>
                            )}
                          </div>
                          <input
                            type="text"
                            value={foodForm.image}
                            onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 outline-none rounded-xl py-1.5 px-3 text-[10px] text-zinc-300 mt-1.5"
                            placeholder="Or paste an image URL instead..."
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-zinc-400 uppercase">Description</label>
                        <textarea
                          rows={3}
                          value={foodForm.description}
                          onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 outline-none rounded-xl py-2.5 px-4 text-white resize-none"
                          placeholder="Rich descriptions that entice customers..."
                        />
                      </div>

                      {/* Rating and availability */}
                      <div className="flex items-center justify-between text-xs border-t border-zinc-900 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-400">Available:</span>
                          <button
                            type="button"
                            onClick={() => setFoodForm({ ...foodForm, available: !foodForm.available })}
                            className="text-orange-500 shrink-0 cursor-pointer"
                          >
                            {foodForm.available ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-zinc-400 uppercase mr-2">Default Rating:</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={foodForm.rating}
                            onChange={(e) => setFoodForm({ ...foodForm, rating: Number(e.target.value) })}
                            className="bg-zinc-900 border border-zinc-850 w-16 p-1.5 text-center text-white rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Grid of foods listing inside admin */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {foods.map((food) => (
                    <div 
                      key={food.id}
                      className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-4 flex gap-4 text-xs hover:border-zinc-800/85 transition-all"
                    >
                      <img 
                        src={food.image} 
                        alt={food.name} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-cover rounded-xl bg-zinc-800 shrink-0" 
                      />
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-extrabold uppercase text-orange-500 tracking-wider leading-none">
                              {food.category}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              food.available ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {food.available ? "Available" : "Sold Out"}
                            </span>
                          </div>
                          <h4 className="font-sans font-bold text-zinc-100 truncate mt-1 text-sm">{food.name}</h4>
                          <p className="font-extrabold text-orange-400 text-xs mt-1">₹{food.price}</p>
                        </div>

                        {/* Modifiers trigger */}
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            onClick={() => handleEditFoodClick(food)}
                            className="p-1.5 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food.id)}
                            className="p-1.5 bg-rose-950/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================= USERS TAB ======================= */}
            {activeTab === "users" && (
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-base font-bold text-white border-b border-zinc-850 pb-3 mb-5">
                  Registered Accounts ({users.length})
                </h3>

                {users.length === 0 ? (
                  <p className="text-zinc-600 text-xs py-12 text-center">No standard customer accounts found.</p>
                ) : (
                  <div className="overflow-x-auto text-xs text-zinc-300">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-850 text-zinc-400 font-bold">
                          <th className="py-3 px-2">Account</th>
                          <th className="py-3 px-2">Email</th>
                          <th className="py-3 px-2">Phone</th>
                          <th className="py-3 px-2">Role</th>
                          <th className="py-3 px-2">Addresses</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {users.map((acc) => (
                          <tr key={acc.id} className="hover:bg-zinc-900/20">
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-orange-400">
                                  {acc.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-zinc-200">{acc.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-zinc-400">{acc.email}</td>
                            <td className="py-4 px-2 text-zinc-400">{acc.phone}</td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                acc.role === "Admin" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-zinc-800 text-zinc-400"
                              }`}>
                                {acc.role}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-zinc-500 max-w-[150px] truncate" title={acc.address}>{acc.address}</td>
                            <td className="py-4 px-2 text-right">
                              <button
                                onClick={() => handleDeleteUser(acc.id)}
                                disabled={acc.id === user?.id}
                                className={`p-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer text-[10px] font-bold ${
                                  acc.id === user?.id
                                    ? "bg-zinc-850 text-zinc-700 border border-zinc-800 cursor-not-allowed"
                                    : "bg-rose-950/10 border border-rose-500/20 text-rose-400 hover:text-rose-300"
                                }`}
                                title="Remove User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ======================= DATABASE SYNC TAB ======================= */}
            {activeTab === "database" && (
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="font-sans font-extrabold text-xl text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-orange-500" />
                      Supabase Cloud Sync Settings
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Manage real-time cloud synchronization, connection health, and database structure.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await fetchSupabaseStatus();
                      showToast("Connection refreshed successfully!", "success");
                    }}
                    disabled={isSyncingDb}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? "animate-spin" : ""}`} />
                    Refresh Connection
                  </button>
                </div>

                {/* Connection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Indicator Card */}
                  <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Cloud Connection</span>
                      <h3 className="font-bold text-lg mt-1 text-white flex items-center gap-2">
                        {supabaseStatus?.configured ? (
                          supabaseStatus?.connected ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                              Active & Connected
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                              Tables Missing
                            </>
                          )
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                            Not Configured
                          </>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {supabaseStatus?.configured ? (
                          supabaseStatus?.connected ? (
                            "Synchronizing writes instantly. Registered users and orders are secured permanently in your Supabase DB."
                          ) : (
                            "Credentials verified, but tables do not exist in your database. Run the SQL script below to create them."
                          )
                        ) : (
                          "Using fallback local JSON storage. Add 'SUPABASE_URL' and 'SUPABASE_ANON_KEY' to your secrets to enable Cloud Database."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Schema Health Card */}
                  <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex flex-col justify-between md:col-span-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">PostgreSQL Tables Status</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {["users", "passwords", "foods", "orders"].map((tbl) => {
                          const exist = supabaseStatus?.tablesFound?.[tbl];
                          return (
                            <div key={tbl} className={`p-3 rounded-lg border ${exist ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-905 border-zinc-800 text-zinc-500"} flex flex-col items-center text-center`}>
                              <CheckSquare className={`w-5 h-5 mb-1 ${exist ? "text-emerald-400" : "text-zinc-650"}`} />
                              <span className="text-[10px] font-mono leading-none">masala_{tbl}</span>
                              <span className="text-[9px] font-bold mt-1.5 uppercase tracking-tight">
                                {exist ? "Verified" : "Missing"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stateless explanation banner */}
                {!supabaseStatus?.connected && (
                  <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl border-l-4 border-l-amber-500 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Why register & login data resets without Supabase</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        This application is deployed on <strong>stateless Cloud Run containers</strong>. When the app is idle or a new build is deployed, the container scales down to zero, erasing any users you register or orders you place in the temporary filesystem database.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] text-zinc-300">
                        <span>💡 To enable persistent storage:</span>
                        <code className="bg-zinc-900 px-1.5 py-0.5 rounded font-mono">1. Create a Supabase project</code>
                        <code className="bg-zinc-900 px-1.5 py-0.5 rounded font-mono">2. Add SUPABASE_URL & SUPABASE_ANON_KEY to your env secrets</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* SQL setup script code block */}
                {supabaseSql && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-300">PostgreSQL Schema Setup Script</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(supabaseSql);
                          setCopiedSql(true);
                          showToast("SQL Script copied to clipboard!", "success");
                          setTimeout(() => setCopiedSql(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-orange-600/10 border border-orange-500/20 text-orange-400 hover:bg-orange-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedSql ? "Copied!" : "Copy SQL Script"}
                      </button>
                    </div>
                    <div className="relative">
                      <pre className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[280px]">
                        {supabaseSql}
                      </pre>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Copy the script above, navigate to your <strong>Supabase Dashboard</strong>, select <strong>SQL Editor</strong>, paste it in a new query window, and click <strong>Run</strong>. Once the tables are successfully created, click the <strong>Refresh Connection</strong> button above to connect the sync instantly!
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
