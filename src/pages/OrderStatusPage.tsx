import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Order, OrderStatus } from "../types";
import { useToast } from "../context/ToastContext";
import { io, Socket } from "socket.io-client";
import { 
  ChevronRight, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Compass, 
  CookingPot, 
  FileText, 
  Package, 
  ShoppingBag, 
  ArrowLeft
} from "lucide-react";
import { apiFetch } from "../utils/api";

export const OrderStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Status mapping to indices
  const statuses: OrderStatus[] = [
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered"
  ];

  const currentStatusIndex = order ? statuses.indexOf(order.orderStatus as OrderStatus) : -1;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiFetch(`/api/orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          showToast("Failed to find order.", "error");
          navigate("/orders");
        }
      } catch (err) {
        console.error("Order load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, showToast]);

  // Socket.IO real-time binding
  useEffect(() => {
    if (!id) return;

    // Connect to Socket.IO server (runs on the same origin/port)
    const socket: Socket = io();

    socket.on("connect", () => {
      console.log("Socket connected client side");
      socket.emit("joinOrder", id);
    });

    // Listen for live status change updates
    socket.on("orderStatusUpdate", (data: { orderId: string; status: OrderStatus }) => {
      console.log("Status update received:", data);
      if (data.orderId === id) {
        setOrder((prev) => (prev ? { ...prev, orderStatus: data.status } : null));
        showToast(`Order status updated to: ${data.status}!`, "info");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-100 bg-zinc-950">
        <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-100 bg-zinc-950 p-6">
        <h3 className="font-sans font-bold text-lg mb-2">Order not found</h3>
        <button onClick={() => navigate("/")} className="text-sm text-orange-400 hover:underline">
          Back to Menu
        </button>
      </div>
    );
  }

  const stepIcons = [
    <FileText className="w-5 h-5" />,
    <CheckCircle2 className="w-5 h-5" />,
    <CookingPot className="w-5 h-5" />,
    <Package className="w-5 h-5" />,
    <Compass className="w-5 h-5" />,
    <ShoppingBag className="w-5 h-5" />
  ];

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            My Orders
          </button>
          
          <span className="text-xs font-mono text-zinc-500">Order ID: {order.id}</span>
        </div>

        {/* Live Tracker Main Card */}
        <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-orange-400 tracking-wider">Real-time status</p>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {order.orderStatus === "Cancelled" ? "Order Cancelled" : "Tracking Delivery"}
              </h2>
            </div>
            
            <div className="bg-zinc-950/60 border border-zinc-800 px-4 py-2 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Est. Arrival: <strong className="text-white">20-30 mins</strong></span>
            </div>
          </div>

          {/* Visual Status Pipeline (Steps) */}
          {order.orderStatus === "Cancelled" ? (
            <div className="bg-rose-950/15 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-sm font-bold">This order was cancelled</p>
                <p className="text-xs text-rose-300/80 mt-0.5">Please contact support or place a new order on our menu page.</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Progress Bar line */}
              <div className="absolute top-6 left-8 right-8 h-1 bg-zinc-800 -z-10 hidden md:block">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                />
              </div>

              {/* Progress Steps Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-2">
                {statuses.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isActive = index === currentStatusIndex;

                  return (
                    <div key={status} className="flex flex-col items-center text-center group">
                      {/* Node Circle */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive
                            ? "bg-orange-500 border-orange-400 text-zinc-950 scale-110 shadow-lg shadow-orange-500/20 animate-pulse"
                            : isCompleted
                            ? "bg-zinc-900 border-orange-500 text-orange-500 shadow-md shadow-orange-500/5"
                            : "bg-zinc-950 border-zinc-850 text-zinc-600"
                        }`}
                      >
                        {stepIcons[index]}
                      </div>

                      {/* Label */}
                      <div className="mt-3">
                        <p className={`text-xs font-bold leading-tight ${
                          isActive ? "text-orange-400" : isCompleted ? "text-white" : "text-zinc-500"
                        }`}>
                          {status}
                        </p>
                        <p className="text-[9px] text-zinc-600 mt-0.5 hidden md:block">
                          {isActive ? "In Progress" : isCompleted ? "Completed" : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Summary Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Items Summary (col-span-7) */}
          <div className="md:col-span-7 bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white border-b border-zinc-850 pb-3">
              Ordered Items
            </h3>
            
            <div className="divide-y divide-zinc-900 space-y-3">
              {order.foodItems.map((item) => (
                <div key={item.foodId} className="flex items-center justify-between pt-3 text-xs">
                  <div className="flex gap-3 items-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-800" 
                    />
                    <div>
                      <p className="font-bold text-zinc-200">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">₹{item.price} each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-400">{item.quantity}x</p>
                    <p className="font-bold text-orange-400">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Total Items ({order.totalQuantity})</span>
              <span className="text-base font-extrabold text-orange-400">₹{order.totalPrice}</span>
            </div>
          </div>

          {/* Delivery Details (col-span-5) */}
          <div className="md:col-span-5 bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-5 text-xs text-zinc-400">
            <h3 className="text-base font-bold text-white border-b border-zinc-850 pb-3">
              Address & Contact
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-300">Delivery Address</p>
                  <p className="text-zinc-500 mt-1 leading-relaxed">{order.deliveryAddress}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Phone className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-300">Contact Number</p>
                  <p className="text-zinc-500 mt-1">{order.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Calendar className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-300">Ordered On</p>
                  <p className="text-zinc-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
