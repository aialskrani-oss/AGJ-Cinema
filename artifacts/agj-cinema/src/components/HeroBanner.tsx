import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Play, Info } from "lucide-react";
import type { Movie } from "../api/tmdb";
import { tmdb } from "../api/tmdb";

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

export default function HeroBanner({ movies, onPlay }: HeroBannerProps) {
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

  if (!featured) return null;

  const matchPercent = Math.round(featured.vote_average * 10);
  const year = featured.release_date?.slice(0, 4) ?? "";

  return (
    <div className="relative h-[85vh] md:h-screen overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        {featured.backdrop_path ? (
          <img
            src={tmdb.imgUrl(featured.backdrop_path, "original")}
            alt={featured.title}
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
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-3 leading-tight">
          {featured.title}
        </h1>

        <div className="flex items-center gap-3 mb-3 text-sm">
          <span className="text-green-400 font-bold">{matchPercent}% Match</span>
          <span className="text-white/70">{year}</span>
          <span className="border border-white/40 text-white/70 text-xs px-1 rounded">
            {featured.adult ? "18+" : "PG-13"}
          </span>
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
            Play
          </button>
          <button
            onClick={() => navigate(`/movie/${featured.id}`)}
            className="flex items-center gap-2 glass border border-white/20 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/20 transition-all duration-200 active:scale-95"
          >
            <Info className="w-5 h-5" />
            More Info
          </button>
        </div>
      </div>

      {/* Dot indicators */}
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
    </div>
  );
}
