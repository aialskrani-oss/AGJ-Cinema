import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, LogIn, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const WIFI_KEY = "agj_wifi_only";

export default function Profile() {
  const [wifiOnly, setWifiOnly] = useState<boolean>(() => {
    try { return localStorage.getItem(WIFI_KEY) === "true"; } catch { return false; }
  });
  const { isLoggedIn, user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = isLoggedIn ? `${user?.username} — AGJ Cinema` : "Profile — AGJ Cinema";
    return () => { document.title = "AGJ Cinema"; };
  }, [isLoggedIn, user?.username]);

  function toggleWifi() {
    const next = !wifiOnly;
    setWifiOnly(next);
    try { localStorage.setItem(WIFI_KEY, String(next)); } catch { /* ignore */ }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-5 px-4 animate-fadeIn pb-20">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-2">
          <LogIn className="w-8 h-8 text-white/30" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">Sign in to AGJ Cinema</h2>
          <p className="text-white/40 text-sm">Access your profile, saved lists, and more.</p>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-8 py-3 rounded-full transition-colors active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  const avatarLetter = user!.username.charAt(0).toUpperCase();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-20 pb-24 md:pb-8 animate-fadeIn px-4 md:px-12">
      {/* Profile card */}
      <div className="bg-[#181818] rounded-2xl p-6 max-w-md mx-auto mt-8 mb-4 shadow-xl border border-white/5">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-400/20">
            <span className="text-black font-black text-3xl">{avatarLetter}</span>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{user!.username}</p>
            <p className="text-cyan-400/60 text-xs mt-0.5">AGJ Cinema Member</p>
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div className="bg-[#181818] rounded-2xl max-w-md mx-auto overflow-hidden border border-white/5 shadow-xl">
        <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5">
          <span className="text-white font-medium">Account</span>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {wifiOnly
              ? <Wifi className="w-4 h-4 text-cyan-400" />
              : <WifiOff className="w-4 h-4 text-white/30" />}
            <div>
              <p className="text-white font-medium">Wi-Fi Only</p>
              <p className="text-white/40 text-xs mt-0.5">
                {wifiOnly ? "Enabled — data saving is on" : "Disabled — using any connection"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleWifi}
            aria-label={wifiOnly ? "Disable Wi-Fi only" : "Enable Wi-Fi only"}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${wifiOnly ? "bg-cyan-400" : "bg-gray-600"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${wifiOnly ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5">
          <span className="text-white font-medium">About</span>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-5 py-4 hover:bg-red-900/20 transition-colors"
        >
          <span className="text-red-500 font-medium">Log Out</span>
        </button>
      </div>

      <p className="text-center text-white/20 text-xs mt-8">AGJ Cinema v1.1.0</p>
    </div>
  );
}
