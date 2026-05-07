import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "../api/tmdb";
import MovieCard from "./MovieCard";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  mediaType?: "movie" | "tv";
}

export default function MovieRow({ title, movies, onSelect, onPlay, mediaType = "movie" }: MovieRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [movies]);

  function scrollBy(direction: "left" | "right") {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  }

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative group mb-8">
      <h2 className="text-white font-semibold text-lg px-4 md:px-12 mb-3">{title}</h2>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollBy("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full px-2 md:px-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <div
          ref={containerRef}
          className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar px-4 md:px-12 py-2"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelect}
              onPlay={onPlay}
              mediaType={mediaType}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollBy("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full px-2 md:px-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
