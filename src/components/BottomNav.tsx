import { useLocation } from "wouter";
import { Home, Search, Tv, Bookmark, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/", protected: false },
  { icon: Search, label: "Search", path: "/search", protected: false },
  { icon: Tv, label: "TV", path: "/tv-shows", protected: false },
  { icon: Bookmark, label: "My List", path: "/list", protected: true },
  { icon: User, label: "Profile", path: "/profile", protected: true },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { isLoggedIn } = useAuth();

  function handleNav(path: string, isProtected: boolean) {
    if (isProtected && !isLoggedIn) {
      navigate("/login");
    } else {
      navigate(path);
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-lg bg-black/70 border-t border-gray-800">
      <div className="flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path, protected: isProtected }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => handleNav(path, isProtected)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200 ${
                isActive ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon
                className={`transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
