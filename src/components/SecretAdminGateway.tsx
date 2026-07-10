import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Lock, X, Eye, EyeOff, ShieldAlert, KeyRound } from "lucide-react";
import { useToast } from "../context/ToastContext";

interface SecretAdminGatewayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretAdminGateway: React.FC<SecretAdminGatewayProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Accept "admin123" or "1234" as bypass passcodes
    if (code === "admin123" || code === "1234") {
      showToast("Access Granted. Initializing operator hub...", "success");
      onClose();
      navigate("/admin-secret");
    } else {
      setError(true);
      showToast("Invalid access credentials.", "error");
      // Reset error after animation
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`relative w-full max-w-md bg-zinc-900 border ${
              error ? "border-rose-500 shadow-rose-500/10 animate-shake" : "border-zinc-800 shadow-orange-500/5"
            } rounded-3xl p-6 md:p-8 text-zinc-100 shadow-2xl overflow-hidden`}
          >
            {/* Subtle Gradient Accent */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lock Header */}
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className={`p-4 rounded-2xl border ${
                error ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse" : "bg-orange-500/10 border-orange-500/20 text-orange-400"
              }`}>
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-xl tracking-tight text-white flex items-center justify-center gap-2">
                  Operator Restricted Area
                </h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Access requires developer clearance credentials.
                </p>
              </div>
            </div>

            {/* Passcode Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Bypass Passcode
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showCode ? "text" : "password"}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(false);
                    }}
                    placeholder="Enter operator code..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:bg-zinc-950/60 rounded-xl py-3 pl-10 pr-10 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 font-mono tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:scale-[0.98] text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer flex items-center justify-center gap-2"
              >
                Authenticate Operator
              </button>
            </form>

            {/* Operator Warning Footer */}
            <div className="mt-6 pt-5 border-t border-zinc-850 flex items-start gap-2.5 text-[11px] text-zinc-500 bg-zinc-950/20 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <ShieldAlert className="w-4 h-4 text-orange-500/60 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-400 block mb-0.5">Operator Console Alert</span>
                Standard operator bypass passcode is <code className="text-orange-400 font-mono font-bold select-all bg-orange-950/20 px-1 py-0.5 rounded">admin123</code> or <code className="text-orange-400 font-mono font-bold select-all bg-orange-950/20 px-1 py-0.5 rounded">1234</code>. Please record this for rapid entry.
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
