import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, Star, Zap, Laugh, Ghost, Rocket, Heart, TrendingUp, Film, FileText, Tv } from "lucide-react";
import { useSearchInfinite, useDiscoverByGenre, useSearchMulti } from "../hooks/useTmdb";
import { tmdb } from "../api/tmdb";
import type { Movie } from "../api/tmdb";

const GENRES = [
  { id: 28,    label: "Action",      icon: Zap },
  { id: 35,    label: "Comedy",      icon: Laugh },
  { id: 27,    label: "Horror",      icon: Ghost },
  { id: 878,   label: "Sci-Fi",      icon: Rocket },
  { id: 10749, label: "Romance",     icon: Heart },
  { id: 16,    label: "Animation",   icon: Film },
  { id: 99,    label: "Documentary", icon: FileText },
  { id: 53,    label: "Thriller",    icon: TrendingUp },
];

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] rounded-xl bg-[#222] animate-pulse" />
      <div className="h-3 w-3/4 bg-[#222] rounded animate-pulse" />
      <div className="h-2 w-1/3 bg-[#1a1a1a] rounded animate-pulse" />
    </div>
  );
}

export default function Search() {
  const [rawQuery, setRawQuery]           = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGenre, setSelectedGenre]   = useState<number | null>(null);
  const [, navigate]                        = useLocation();
  const inputRef                            = useRef<HTMLInputElement>(null);
  const bottomRef                           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Search — AGJ Cinema";
    return () => { document.title = "AGJ Cinema"; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(rawQuery), 400);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const hasQuery = debouncedQuery.length > 2;
  const hasGenre = selectedGenre !== null;

  // ✅ Use searchMulti for text search (returns movies + TV shows)
  const {
    data: multiResults,
    isFetching: multiFetching,
  } = useSearchMulti(debouncedQuery);

  const {
    data: searchPages,
    isFetching: searchFetching,
    fetchNextPage: fetchNextSearch,
    hasNextPage: searchHasNext,
  } = useSearchInfinite(debouncedQuery, selectedGenre);

  const {
    data: discoverPages,
    isFetching: discoverFetching,
    fetchNextPage: fetchNextDiscover,
    hasNextPage: discoverHasNext,
  } = useDiscoverByGenre(hasQuery ? null : selectedGenre);

  const isFetching = searchFetching || discoverFetching || multiFetching;

  // Use multiResults for quick display + searchPages for infinite scroll
  const allResults: Movie[] = hasQuery
    ? (searchPages?.pages.flatMap((p) => p.results) ?? (multiResults?.results?.filter(m => m.media_type === "movie" || m.media_type === "tv") ?? []))
    : hasGenre
    ? (discoverPages?.pages.flatMap((p) => p.results) ?? [])
    : [];

  const loadMore = useCallback(() => {
    if (hasQuery && searchHasNext && !searchFetching) fetchNextSearch();
    else if (!hasQuery && hasGenre && discoverHasNext && !discoverFetching) fetchNextDiscover();
  }, [hasQuery, searchHasNext, searchFetching, fetchNextSearch, hasGenre, discoverHasNext, discoverFetching, fetchNextDiscover]);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const showEmpty     = !hasQuery && !hasGenre;
  const showNoResults = (hasQuery || hasGenre) && allResults.length === 0 && !isFetching;
  const showSkeletons = isFetching && allResults.length === 0;

  function clearFilters() {
    setRawQuery("");
    setDebouncedQuery("");
    setSelectedGenre(null);
  }

  function handleResultClick(movie: Movie) {
    if (movie.media_type === "tv") {
      navigate(`/tv/${movie.id}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-24 md:pb-10">
      {/* Search Hero */}
      <div className="relative pt-24 pb-6 px-4 md:px-12">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-white/40 text-sm font-medium text-center tracking-widest uppercase mb-2">Discover</p>
          <h1 className="text-white text-3xl md:text-4xl font-black text-center mb-6">
            What are you <span className="text-cyan-400">looking for?</span>
          </h1>

          <div
            className={`flex items-center gap-3 rounded-2xl px-5 py-4 border transition-all duration-300 ${
              rawQuery
                ? "bg-[#1e1e1e] border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                : "bg-[#1a1a1a] border-white/10 hover:border-white/20"
            }`}
          >
            <SearchIcon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${rawQuery ? "text-cyan-400" : "text-white/30"}`} />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search movies, TV shows, genres..."
              className="flex-1 bg-transparent text-white text-base outline-none placeholder-white/25 font-medium"
            />
            {isFetching && rawQuery && (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {rawQuery && !isFetching && (
              <button
                onClick={() => { setRawQuery(""); inputRef.current?.focus(); }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-white/70" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="px-4 md:px-12 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {GENRES.map(({ id, label, icon: Icon }) => {
            const active = selectedGenre === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedGenre(active ? null : id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border ${
                  active
                    ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-[#1a1a1a] text-white/60 border-white/10 hover:border-cyan-400/40 hover:text-cyan-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {(hasQuery || hasGenre) && (
        <div className="px-4 md:px-12 mb-4">
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        </div>
      )}

      <div className="px-4 md:px-12">
        {showEmpty && (
          <div className="max-w-2xl mx-auto animate-fadeIn pt-4">
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest text-center mb-5">or browse by genre above</p>
            <div className="flex flex-col items-center gap-4 pt-8">
              <SearchIcon className="w-14 h-14 text-gray-700" />
              <p className="text-white/40 text-base text-center">Search for movies & TV shows or pick a genre</p>
            </div>
          </div>
        )}

        {showSkeletons && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {showNoResults && (
          <div className="flex flex-col items-center justify-center gap-3 pt-16 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <SearchIcon className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white font-semibold text-lg">No results found</p>
            <p className="text-white/40 text-sm text-center">
              {hasQuery ? <>No matches for <span className="text-white/70">"{debouncedQuery}"</span>. Try something else.</> : "No movies found for this genre."}
            </p>
          </div>
        )}

        {allResults.length > 0 && (
          <div className="animate-fadeIn">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-5">
              {allResults.length} results {hasQuery ? `for "${debouncedQuery}"` : selectedGenre ? `in ${GENRES.find(g => g.id === selectedGenre)?.label}` : ""}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {allResults.map((movie) => (
                <button
                  key={`${movie.media_type ?? "movie"}-${movie.id}`}
                  onClick={() => handleResultClick(movie)}
                  className="flex flex-col gap-2 text-left group"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#222] group-hover:ring-2 group-hover:ring-cyan-400 transition-all duration-200 shadow-lg">
                    {movie.poster_path ? (
                      <img
                        src={tmdb.imgUrl(movie.poster_path, "w300")}
                        alt={movie.title || movie.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs text-center p-2">{movie.title || movie.name}</div>
                    )}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-[10px] font-bold">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.media_type === "tv" && (
                      <div className="absolute top-2 left-2 bg-cyan-400/90 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                        <Tv className="w-2.5 h-2.5 text-black" />
                        <span className="text-black text-[9px] font-bold">TV</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold truncate group-hover:text-cyan-400 transition-colors duration-200">{movie.title || movie.name}</p>
                    {(movie.release_date || movie.first_air_date) && (
                      <p className="text-white/35 text-[10px] mt-0.5">{(movie.release_date || movie.first_air_date || "").slice(0, 4)}</p>
                    )}
                  </div>
                </button>
              ))}

              {isFetching && allResults.length > 0 && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-10 mt-4" />
      </div>
    </div>
  );
}
