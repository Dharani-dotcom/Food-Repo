import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Award, LogOut, ArrowLeft } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="font-sans font-bold text-lg">Not signed in</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-4">Please log in to view your profile and orders.</p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        {/* Profile Card */}
        <div className="bg-zinc-900/50 rounded-3xl border border-zinc-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* Header/Cover aspect */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 flex flex-col items-center text-center relative">
            <div className="w-20 h-20 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center text-3xl font-extrabold text-orange-500 shadow-xl mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight">{user.name}</h2>
            <p className="text-xs text-orange-100 mt-1 capitalize flex items-center gap-1 bg-zinc-950/20 px-3 py-1 rounded-full border border-white/10">
              <Award className="w-3.5 h-3.5 fill-current" />
              <span>{user.role} Member</span>
            </p>
          </div>

          {/* Details segment */}
          <div className="p-6 md:p-8 space-y-6 text-xs text-zinc-400">
            <h3 className="font-bold text-white text-sm border-b border-zinc-850 pb-2">Profile Details</h3>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex gap-3 items-center">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-zinc-300">Email Address</p>
                  <p className="text-zinc-500 mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3 items-center">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-zinc-300">Phone Number</p>
                  <p className="text-zinc-500 mt-0.5">{user.phone}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-300">Default Delivery Address</p>
                  <p className="text-zinc-500 mt-0.5 leading-relaxed">{user.address}</p>
                </div>
              </div>
            </div>

            {/* Logout panel button */}
            <div className="border-t border-zinc-850 pt-6 flex justify-end">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-rose-950/15 border border-rose-500/20 text-rose-400 font-bold px-4 py-2 rounded-xl hover:bg-rose-950/35 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
