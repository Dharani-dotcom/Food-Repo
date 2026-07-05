import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { CreditCard, Truck, Phone, MapPin, ClipboardCheck, ArrowLeft, ShieldCheck, QrCode, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
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

  // Payment integration states
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "GPay" | "PhonePe">("COD");
  const [upiId, setUpiId] = useState("");
  const [isUpiRequestSent, setIsUpiRequestSent] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"idle" | "verifying" | "success">("idle");
  const [countdown, setCountdown] = useState(60);
  const [isVerifyingUpiId, setIsVerifyingUpiId] = useState(false);

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0) {
      showToast("Your basket is empty. Please add items before checking out.", "info");
      navigate("/");
    }
  }, [cart, navigate, showToast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentStep === "verifying" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStep, countdown]);

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

  const startPaymentVerification = () => {
    setCountdown(60);
    setPaymentStep("verifying");
    setIsUpiRequestSent(false);
  };

  const submitPaidOrder = async () => {
    setLoading(true);
    try {
      const orderPayload = {
        foodItems: cart.map((item) => ({
          foodId: item.foodId,
          quantity: item.quantity
        })),
        deliveryAddress: formData.address,
        phone: formData.phone,
        paymentStatus: "Paid"
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

      showToast(`Payment of ₹${cartTotal} successful! Your order has been placed.`, "success");
      clearCart();
      setPaymentStep("idle");
      navigate(`/orders/${data.id}`);
    } catch (err: any) {
      showToast(err.message || "An error occurred while processing your order.", "error");
      setPaymentStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (paymentMethod !== "COD") {
      startPaymentVerification();
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        foodItems: cart.map((item) => ({
          foodId: item.foodId,
          quantity: item.quantity
        })),
        deliveryAddress: formData.address,
        phone: formData.phone,
        paymentStatus: "Pending"
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

              <div className="space-y-3.5">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-orange-500 bg-orange-950/10"
                      : "border-zinc-800 hover:border-zinc-750 bg-zinc-950/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">Pay with cash or card upon delivery driver arrival.</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center ${
                    paymentMethod === "COD" ? "border-orange-500 bg-zinc-950" : "border-zinc-700 bg-zinc-950"
                  }`}>
                    {paymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                  </div>
                </div>

                {/* Google Pay */}
                <div
                  onClick={() => setPaymentMethod("GPay")}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "GPay"
                      ? "border-orange-500 bg-orange-950/10"
                      : "border-zinc-800 hover:border-zinc-750 bg-zinc-950/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-zinc-800 flex items-center justify-center font-bold text-sm text-white select-none">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">P</span>
                      <span className="text-yellow-500">a</span>
                      <span className="text-green-500">y</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Google Pay (GPay)</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Pay instantly using Google Pay UPI app or QR.</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center ${
                    paymentMethod === "GPay" ? "border-orange-500 bg-zinc-950" : "border-zinc-700 bg-zinc-950"
                  }`}>
                    {paymentMethod === "GPay" && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                  </div>
                </div>

                {/* PhonePe */}
                <div
                  onClick={() => setPaymentMethod("PhonePe")}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "PhonePe"
                      ? "border-orange-500 bg-orange-950/10"
                      : "border-zinc-800 hover:border-zinc-750 bg-zinc-950/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 border border-indigo-500 flex items-center justify-center font-bold text-xs text-white select-none">
                      Pe
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">PhonePe</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Pay instantly using PhonePe UPI app or QR.</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center ${
                    paymentMethod === "PhonePe" ? "border-orange-500 bg-zinc-950" : "border-zinc-700 bg-zinc-950"
                  }`}>
                    {paymentMethod === "PhonePe" && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                  </div>
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

      {/* UPI Payment Verification Overlay Modal */}
      {paymentStep !== "idle" && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-905 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            
            {/* Top Bar / Title */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-3 rounded-full bg-orange-500/10 text-orange-500 mb-2">
                {paymentMethod === "GPay" ? (
                  <span className="font-extrabold text-lg tracking-wider text-white select-none">
                    <span className="text-blue-500">G</span>
                    <span className="text-red-500">P</span>
                    <span className="text-yellow-500">a</span>
                    <span className="text-green-500">y</span>
                  </span>
                ) : (
                  <span className="font-extrabold text-sm tracking-wide text-indigo-400 select-none">PhonePe</span>
                )}
              </div>
              <h3 className="text-xl font-black text-white">UPI Payment Gateway</h3>
              <p className="text-xs text-zinc-400">
                Completing your order of <span className="font-bold text-orange-400">₹{cartTotal}</span>
              </p>
            </div>

            {paymentStep === "verifying" && (
              <div className="space-y-6">
                
                {/* Method Tabs: QR Code */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-orange-500" />
                    Scan QR Code to Pay
                  </p>
                  
                  {/* Real, scannable UPI QR Code using qrserver */}
                  <div className="bg-white p-2.5 rounded-xl border-4 border-zinc-800">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=masalakitchen@okaxis&pn=Masala%20Kitchen&am=${cartTotal}&cu=INR&tn=MasalaKitchenOrder`
                      )}`}
                      alt="UPI Payment QR Code"
                      className="w-[150px] h-[150px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400 max-w-[280px]">
                    Open your {paymentMethod === "GPay" ? "Google Pay" : "PhonePe"} app, tap Scan QR, scan this code, and authorize payment of <span className="font-bold text-white">₹{cartTotal}</span>.
                  </p>
                </div>

                {/* Enter UPI ID Form */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Or pay via UPI ID Request
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full bg-zinc-950 border border-zinc-850 focus:border-orange-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none text-white transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isVerifyingUpiId || !upiId.trim()}
                      onClick={async () => {
                        setIsVerifyingUpiId(true);
                        // simulate requesting push notification
                        await new Promise(r => setTimeout(r, 800));
                        setIsVerifyingUpiId(false);
                        setIsUpiRequestSent(true);
                        showToast("UPI Collect Request Sent! Please approve on your UPI App.", "info");
                      }}
                      className="bg-zinc-800 hover:bg-zinc-750 text-white font-bold px-4 rounded-xl text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Request
                    </button>
                  </div>
                  {isUpiRequestSent && (
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Collect Request sent to your UPI App!
                    </p>
                  )}
                </div>

                {/* Verification Actions & Timer */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>Awaiting payment...</span>
                    <span className="font-mono text-orange-400">{countdown}s remaining</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentStep("idle")}
                      className="border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                    >
                      Cancel Payment
                    </button>
                    
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setPaymentStep("success");
                        setTimeout(() => {
                          submitPaidOrder();
                        }, 1800);
                      }}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg hover:shadow-orange-600/10 transition-all flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Simulate Success</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Payment Received!</h4>
                <p className="text-xs text-zinc-400 max-w-xs">
                  We have verified your UPI payment of <span className="font-bold text-white">₹{cartTotal}</span>. Placing your order now...
                </p>
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2"></div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
