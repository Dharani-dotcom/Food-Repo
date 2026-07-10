import React, { useState, useEffect } from "react";
import { Food, Order, OrderStatus } from "../types";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../utils/api";
import { isFirebaseConfigured } from "../utils/firebaseClient";
import {
  Users,
  ShoppingBag,
  IndianRupee,
  Phone,
  MapPin,
  Mail,
  Clock,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  Copy,
  Package,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Image as ImageIcon,
  Check
} from "lucide-react";

type TabType = "orders" | "menu" | "database";

export const AdminSecretPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dbStatus, setDbStatus] = useState({
    configured: isFirebaseConfigured,
    connected: false,
    error: ""
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Menu Form States
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [foodForm, setFoodForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    category: "Starters",
    image: "",
    available: true,
    rating: 4.8
  });

  const categories = ["Starters", "Mains", "Breads", "Desserts", "Beverages"];
  const statuses: OrderStatus[] = [
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const ordersRes = await apiFetch("/api/orders");
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }

      // 2. Fetch Foods
      const foodsRes = await apiFetch("/api/foods");
      if (foodsRes.ok) {
        setFoods(await foodsRes.json());
      }

      // 3. Test Database Connectivity
      if (isFirebaseConfigured) {
        try {
          const { firebaseFallback } = await import("../utils/firebaseClient");
          await firebaseFallback.getOrders();
          setDbStatus({
            configured: true,
            connected: true,
            error: ""
          });
        } catch (err: any) {
          setDbStatus({
            configured: true,
            connected: false,
            error: err.message || "Failed to connect to Firebase Firestore."
          });
        }
      } else {
        setDbStatus({
          configured: false,
          connected: false,
          error: "Firebase not configured in client env keys."
        });
      }
    } catch (err: any) {
      console.error("Error fetching admin bypass data:", err);
      setDbStatus((prev) => ({
        ...prev,
        connected: false,
        error: err.message || "Network error"
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Order status updated to ${newStatus}!`, "success");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      } else {
        showToast("Failed to update order status.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Status update failed: ${err.message || "Error"}`, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Food CRUD Operations
  const handleAddFoodClick = () => {
    setFoodForm({
      id: "",
      name: "",
      description: "",
      price: "",
      category: "Starters",
      image: "",
      available: true,
      rating: 4.8
    });
    setIsEditingMenu(true);
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
    setIsEditingMenu(true);
  };

  const handleToggleAvailability = async (food: Food) => {
    try {
      const updatedStatus = !food.available;
      const response = await apiFetch(`/api/foods/${food.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...food, available: updatedStatus })
      });

      if (response.ok) {
        showToast(`${food.name} is now ${updatedStatus ? "Available" : "Unavailable"}`, "success");
        setFoods((prev) =>
          prev.map((f) => (f.id === food.id ? { ...f, available: updatedStatus } : f))
        );
      } else {
        showToast("Failed to toggle availability.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status.", "error");
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price || !foodForm.description) {
      showToast("Please fill in name, description, and price.", "warning");
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
        rating: Number(foodForm.rating || 4.8)
      };

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Food successfully ${isNew ? "created" : "updated"}!`, "success");
        setIsEditingMenu(false);
        // Refresh foods
        const refreshRes = await apiFetch("/api/foods");
        if (refreshRes.ok) {
          setFoods(await refreshRes.json());
        }
      } else {
        showToast("Error saving food details.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save menu item.", "error");
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this dish from the menu?")) return;
    try {
      const response = await apiFetch(`/api/foods/${id}`, { method: "DELETE" });
      if (response.ok) {
        showToast("Dish removed from menu.", "success");
        setFoods((prev) => prev.filter((f) => f.id !== id));
      } else {
        showToast("Failed to delete dish.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error deleting dish.", "error");
    }
  };

  // Image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("File is too large. Choose under 2MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFoodForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`, "success");
  };

  // Analytics
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled"
  ).length;
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Filters
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      order.userName.toLowerCase().includes(term) ||
      order.phone.includes(term) ||
      order.deliveryAddress.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "All" || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    const base = "text-[10px] font-bold px-2.5 py-1 rounded-full border ";
    switch (status) {
      case "Pending":
        return base + "bg-zinc-900 border-zinc-800 text-zinc-400";
      case "Accepted":
        return base + "bg-sky-500/10 border-sky-500/20 text-sky-400";
      case "Preparing":
        return base + "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "Ready":
        return base + "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
      case "Out for Delivery":
        return base + "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "Delivered":
        return base + "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Cancelled":
        return base + "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }
  };

  const sqlScript = "";

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-10 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP STATUS BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Full-Stack Firebase Control Panel & Bypass</span>
            </div>
            <h1 className="font-sans font-extrabold text-3xl text-white tracking-tight leading-none">
              Secret Operator Hub <span className="text-zinc-600 text-xl font-normal">(Client-Direct)</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-1.5">
              Perfect for stateless container environments. Full control over Menu, Orders, Customers, and database configurations.
            </p>
          </div>

          {/* SYSTEM SYNC STATUS */}
          <div className="bg-zinc-900/65 border border-zinc-900 p-4 rounded-2xl flex items-center gap-4 shrink-0 max-w-sm w-full md:w-auto">
            <div className={`p-2.5 rounded-xl border ${dbStatus.connected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Firebase Backend</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs font-bold text-white">
                  {dbStatus.connected ? "Connected & Live" : "Unconnected / Configuring"}
                </p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 truncate" title={dbStatus.error}>
                {dbStatus.connected ? "Real-time sync active" : dbStatus.error || "Awaiting database initialization."}
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gross Revenue</p>
              <p className="text-2xl font-extrabold text-orange-400">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Received Orders</p>
              <p className="text-2xl font-extrabold text-white">{totalOrdersCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Deliveries</p>
              <p className="text-2xl font-extrabold text-indigo-400">{activeOrdersCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-zinc-900 gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 px-2 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "orders" ? "border-orange-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Customer Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`pb-4 px-2 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "menu" ? "border-orange-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Food Menu ({foods.length})
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`pb-4 px-2 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === "database" ? "border-orange-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Copy SQL Schema
          </button>
        </div>

        {/* ======================= ORDERS TAB ======================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customer name, contact, address..."
                  className="w-full bg-zinc-900/60 border border-zinc-850 focus:border-orange-500 focus:bg-zinc-900 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                <span className="text-zinc-500 text-xs font-semibold mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {["All", ...statuses].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                      statusFilter === st
                        ? "bg-white text-zinc-950 border-white"
                        : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900 text-center py-16 rounded-3xl">
                <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">No Matching Orders</h3>
                <p className="text-xs text-zinc-500 mt-1">Please try searching another query or add some orders first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-850 transition-all shadow-xl">
                    <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-900 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">Order ID</p>
                        <p className="text-xs font-mono font-extrabold text-white select-all">{order.id}</p>
                      </div>
                      <span className={getStatusBadgeClass(order.orderStatus)}>{order.orderStatus}</span>
                    </div>

                    <div className="p-5 border-b border-zinc-900 bg-zinc-900/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                          {order.userName.substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Customer</p>
                          <p className="text-sm font-extrabold text-white mt-0.5 truncate">{order.userName}</p>
                        </div>
                        <div className="text-right text-[10px] text-zinc-500">
                          <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="font-mono mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                          <div className="min-w-0 flex-grow">
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Contact Number</p>
                            <p className="text-xs font-semibold text-zinc-300 mt-1 truncate">{order.phone || "N/A"}</p>
                          </div>
                          {order.phone && (
                            <button onClick={() => copyToClipboard(order.phone, "Phone")} className="p-1 text-zinc-500 hover:text-white transition-all cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                          <div className="min-w-0 flex-grow">
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">Email Address</p>
                            <p className="text-xs font-semibold text-zinc-300 mt-1 truncate">{order.userEmail || "N/A"}</p>
                          </div>
                          {order.userEmail && (
                            <button onClick={() => copyToClipboard(order.userEmail, "Email")} className="p-1 text-zinc-500 hover:text-white transition-all cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-grow">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">Delivery Address</p>
                          <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{order.deliveryAddress || "No delivery address supplied."}</p>
                        </div>
                        {order.deliveryAddress && (
                          <button onClick={() => copyToClipboard(order.deliveryAddress, "Address")} className="p-1 text-zinc-500 hover:text-white transition-all cursor-pointer shrink-0">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-5 border-b border-zinc-900">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Foodstuffs Ordered</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {order.foodItems.map((item, idx) => (
                          <div key={item.foodId || idx} className="flex items-center gap-3 py-2 border-b border-zinc-900/60 last:border-0">
                            {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-800" referrerPolicy="no-referrer" />}
                            <div className="min-w-0 flex-grow">
                              <p className="text-xs font-bold text-white truncate">{item.name}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">₹{item.price} x {item.quantity}</p>
                            </div>
                            <p className="text-xs font-bold text-orange-400">₹{item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Total Bill</p>
                        <p className="text-xl font-black text-white">₹{order.totalPrice.toLocaleString()}</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {["Preparing", "Ready", "Out for Delivery", "Delivered"].map((st) => (
                          <button
                            key={st}
                            disabled={updatingOrderId === order.id}
                            onClick={() => handleUpdateStatus(order.id, st as OrderStatus)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                              order.orderStatus === st
                                ? "bg-orange-600 border-orange-500 text-white"
                                : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700"
                            } disabled:opacity-50`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= MENU TAB ======================= */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-zinc-400">
                You can create new food items, update existing ones, upload photos, change prices, and toggle in-stock availability instantly.
              </p>
              <button
                onClick={handleAddFoodClick}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-orange-600/10"
              >
                <Plus className="w-4 h-4" />
                Add New Dish
              </button>
            </div>

            {/* EDIT/ADD MODAL SEGMENT */}
            {isEditingMenu && (
              <form onSubmit={handleSaveFood} className="bg-zinc-900/40 border border-orange-500/25 p-6 rounded-3xl space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    {foodForm.id ? "Edit Foodstuff Details" : "Create New Foodstuff Entry"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingMenu(false)}
                    className="text-xs text-zinc-500 hover:text-white font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Dish Name *</label>
                    <input
                      type="text"
                      required
                      value={foodForm.name}
                      onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                      placeholder="e.g. Kashmiri Dum Aloo"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Category *</label>
                    <select
                      value={foodForm.category}
                      onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs outline-none text-zinc-200"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Price (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      value={foodForm.price}
                      onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                      placeholder="e.g. 249"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs outline-none text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Image URL or Local Upload</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={foodForm.image}
                        onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-grow bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs outline-none text-zinc-200"
                      />
                      <label className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer text-zinc-400 hover:text-white text-xs flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Description / Ingredients *</label>
                  <textarea
                    required
                    rows={3}
                    value={foodForm.description}
                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    placeholder="Provide delicious details, spice levels, allergens..."
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs outline-none text-zinc-200 resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={foodForm.available}
                      onChange={(e) => setFoodForm({ ...foodForm, available: e.target.checked })}
                      className="rounded border-zinc-800 bg-zinc-950 text-orange-500 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-300 font-bold">Mark as Instock Available</span>
                  </label>

                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                  >
                    {foodForm.id ? "Save Changes" : "Publish Dish"}
                  </button>
                </div>
              </form>
            )}

            {/* FOOD ITEMS LIST */}
            {loading ? (
              <div className="flex justify-center py-12">
                <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {foods.map((food) => (
                  <div key={food.id} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-all flex flex-col justify-between">
                    <div className="relative aspect-video w-full bg-zinc-950">
                      {food.image ? (
                        <img src={food.image} alt={food.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-950/80">
                          <ImageIcon className="w-8 h-8 stroke-[1.25]" />
                          <span className="text-[10px] mt-1">No Food Photo</span>
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 bg-zinc-950/80 border border-zinc-850 backdrop-blur-md text-[10px] font-bold text-orange-400 px-2 py-1 rounded-lg">
                        ₹{food.price}
                      </span>
                      <span className="absolute top-2.5 left-2.5 bg-zinc-950/80 border border-zinc-850 backdrop-blur-md text-[9px] text-zinc-400 px-2 py-0.5 rounded-md capitalize">
                        {food.category}
                      </span>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-white leading-tight">{food.name}</h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-normal">{food.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <button
                          onClick={() => handleToggleAvailability(food)}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-[10px]"
                        >
                          {food.available ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> In Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-zinc-500 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> Out of stock
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditFoodClick(food)}
                            className="p-1.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food.id)}
                            className="p-1.5 bg-zinc-950 border border-zinc-900 hover:border-red-950 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= DATABASE SETUP TAB ======================= */}
        {activeTab === "database" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-3xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-2xl text-orange-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Connected with Firebase Firestore</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    Your application is integrated with NoSQL Firebase Cloud Firestore. Since Firestore is document-based, all collections (foods, orders, users, passwords) are automatically created on-demand as soon as the first read or write operation occurs.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-900">
                <p className="text-xs font-bold text-zinc-300">Why Firebase is the perfect backend:</p>
                <ul className="list-disc pl-5 text-xs text-zinc-500 space-y-2">
                  <li>
                    <strong className="text-zinc-400">Zero Maintenance</strong>: No manual table creation, schemas, migration scripts, or SQL COPY/PASTE required.
                  </li>
                  <li>
                    <strong className="text-zinc-400">Stateless Resilience</strong>: Secures all registration logins, menu edits, and food orders in real-time even when Cloud Run containers restart.
                  </li>
                  <li>
                    <strong className="text-zinc-400">Sub-second Latency</strong>: Leverages Firestore's dynamic real-time data subscription layers for instantaneous feedback.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
