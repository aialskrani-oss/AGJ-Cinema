import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, Star, ArrowRight, LogIn, Tv } from "lucide-react";
import { tmdb } from "../api/tmdb";
import { useSearchMulti } from "../hooks/useTmdb";
import { useAuth } from "../contexts/AuthContext";
import type { Movie } from "../api/tmdb";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, user } = useAuth();

  const { data: searchResults, isFetching } = useSearchMulti(query);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setQuery("");
      }
    }
    if (searchOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  function handleSelectMovie(movie: Movie) {
    setSearchOpen(false);
    setQuery("");
    if (movie.media_type === "tv") {
      navigate(`/tv/${movie.id}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  }

  function handleNavLink(path: string) { navigate(path); }

  function handleSearchAll() {
    navigate("/search");
    setSearchOpen(false);
    setQuery("");
  }

  const showDropdown = searchOpen && query.length > 1;
  const avatarLetter = user?.username?.charAt(0).toUpperCase() ?? "A";
  const displayName = user?.username
    ? user.username.length > 10
      ? user.username.slice(0, 10) + "…"
      : user.username
    : "";

  const results = searchResults?.results?.filter(
    (m) => m.media_type === "movie" || m.media_type === "tv"
  ) ?? [];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 px-4 md:px-12 py-3 transition-all duration-300 flex items-center justify-between ${
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-lg border-b border-gray-800"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer flex-shrink-0 transition-transform duration-200 hover:scale-105"
        onClick={() => handleNavLink("/")}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 8px rgba(6,182,212,0.4))")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
      >
        <span className="text-2xl font-black tracking-wider">
          <span className="text-cyan-400">AGJ</span>
          <span className="text-white"> Cinema</span>
        </span>
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        {[
          { label: "Home",     path: "/" },
          { label: "Movies",   path: "/search" },
          { label: "TV Shows", path: "/tv-shows" },
          { label: "My List",  path: "/list" },
        ].map((link) => (
          <button
            key={link.label}
            onClick={() => handleNavLink(link.path)}
            className="text-white/80 hover:text-white transition-colors duration-200"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div ref={dropdownRef} className="relative">
          {searchOpen ? (
            <div
              className={`flex items-center gap-2 border rounded-full px-3.5 py-2 transition-all duration-300 ${
                query
                  ? "bg-[#1a1a1a] border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                  : "bg-black/60 border-white/20"
              }`}
              style={{ backdropFilter: "blur(12px)" }}
            >
              <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${query ? "text-cyan-400" : "text-white/50"}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies & shows..."
                className="bg-transparent text-white text-sm outline-none w-36 md:w-52 placeholder-white/30"
              />
              {isFetching ? (
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : query ? (
                <button
                  onClick={() => setQuery("")}
                  className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3 text-white/70" />
                </button>
              ) : (
                <button
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-12 right-0 w-72 md:w-80 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
              {results.length > 0 ? (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Results</p>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                    {results.slice(0, 7).map((movie) => (
                      <button
                        key={`${movie.media_type}-${movie.id}`}
                        onClick={() => handleSelectMovie(movie)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 transition-colors text-left w-full group"
                      >
                        <div className="w-9 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {movie.poster_path ? (
                            <img src={tmdb.imgUrl(movie.poster_path, "w92")} alt={movie.title} loading="lazy" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full bg-gray-700" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white text-sm font-semibold truncate group-hover:text-cyan-400 transition-colors">
                              {movie.title || movie.name}
                            </p>
                            {movie.media_type === "tv" && (
                              <span className="flex-shrink-0 flex items-center gap-0.5 bg-cyan-400/20 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                <Tv className="w-2.5 h-2.5" /> TV
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(movie.release_date || movie.first_air_date) && (
                              <span className="text-white/40 text-[11px]">
                                {(movie.release_date || movie.first_air_date || "").slice(0, 4)}
                              </span>
                            )}
                            {movie.vote_average > 0 && (
                              <div className="flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-yellow-400 text-[11px] font-medium">{movie.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSearchAll}
                    className="w-full flex items-center justify-center gap-2 py-3 border-t border-white/8 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors hover:bg-cyan-400/5"
                  >
                    See all results <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-white/30 text-sm">No results for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auth area */}
        {isLoggedIn ? (
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavLink("/profile")}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-cyan-400/30 transition-shadow">
              <span className="text-black font-bold text-sm">{avatarLetter}</span>
            </div>
            <span className="hidden md:block text-white/70 text-sm font-medium group-hover:text-white transition-colors">
              {displayName}
            </span>
          </div>
        ) : (
          <button
            onClick={() => handleNavLink("/login")}
            className="flex items-center gap-1.5 text-cyan-400 border border-cyan-400 hover:bg-cyan-400 hover:text-black rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
