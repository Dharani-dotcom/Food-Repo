import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const iconMap = {
              success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
              error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
            };

            const bgMap = {
              success: "bg-zinc-900/90 border-emerald-500/30 text-emerald-50",
              error: "bg-zinc-900/90 border-rose-500/30 text-rose-50",
              warning: "bg-zinc-900/90 border-amber-500/30 text-amber-50",
              info: "bg-zinc-900/90 border-sky-500/30 text-sky-50"
            };

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${bgMap[toast.type]}`}
              >
                <div className="flex items-center gap-3">
                  {iconMap[toast.type]}
                  <p className="text-sm font-medium">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
