import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, User, Phone, MapPin } from "lucide-react";

export const AuthPage: React.FC = () => {
  const { login, register, user, error, clearError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Redirect target
  const redirectPath = location.state?.redirect || "/";
  const redirectMsg = location.state?.message;

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "User" // Default is User, but users can register as Admin with a special email or selection if needed for development
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleQuickLogin = async (role: "Admin" | "User") => {
    setLoading(true);
    const email = role === "Admin" ? "admin@masalakitchen.in" : "user@masalakitchen.in";
    const password = role === "Admin" ? "admin123" : "user123";
    
    setFormData((prev) => ({
      ...prev,
      email,
      password
    }));

    const success = await login(email, password);
    if (success) {
      showToast(`Signed in successfully as ${role}!`, "success");
      navigate(redirectPath);
    } else {
      showToast(error || "Invalid login credentials", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  useEffect(() => {
    if (redirectMsg) {
      showToast(redirectMsg, "info");
    }
    return () => clearError();
  }, [redirectMsg, clearError, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isLogin) {
      if (!formData.email) errors.email = "Email is required";
      else if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";
      
      if (!formData.password) errors.password = "Password is required";
    } else {
      if (!formData.name.trim()) errors.name = "Full name is required";
      
      if (!formData.email) errors.email = "Email is required";
      else if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";
      
      if (!formData.password) errors.password = "Password is required";
      else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
      
      if (!formData.phone.trim()) errors.phone = "Phone number is required";
      
      if (!formData.address.trim()) errors.address = "Delivery address is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    if (isLogin) {
      const success = await login(formData.email, formData.password);
      if (success) {
        showToast("Signed in successfully!", "success");
        navigate(redirectPath);
      } else {
        showToast(error || "Invalid login credentials", "error");
      }
    } else {
      const success = await register(formData);
      if (success) {
        showToast("Account registered successfully!", "success");
        navigate(redirectPath);
      } else {
        showToast(error || "Failed to register account", "error");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-900/80 backdrop-blur-md shadow-2xl">
        {/* Toggle tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => {
              setIsLogin(true);
              setFormErrors({});
              clearError();
            }}
            className={`flex-1 pb-4 text-center font-bold text-sm tracking-wide transition-all border-b-2 cursor-pointer ${
              isLogin ? "border-orange-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setFormErrors({});
              clearError();
            }}
            className={`flex-1 pb-4 text-center font-bold text-sm tracking-wide transition-all border-b-2 cursor-pointer ${
              !isLogin ? "border-orange-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Register
          </button>
        </div>

        {/* Brand Greeting */}
        <div className="text-center">
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {isLogin ? "Sign in to access your gourmet orders" : "Sign up to start placing fresh gourmet orders"}
          </p>
        </div>

        {/* Demo Accounts Quick Login */}
        {isLogin && (
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Demo / Test Accounts</span>
              <span className="text-[10px] text-zinc-500 font-mono">Ready-Made DB</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("User")}
                disabled={loading}
                className="flex flex-col items-start p-2.5 bg-zinc-900 border border-zinc-850 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-xl transition-all text-left group cursor-pointer"
              >
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">Customer Account</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">user@masalakitchen.in</span>
                <span className="text-[9px] px-1.5 py-0.5 mt-1.5 bg-zinc-950 rounded-md border border-zinc-800 text-zinc-400 font-mono">user123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("Admin")}
                disabled={loading}
                className="flex flex-col items-start p-2.5 bg-zinc-900 border border-zinc-850 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-xl transition-all text-left group cursor-pointer"
              >
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">Admin / Operator</span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">admin@masalakitchen.in</span>
                <span className="text-[9px] px-1.5 py-0.5 mt-1.5 bg-zinc-950 rounded-md border border-zinc-800 text-zinc-400 font-mono">admin123</span>
              </button>
            </div>
            
            <p className="text-[10px] text-center text-zinc-500">
              Click either card to instantly fill credentials and sign in!
            </p>
          </div>
        )}

        {/* Global Error message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                {formErrors.name && (
                  <p className="text-rose-500 text-[10px] mt-1 font-semibold">{formErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-rose-500 text-[10px] mt-1 font-semibold">{formErrors.phone}</p>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
            {formErrors.email && (
              <p className="text-rose-500 text-[10px] mt-1 font-semibold">{formErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all"
                placeholder="******"
              />
            </div>
            {formErrors.password && (
              <p className="text-rose-500 text-[10px] mt-1 font-semibold">{formErrors.password}</p>
            )}
          </div>

          {!isLogin && (
            <>
              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all resize-none"
                    placeholder="Connaught Place, New Delhi, Delhi 110001"
                  />
                </div>
                {formErrors.address && (
                  <p className="text-rose-500 text-[10px] mt-1 font-semibold">{formErrors.address}</p>
                )}
              </div>

              {/* Developer Role Selection (Allows easy testing as Admin or User) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Register Role (For testing convenience)
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl py-2.5 px-4 text-sm text-zinc-100 outline-none transition-all cursor-pointer"
                >
                  <option value="User">Standard Customer (User)</option>
                  <option value="Admin">Restaurant Operator (Admin)</option>
                </select>
              </div>
            </>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-orange-600/20 active:scale-[0.98] transition-all cursor-pointer mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
