import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Play, Info } from "lucide-react";
import MovieRow from "../components/MovieRow";
import { usePopularTV, useTopRatedTV, useAiringTodayTV, useOnTheAirTV } from "../hooks/useTmdb";
import type { Movie } from "../api/tmdb";
import { tmdb, tvToMovie } from "../api/tmdb";

// ── Skeleton for hero banner ────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="relative h-[80vh] overflow-hidden bg-[#1a1a1a]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#1f1f1f] to-[#141414] animate-shimmer bg-[length:200%_100%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
      <div className="absolute bottom-24 md:bottom-32 left-4 md:left-12 space-y-4">
        <div className="h-3 w-24 bg-white/10 rounded-full animate-pulse" />
        <div className="h-12 md:h-16 w-80 md:w-[28rem] bg-white/8 rounded-xl animate-pulse" />
        <div className="h-12 w-60 bg-white/5 rounded-xl animate-pulse" />
        <div className="space-y-2">
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

// ── Skeleton for a movie row ────────────────────────────────────────────────
function RowSkeleton({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-white font-semibold text-lg px-4 md:px-12 mb-3">{title}</h2>
      <div className="flex gap-2 md:gap-3 overflow-hidden px-4 md:px-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl bg-[#1f1f1f] animate-pulse"
            style={{ width: "clamp(120px, 15vw, 200px)", aspectRatio: "2/3" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TVShows() {
  const [, navigate] = useLocation();

  const { data: popular,     isLoading: popularLoading }     = usePopularTV();
  const { data: topRated,    isLoading: topRatedLoading }    = useTopRatedTV();
  const { data: airingToday, isLoading: airingTodayLoading } = useAiringTodayTV();
  const { data: onTheAir,    isLoading: onTheAirLoading }    = useOnTheAirTV();

  const isLoading = popularLoading && topRatedLoading && airingTodayLoading && onTheAirLoading;

  useEffect(() => {
    document.title = "TV Shows — AGJ Cinema";
    return () => { document.title = "AGJ Cinema"; };
  }, []);

  // Pick a stable random featured show once data loads
  const featured = useMemo(() => {
    if (!popular || popular.length === 0) return undefined;
    const idx = Math.floor(Math.random() * Math.min(5, popular.length));
    return popular[idx];
  }, [popular]);

  const popularMovies     = popular?.map(tvToMovie)     ?? [];
  const topRatedMovies    = topRated?.map(tvToMovie)    ?? [];
  const airingTodayMovies = airingToday?.map(tvToMovie) ?? [];
  const onTheAirMovies    = onTheAir?.map(tvToMovie)    ?? [];

  function handleSelect(m: Movie) { navigate(`/tv/${m.id}`); }
  function handlePlay(m: Movie)   { navigate(`/tv/${m.id}`); }   // go to detail page to pick episode

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] animate-fadeIn pb-20 md:pb-0">
        <HeroSkeleton />
        <div className="-mt-16 relative z-10">
          <RowSkeleton title="📺 Popular" />
          <RowSkeleton title="⭐ Top Rated" />
          <RowSkeleton title="🔴 Airing Today" />
          <RowSkeleton title="📡 On The Air" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-20 md:pb-0">
      {/* Hero Banner */}
      {featured ? (
        <div className="relative h-[80vh] overflow-hidden">
          {featured.backdrop_path ? (
            <img
              src={tmdb.imgUrl(featured.backdrop_path, "original")}
              alt={featured.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />

          <div className="absolute bottom-24 md:bottom-32 left-4 md:left-12 max-w-xl animate-slideUp">
            <div className="inline-flex items-center gap-1.5 bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 text-xs px-3 py-1 rounded-full mb-3">
              📺 TV Show
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-3 leading-tight">
              {featured.name}
            </h1>
            {featured.overview && (
              <p className="text-white/80 text-sm md:text-base line-clamp-3 mb-5 leading-relaxed">
                {featured.overview}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/watch/tv/${featured.id}/1/1`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-200 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" /> Watch Now
              </button>
              <button
                onClick={() => navigate(`/tv/${featured.id}`)}
                className="flex items-center gap-2 glass border border-white/20 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/20 transition-all duration-200"
              >
                <Info className="w-5 h-5" /> More Info
              </button>
            </div>
          </div>
        </div>
      ) : (
        // No featured data — show a slim top bar
        <div className="h-20 bg-transparent" />
      )}

      {/* Movie Rows */}
      <div className={featured ? "-mt-16 relative z-10" : "pt-6"}>
        {popularMovies.length > 0     && <MovieRow title="📺 Popular"       movies={popularMovies}     onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />}
        {topRatedMovies.length > 0    && <MovieRow title="⭐ Top Rated"     movies={topRatedMovies}    onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />}
        {airingTodayMovies.length > 0 && <MovieRow title="🔴 Airing Today"  movies={airingTodayMovies} onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />}
        {onTheAirMovies.length > 0    && <MovieRow title="📡 On The Air"    movies={onTheAirMovies}    onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />}
      </div>
    </div>
  );
}
