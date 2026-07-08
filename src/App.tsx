import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";

// Pages
import { MenuPage } from "./pages/MenuPage";
import { AuthPage } from "./pages/AuthPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { OrderStatusPage } from "./pages/OrderStatusPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { AdminSecretPage } from "./pages/AdminSecretPage";

// Protected Route wrappers
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-zinc-950 text-zinc-100">
        <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-zinc-950 text-zinc-100">
        <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!user || user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/20 selection:text-orange-400">
      {/* Navbar with sliding drawer handle */}
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      
      {/* Sliding Basket Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Main Content Router View */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders/:id" 
            element={
              <ProtectedRoute>
                <OrderStatusPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin-secret" 
            element={<AdminSecretPage />} 
          />
          {/* Fallback to menu */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Shared Footer branding */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
