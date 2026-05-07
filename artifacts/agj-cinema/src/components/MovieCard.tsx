import { useState } from "react";
import { Play, Plus, ThumbsUp, ChevronDown, Tv, Heart } from "lucide-react";
import type { Movie } from "../api/tmdb";
import { tmdb } from "../api/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useToast } from "../contexts/ToastContext";
import { useLocation } from "wouter";

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  mediaType?: "movie" | "tv";
}

export default function MovieCard({ movie, onSelect, onPlay, mediaType = "movie" }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { isLoggedIn } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const [, navigate] = useLocation();

  const displayTitle = movie.title || movie.name || "";
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) ?? "";
  const matchPercent = Math.round(movie.vote_average * 10);
  const favored = isFavorite(movie.id);

  function handleHeartClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast("Sign in to add favorites", "info");
      navigate("/login");
      return;
    }
    const wasAdded = !isFavorite(movie.id);
    toggleFavorite(movie);
    showToast(wasAdded ? "✓ Added to Favorites" : "✗ Removed from Favorites", wasAdded ? "success" : "info");
  }

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: "clamp(120px, 15vw, 200px)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl aspect-[2/3] bg-gray-800 active:scale-95 transition-transform duration-200 md:active:scale-100"
        onClick={() => onSelect(movie)}
      >
        {movie.poster_path ? (
          <img
            src={tmdb.imgUrl(movie.poster_path, "w300")}
            alt={displayTitle}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/30 text-xs text-center p-2">{displayTitle}</div>
        )}
        {!imageLoaded && movie.poster_path && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}

        {/* TV badge */}
        {mediaType === "tv" && (
          <div className="absolute top-2 left-2 bg-cyan-400/90 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <Tv className="w-2.5 h-2.5 text-black" />
            <span className="text-black text-[9px] font-bold">TV</span>
          </div>
        )}

        {/* Heart button — always on mobile, hover on desktop */}
        <button
          onClick={handleHeartClick}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            favored
              ? "bg-red-500/80 opacity-100"
              : "bg-black/50 md:opacity-0 md:group-hover:opacity-100"
          } hover:scale-110`}
        >
          <Heart className={`w-3.5 h-3.5 ${favored ? "fill-white text-white" : "text-white"}`} />
        </button>
      </div>

      {/* Desktop Hover Card */}
      {hovered && (
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 z-30 w-64 bg-[#181818] rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-fadeIn">
          {/* Backdrop */}
          <div className="relative h-36 bg-gray-900">
            {movie.backdrop_path ? (
              <img src={tmdb.imgUrl(movie.backdrop_path, "w500")} alt={displayTitle} loading="lazy" className="w-full h-full object-cover" />
            ) : movie.poster_path ? (
              <img src={tmdb.imgUrl(movie.poster_path, "w300")} alt={displayTitle} loading="lazy" className="w-full h-full object-cover object-top" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
            <p className="absolute bottom-2 left-3 text-white font-bold text-sm line-clamp-1">{displayTitle}</p>
            {mediaType === "tv" && (
              <div className="absolute top-2 left-2 bg-cyan-400/90 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                <Tv className="w-2.5 h-2.5 text-black" />
                <span className="text-black text-[9px] font-bold">TV</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors flex-shrink-0"
              >
                <Play className="w-4 h-4 fill-black text-black" />
              </button>
              <button
                onClick={handleHeartClick}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                  favored ? "border-red-400 bg-red-500/20" : "border-white/40 hover:border-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${favored ? "fill-red-400 text-red-400" : "text-white"}`} />
              </button>
              <button className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition-colors flex-shrink-0">
                <ThumbsUp className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onSelect(movie)}
                className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition-colors flex-shrink-0 ml-auto"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs mb-2">
              <span className="text-green-400 font-bold">{matchPercent}%</span>
              <span className="border border-white/30 text-white/60 px-1 rounded text-[10px]">{movie.adult ? "18+" : "PG-13"}</span>
              {year && <span className="text-white/60">{year}</span>}
              {favored && <span className="text-red-400 text-[10px]">❤ Saved</span>}
            </div>

            {movie.overview && (
              <p className="text-white/70 text-xs line-clamp-2 leading-relaxed">{movie.overview}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
