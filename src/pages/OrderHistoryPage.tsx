import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Order } from "../types";
import { useToast } from "../context/ToastContext";
import { FileClock, ChevronRight, ShoppingBag, Eye } from "lucide-react";
import { apiFetch } from "../utils/api";

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiFetch("/api/orders");
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          showToast("Failed to fetch order history.", "error");
        }
      } catch (err) {
        console.error("Order history error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [showToast]);

  const getStatusStyle = (status: Order["orderStatus"]) => {
    const defaultClasses = "text-[10px] font-bold px-2.5 py-1 rounded-full border";
    switch (status) {
      case "Pending":
        return `${defaultClasses} bg-zinc-900 border-zinc-800 text-zinc-400`;
      case "Accepted":
        return `${defaultClasses} bg-sky-500/10 border-sky-500/20 text-sky-400`;
      case "Preparing":
        return `${defaultClasses} bg-amber-500/10 border-amber-500/20 text-amber-400`;
      case "Ready":
        return `${defaultClasses} bg-indigo-500/10 border-indigo-500/20 text-indigo-400`;
      case "Out for Delivery":
        return `${defaultClasses} bg-orange-500/10 border-orange-500/20 text-orange-400`;
      case "Delivered":
        return `${defaultClasses} bg-emerald-500/10 border-emerald-500/20 text-emerald-400`;
      case "Cancelled":
        return `${defaultClasses} bg-rose-500/10 border-rose-500/20 text-rose-400`;
    }
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="font-sans font-extrabold text-3xl text-white tracking-tight">
            Order History
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Review your past purchases and track current pending active deliveries
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg">No orders yet</h3>
              <p className="text-xs text-zinc-500 mt-1">Looks like you haven't ordered anything yet. Take a look at our delicious menu!</p>
            </div>
            <Link
              to="/"
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg mt-2"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const itemSummary = order.foodItems.map(i => `${i.quantity}x ${i.name}`).join(", ");

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-black/20"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-4">
                    {/* Visual icon badge */}
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850/80 flex items-center justify-center text-orange-500 shrink-0">
                      <FileClock className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-zinc-100 truncate text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <span className={getStatusStyle(order.orderStatus)}>
                          {order.orderStatus}
                        </span>
                      </div>
                      
                      <p className="text-xs text-zinc-400 mt-1 truncate max-w-[400px]">
                        {itemSummary}
                      </p>
                      
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">ID: {order.id}</p>
                    </div>
                  </div>

                    <div className="flex items-center gap-5 self-end sm:self-center">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Grand Total</p>
                        <p className="text-lg font-extrabold text-orange-400 leading-none mt-1">₹{order.totalPrice}</p>
                      </div>
                    
                    <button
                      className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 hover:border-zinc-700 text-zinc-400 group-hover:text-white transition-all cursor-pointer"
                      title="View tracking"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
