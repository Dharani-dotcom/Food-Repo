import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { CreditCard, Truck, Phone, MapPin, ClipboardCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { apiFetch } from "../utils/api";

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    address: user?.address || ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0) {
      showToast("Your basket is empty. Please add items before checking out.", "info");
      navigate("/");
    }
  }, [cart, navigate, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) newErrors.phone = "Contact phone number is required";
    if (!formData.address.trim()) newErrors.address = "Delivery address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // =========================================================================
      // TODO: PAYMENT INTEGRATION GATEWAY PLACEHOLDER
      // This is where you would process real payments via Stripe, Razorpay, etc.
      // 1. Initialize Razorpay Checkout / Stripe Elements.
      // 2. Validate token on backend.
      // 3. Mark paymentStatus as 'Paid' instead of 'Pending' in order payload.
      // 
      // Example integrations schema:
      // const paymentDetails = await paymentService.processPayment({ amount: cartTotal });
      // if (!paymentDetails.success) throw new Error("Payment gateway rejected transaction.");
      // =========================================================================

      const orderPayload = {
        foodItems: cart.map((item) => ({
          foodId: item.foodId,
          quantity: item.quantity
        })),
        deliveryAddress: formData.address,
        phone: formData.phone
      };

      const response = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      showToast("Order placed successfully! Heading to live tracking...", "success");
      clearCart();
      
      // Redirect to specific order tracking page
      navigate(`/orders/${data.id}`);
    } catch (err: any) {
      showToast(err.message || "An error occurred while placing your order.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        <h1 className="font-sans font-extrabold text-3xl md:text-4xl text-white mb-8 tracking-tight">
          Complete Your Order
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Payment Info */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
            
            {/* Delivery Form */}
            <div className="bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-zinc-900/80 backdrop-blur-md space-y-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white border-b border-zinc-850 pb-3">
                <Truck className="w-5 h-5 text-orange-500" />
                Delivery Information
              </h2>

              <div className="space-y-4">
                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.phone}</p>
                  )}
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Exact Delivery Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors resize-none"
                      placeholder="Street address, Apartment or suite number, City, Zip Code"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method Option */}
            <div className="bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-zinc-900/80 backdrop-blur-md">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white border-b border-zinc-850 pb-3 mb-5">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Payment Options
              </h2>

              {/* Highlight Cash on Delivery */}
              <div className="border-2 border-orange-500/20 bg-orange-950/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Cash on Delivery (COD)</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Pay with cash or card upon delivery driver arrival.</p>
                </div>
                <div className="w-5 h-5 rounded-full border-4 border-orange-500 bg-zinc-950 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
              </div>

              {/* Secure Checkout Badge */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-5 justify-center">
                <ShieldCheck className="w-4 h-4 text-orange-500/80" />
                <span>SSL Secured & encrypted billing connection</span>
              </div>
            </div>
          </form>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/50 p-6 md:p-8 rounded-3xl border border-zinc-900/80 backdrop-blur-md sticky top-28 space-y-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white border-b border-zinc-850 pb-3">
                <ClipboardCheck className="w-5 h-5 text-orange-500" />
                Order Summary
              </h2>

              {/* Basket Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-zinc-850 space-y-3 pr-2 scrollbar-none">
                {cart.map((item) => (
                  <div key={item.foodId} className="flex justify-between items-center pt-3 text-xs">
                    <div className="flex gap-2.5 items-center">
                      <span className="bg-zinc-800 text-orange-400 font-bold px-2 py-0.5 rounded text-[10px]">
                        {item.quantity}x
                      </span>
                      <p className="font-semibold text-zinc-200 truncate max-w-[150px]">{item.food.name}</p>
                    </div>
                    <span className="font-bold text-zinc-100">₹{item.food.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Cost Totals */}
              <div className="border-t border-zinc-850 pt-4 space-y-2 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2.5 border-t border-zinc-850">
                  <span>Grand Total</span>
                  <span className="text-orange-400 text-base font-extrabold">₹{cartTotal}</span>
                </div>
              </div>

              {/* Order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-600/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ClipboardCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
