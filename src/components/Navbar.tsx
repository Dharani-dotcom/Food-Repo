import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  UtensilsCrossed, 
  ClipboardList, 
  TrendingUp,
  LayoutDashboard
} from "lucide-react";

interface NavbarProps {
  onCartClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime < 1500) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 5) {
        e.preventDefault();
        setClickCount(0);
        document.dispatchEvent(new CustomEvent("open-secret-gate"));
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Menu", path: "/" },
    ...(user ? [{ name: "Order History", path: "/orders" }] : [])
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900 text-zinc-100 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 group select-none">
          <div className="bg-gradient-to-tr from-orange-600 to-red-600 p-2 rounded-xl text-white shadow-lg shadow-orange-600/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-orange-500 bg-clip-text text-transparent">
            Masala Kitchen
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
          {user?.role === "Admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors bg-orange-950/30 border border-orange-500/20 px-3 py-1.5 rounded-lg"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onCartClick}
            className="relative p-2 text-zinc-300 hover:text-white transition-colors hover:scale-105 duration-200 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-zinc-950">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4 border-l border-zinc-800 pl-4">
              <Link to="/profile" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-orange-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-zinc-400">Welcome</p>
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={onCartClick}
            className="relative p-2 text-zinc-300 hover:text-white cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-zinc-950">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-300 hover:text-white px-2 py-1"
            >
              {link.name}
            </Link>
          ))}
          {user?.role === "Admin" && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-orange-400 hover:text-orange-300 px-2 py-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}

          {user ? (
            <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4 px-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-orange-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-rose-400 bg-rose-950/10 border border-rose-500/20 px-4 py-2 rounded-xl mt-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      )}
    </nav>
  );
};
