import React from "react";
import { UtensilsCrossed, Phone, MapPin, Mail, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Branding */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-orange-600 to-red-600 p-2 rounded-xl text-white shadow-lg">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-sans font-bold text-lg text-white">Masala Kitchen</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-500">
            An authentic premium Indian gourmet ordering experience. Handcrafted starters, rich curries, aromatic biryanis, and traditional desserts delivered straight to your doorstep.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-white mb-4">Quick Links</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link to="/" className="hover:text-orange-500 transition-colors">Our Menu</Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-orange-500 transition-colors">Track Orders</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-orange-500 transition-colors">My Profile</Link>
            </li>
            <li>
              <Link to="/admin-secret" className="hover:text-orange-500/80 text-orange-500/60 font-semibold transition-colors">Admin Secret Page</Link>
            </li>
          </ul>
        </div>

        {/* Opening Hours */}
        <div>
          <h3 className="font-semibold text-white mb-4">Opening Hours</h3>
          <ul className="flex flex-col gap-3 text-sm text-zinc-500">
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Monday - Friday: 11:00 AM - 10:00 PM</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Saturday - Sunday: 10:00 AM - 11:00 PM</span>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold text-white mb-4">Contact Info</h3>
          <ul className="flex flex-col gap-3 text-sm text-zinc-500">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500 shrink-0" />
              <span>support@masalakitchen.in</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Connaught Place, New Delhi, India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
        <p>&copy; {new Date().getFullYear()} Masala Kitchen Pvt Ltd. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with Passion &bull; Premium Dining Experience
        </p>
      </div>
    </footer>
  );
};
