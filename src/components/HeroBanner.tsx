import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Play, Info } from "lucide-react";
import type { Movie } from "../api/tmdb";
import { tmdb } from "../api/tmdb";

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  isLoading?: boolean;
}

// ── Skeleton shown while trending data is fetching ──────────────────────────
function HeroBannerSkeleton() {
  return (
    <div className="relative h-[85vh] md:h-screen overflow-hidden bg-[#1a1a1a]">
      {/* Shimmer backdrop */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#1f1f1f] to-[#141414] animate-shimmer bg-[length:200%_100%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />

      {/* Content placeholders */}
      <div className="absolute bottom-24 md:bottom-32 left-4 md:left-12 max-w-xl space-y-4">
        <div className="h-10 md:h-14 w-72 md:w-96 bg-white/8 rounded-xl animate-pulse" />
        <div className="h-10 md:h-14 w-52 md:w-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-3 w-full max-w-md bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse" />
          <div className="h-10 w-32 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function HeroBanner({ movies, onPlay, isLoading = false }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [, navigate] = useLocation();

  const featured = movies[currentIndex];

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setParallaxY(window.scrollY * 0.35);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // Show skeleton while loading or if no movies yet
  if (isLoading || !featured) return <HeroBannerSkeleton />;

  const matchPercent = Math.round(featured.vote_average * 10);
  const year = (featured.release_date || featured.first_air_date)?.slice(0, 4) ?? "";

  function handleMoreInfo() {
    if (featured.media_type === "tv") {
      navigate(`/tv/${featured.id}`);
    } else {
      navigate(`/movie/${featured.id}`);
    }
  }

  return (
    <div className="relative h-[85vh] md:h-screen overflow-hidden">
      {/* Backdrop with parallax */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        {featured.backdrop_path ? (
          <img
            src={tmdb.imgUrl(featured.backdrop_path, "original")}
            alt={featured.title || featured.name}
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-24 md:bottom-32 left-4 md:left-12 max-w-xl animate-slideUp">
        {featured.media_type === "tv" && (
          <div className="inline-flex items-center gap-1.5 bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 text-xs px-3 py-1 rounded-full mb-3">
            📺 TV Show
          </div>
        )}

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-3 leading-tight">
          {featured.title || featured.name}
        </h1>

        <div className="flex items-center gap-3 mb-3 text-sm">
          <span className="text-green-400 font-bold">{matchPercent}% Match</span>
          {year && <span className="text-white/70">{year}</span>}
          <span className="border border-white/40 text-white/70 text-xs px-1 rounded">
            {featured.adult ? "18+" : "PG-13"}
          </span>
          {featured.media_type === "tv" && (
            <span className="bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 text-xs px-2 py-0.5 rounded-full">TV</span>
          )}
        </div>

        <p className="text-white/80 text-sm md:text-base line-clamp-3 mb-5 leading-relaxed">
          {featured.overview}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlay(featured)}
            className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-200 active:scale-95"
          >
            <Play className="w-5 h-5 fill-black" />
            {featured.media_type === "tv" ? "Watch" : "Play"}
          </button>
          <button
            onClick={handleMoreInfo}
            className="flex items-center gap-2 glass border border-white/20 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/20 transition-all duration-200 active:scale-95"
          >
            <Info className="w-5 h-5" />
            More Info
          </button>
        </div>
      </div>

      {/* Slide indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 right-4 md:right-12 flex items-center gap-2">
          {movies.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "bg-cyan-400 w-6" : "bg-white/40 w-1.5"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
