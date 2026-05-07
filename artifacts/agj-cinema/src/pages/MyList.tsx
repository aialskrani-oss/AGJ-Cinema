import { useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Clock, Heart, CheckCircle, LogIn, X, Play, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { tmdb } from "../api/tmdb";
import { useToast } from "../contexts/ToastContext";

type Tab = "watchlist" | "favorites" | "history";

export default function MyList() {
  const { isLoggedIn, user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("watchlist");
  const { favorites, watchlist, removeFavorite, removeFromWatchlist } = useFavorites();
  const { showToast } = useToast();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-5 px-4 animate-fadeIn pb-20">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-2">
          <LogIn className="w-8 h-8 text-white/30" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">Sign in to save your favorites</h2>
          <p className="text-white/40 text-sm">Build your personal watchlist and library.</p>
        </div>
        <button onClick={() => navigate("/login")} className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-8 py-3 rounded-full transition-colors active:scale-95">
          Sign In
        </button>
      </div>
    );
  }

  const inProgress = watchlist.filter((e) => !e.completed).sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());
  const completed = watchlist.filter((e) => e.completed).sort((a, b) => new Date(b.completedAt ?? b.lastWatched).getTime() - new Date(a.completedAt ?? a.lastWatched).getTime());

  const TABS: { key: Tab; label: string; icon: typeof Clock; count: number }[] = [
    { key: "watchlist", label: "Watchlist", icon: Clock, count: inProgress.length },
    { key: "favorites", label: "Favorites", icon: Heart, count: favorites.length },
    { key: "history", label: "History", icon: CheckCircle, count: completed.length },
  ];

  return (
    <div className="min-h-screen bg-[#141414] pt-20 pb-24 md:pb-10 animate-fadeIn">
      {/* Header */}
      <div className="px-4 md:px-12 mb-6">
        <h1 className="text-white text-2xl md:text-3xl font-black mt-6 mb-1">
          {user!.username}<span className="text-cyan-400">'s</span> Library
        </h1>
        <p className="text-white/40 text-sm">{favorites.length + watchlist.length} items total</p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-12 mb-6">
        <div className="flex gap-1 bg-[#1a1a1a] rounded-2xl p-1 max-w-md">
          {TABS.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? "bg-cyan-400 text-black shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {count > 0 && (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${tab === key ? "bg-black/20 text-black" : "bg-white/10 text-white/50"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-12">
        {/* ── WATCHLIST TAB ─────────────────────────────────────────────── */}
        {tab === "watchlist" && (
          inProgress.length === 0 ? (
            <EmptyState icon={Clock} message="No movies in progress." sub="Start watching to track your progress!" action="Browse Movies" onAction={() => navigate("/")} />
          ) : (
            <div className="flex flex-col gap-3">
              {inProgress.map((entry) => {
                const progressPct = Math.min(100, (entry.progress / 7200) * 100);
                return (
                  <div key={entry.movie.id} className="flex gap-4 bg-[#181818] rounded-2xl p-3 border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-800 cursor-pointer" onClick={() => navigate(`/movie/${entry.movie.id}`)}>
                      {entry.movie.poster_path
                        ? <img src={tmdb.imgUrl(entry.movie.poster_path, "w154")} alt={entry.movie.title} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full bg-gray-700" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-white font-bold text-sm truncate mb-1 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => navigate(`/movie/${entry.movie.id}`)}>{entry.movie.title}</p>
                        <p className="text-white/40 text-xs">{Math.floor(entry.progress / 60)}m watched</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/movie/${entry.movie.id}`)} className="flex items-center gap-1.5 bg-white/10 hover:bg-cyan-400 hover:text-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                            <Play className="w-3 h-3 fill-current" /> Continue
                          </button>
                          <button onClick={() => { removeFromWatchlist(entry.movie.id); showToast("Removed from watchlist", "info"); }} className="text-white/30 hover:text-red-400 p-1.5 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── FAVORITES TAB ─────────────────────────────────────────────── */}
        {tab === "favorites" && (
          favorites.length === 0 ? (
            <EmptyState icon={Heart} message="Your favorites list is empty." sub="Discover movies and add them to your favorites!" action="Discover Movies" onAction={() => navigate("/search")} />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {favorites.map((movie) => (
                <div key={movie.id} className="relative group cursor-pointer">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-cyan-400 transition-all shadow-lg" onClick={() => navigate(`/movie/${movie.id}`)}>
                    {movie.poster_path
                      ? <img src={tmdb.imgUrl(movie.poster_path, "w300")} alt={movie.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs p-2 text-center">{movie.title}</div>}
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFavorite(movie.id); showToast("Removed from favorites", "info"); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <p className="text-white text-xs font-medium truncate mt-1.5">{movie.title}</p>
                  {movie.release_date && <p className="text-white/35 text-[10px]">{movie.release_date.slice(0, 4)}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {tab === "history" && (
          completed.length === 0 ? (
            <EmptyState icon={CheckCircle} message="No watched movies yet." sub="Finish watching a movie to see it here." action="Browse Movies" onAction={() => navigate("/")} />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {completed.map((entry) => (
                <div key={entry.movie.id} className="relative group cursor-pointer" onClick={() => navigate(`/movie/${entry.movie.id}`)}>
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-cyan-400 transition-all shadow-lg">
                    {entry.movie.poster_path
                      ? <img src={tmdb.imgUrl(entry.movie.poster_path, "w300")} alt={entry.movie.title} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-700" />}
                    <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                      <div className="flex items-center gap-1 bg-green-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        <CheckCircle className="w-2.5 h-2.5" /> Watched
                      </div>
                    </div>
                  </div>
                  <p className="text-white text-xs font-medium truncate mt-1.5">{entry.movie.title}</p>
                  {entry.completedAt && (
                    <p className="text-white/35 text-[10px]">{new Date(entry.completedAt).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub, action, onAction }: {
  icon: typeof Clock; message: string; sub: string; action: string; onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-7 h-7 text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-base mb-1">{message}</p>
        <p className="text-white/40 text-sm max-w-xs">{sub}</p>
      </div>
      <button onClick={onAction} className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-6 py-2.5 rounded-full transition-colors">
        <Search className="w-4 h-4" /> {action}
      </button>
    </div>
  );
}
