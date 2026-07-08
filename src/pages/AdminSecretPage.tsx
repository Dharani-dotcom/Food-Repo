import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "../types";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../utils/api";
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient";
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
  ArrowUpDown,
  RefreshCw,
  Copy,
  UserCheck,
  Package,
  ChevronRight
} from "lucide-react";

export const AdminSecretPage: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dbStatus, setDbStatus] = useState({
    configured: isSupabaseConfigured,
    connected: false,
    error: ""
  });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const statuses: OrderStatus[] = [
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  const fetchOrdersAndStatus = async () => {
    setLoading(true);
    try {
      // Fetch orders using self-healing apiFetch
      const res = await apiFetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        showToast("Failed to fetch orders from directory.", "error");
      }

      // Check direct Supabase status
      if (supabase) {
        const { error } = await supabase.from("orders").select("id").limit(1);
        setDbStatus({
          configured: true,
          connected: !error,
          error: error ? error.message : ""
        });
      } else {
        setDbStatus({
          configured: false,
          connected: false,
          error: "Supabase client not initialized. Check your environment keys."
        });
      }
    } catch (err: any) {
      console.error("Error in Secret Admin fetch:", err);
      setDbStatus((prev) => ({
        ...prev,
        connected: false,
        error: err.message || "Network connection failure."
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndStatus();
  }, []);

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
        // Local update
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      } else {
        // Direct Supabase update fallback if API server is missing/offline
        if (supabase) {
          const { error } = await supabase
            .from("orders")
            .update({ order_status: newStatus })
            .eq("id", orderId);

          if (!error) {
            showToast(`Order status updated directly in Supabase to ${newStatus}!`, "success");
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
            );
          } else {
            throw error;
          }
        } else {
          showToast("Failed to update status. No database connection.", "error");
        }
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      showToast(`Failed to update status: ${err.message || "Error"}`, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, "success");
  };

  // Metrics calculations
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled"
  ).length;
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

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

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-10 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Secret Customer Directory & Order Tracker</span>
            </div>
            <h1 className="font-sans font-extrabold text-3xl text-white tracking-tight leading-none">
              Admin Control Panel <span className="text-zinc-600 text-xl font-normal">(Public Bypass)</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-1.5">
              Instant access to track and update customer names, phone numbers, delivery addresses, and ordered foodstuffs directly from Supabase.
            </p>
          </div>

          {/* DATABASE CONNECTION STATUS CARD */}
          <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl flex items-center gap-4 shrink-0 max-w-sm w-full md:w-auto">
            <div className={`p-2.5 rounded-xl border ${dbStatus.connected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Supabase Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs font-bold text-white">
                  {dbStatus.connected ? "Active & Syncing" : "Offline / Unlinked"}
                </p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 truncate" title={dbStatus.error}>
                {dbStatus.connected ? "Connected to PostgreSQL" : dbStatus.error || "Please run SQL table schema setup."}
              </p>
            </div>
            <button
              onClick={fetchOrdersAndStatus}
              disabled={loading}
              className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Revenue</p>
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

        {/* CONTROLS BAR: SEARCH & STATUS FILTER */}
        <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone number, address or ID..."
              className="w-full bg-zinc-900/60 border border-zinc-850 focus:border-orange-500 focus:bg-zinc-900 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
            <span className="text-zinc-500 text-xs font-semibold mr-1 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Filter Status:
            </span>
            {["All", ...statuses].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                  statusFilter === st
                    ? "bg-zinc-100 border-white text-zinc-950 shadow-md"
                    : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs text-zinc-500 font-medium">Fetching secure customer records from Supabase...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-850/80 flex items-center justify-center text-zinc-700">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-white">No Customer Orders Found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                No orders match your current search filters. Check if your Supabase database is connected or try another search query.
              </p>
            </div>
          </div>
        ) : (
          /* ORDERS DIRECTORY GRID */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              return (
                <div
                  key={order.id}
                  className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl"
                >
                  {/* CARD HEADER */}
                  <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-900 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono text-zinc-500">ORDER ID</p>
                      <p className="text-xs font-extrabold font-mono text-white select-all">{order.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={getStatusBadgeClass(order.orderStatus)}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* CUSTOMER DETAILS BLOCK */}
                  <div className="p-5 border-b border-zinc-900 bg-zinc-900/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {order.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-none">Customer Name</p>
                        <p className="text-sm font-extrabold text-white mt-1 truncate">{order.userName}</p>
                      </div>
                      <div className="text-right text-[10px] text-zinc-500">
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="font-mono mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    {/* Phone and Address Rows */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                        <div className="min-w-0 flex-grow">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Contact Number</p>
                          <p className="text-xs font-semibold text-zinc-300 mt-1.5 truncate">
                            {order.phone || "No phone number"}
                          </p>
                        </div>
                        {order.phone && (
                          <button
                            onClick={() => copyToClipboard(order.phone, "Phone number")}
                            className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-white transition-all cursor-pointer"
                            title="Copy phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                        <div className="min-w-0 flex-grow">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Email Address</p>
                          <p className="text-xs font-semibold text-zinc-300 mt-1.5 truncate">
                            {order.userEmail || "No email"}
                          </p>
                        </div>
                        {order.userEmail && (
                          <button
                            onClick={() => copyToClipboard(order.userEmail, "Email address")}
                            className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-white transition-all cursor-pointer"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-grow">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Delivery Address</p>
                        <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                          {order.deliveryAddress || "No delivery address supplied."}
                        </p>
                      </div>
                      {order.deliveryAddress && (
                        <button
                          onClick={() => copyToClipboard(order.deliveryAddress, "Address")}
                          className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-white mt-2 transition-all cursor-pointer shrink-0"
                          title="Copy address"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RESPECTIVE ORDER FOOD ITEMS */}
                  <div className="p-5 border-b border-zinc-900">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">Respective Foodstuffs Ordered</p>
                    <div className="divide-y divide-zinc-900 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {order.foodItems.map((item, index) => (
                        <div key={item.foodId || index} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-850"
                            />
                          )}
                          <div className="min-w-0 flex-grow">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">₹{item.price} each</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-orange-400">₹{(item.price * item.quantity).toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD ACTIONS & FOOTER */}
                  <div className="p-5 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Charge ({order.totalQuantity} items)</p>
                      <p className="text-xl font-black text-white mt-0.5">₹{order.totalPrice.toLocaleString()}</p>
                    </div>

                    {/* STATUS ACTION UPDATER CONTROL */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider w-full sm:w-auto mb-1 sm:mb-0 sm:mr-1">Change Status:</p>
                      <div className="flex flex-wrap gap-1">
                        {["Preparing", "Ready", "Out for Delivery", "Delivered"].map((st) => (
                          <button
                            key={st}
                            disabled={updatingOrderId === order.id}
                            onClick={() => handleUpdateStatus(order.id, st as OrderStatus)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
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

                </div>
              );
            })}
          </div>
        )}

        {/* SECURE DIRECTORY SQL EXPLANATION FOR PRODUCTION */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-3xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white">How to secure or set up your Supabase database in production (Vercel)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                If your foods are not showing up in your deployed app (like on Vercel), it means either:
              </p>
              <ul className="list-disc pl-5 text-xs text-zinc-500 mt-2 space-y-1.5 leading-relaxed">
                <li>
                  Your **Supabase Environment Variables** (<code className="text-zinc-300 font-mono">SUPABASE_URL</code> and <code className="text-zinc-300 font-mono">SUPABASE_ANON_KEY</code>) have not been added to your Vercel Project Settings. Add them as environment variables in your Vercel panel.
                </li>
                <li>
                  Your Supabase PostgreSQL Database does not have the necessary tables created yet. Click the **Admin Page** tab and execute the SQL schema inside your Supabase SQL Editor.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
