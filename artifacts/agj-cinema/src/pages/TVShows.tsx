import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Play, Info } from "lucide-react";
import MovieRow from "../components/MovieRow";
import MoviePlayer from "../components/MoviePlayer";
import { usePopularTV, useTopRatedTV, useAiringTodayTV, useOnTheAirTV } from "../hooks/useTmdb";
import type { Movie } from "../api/tmdb";
import { tmdb, tvToMovie } from "../api/tmdb";

const STREAM_BASE_URL = import.meta.env.VITE_STREAM_BASE_URL as string;
const STREAM_PRIMARY_COLOR = import.meta.env.VITE_STREAM_PRIMARY_COLOR as string;
const STREAM_DEFAULT_LANG = import.meta.env.VITE_STREAM_DEFAULT_LANG as string;

export default function TVShows() {
  const [, navigate] = useLocation();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");

  const { data: popular } = usePopularTV();
  const { data: topRated } = useTopRatedTV();
  const { data: airingToday } = useAiringTodayTV();
  const { data: onTheAir } = useOnTheAirTV();

  const featured = useMemo(() => {
    if (!popular || popular.length === 0) return undefined;
    const idx = Math.floor(Math.random() * Math.min(5, popular.length));
    return popular[idx];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popular !== undefined]);

  const popularMovies = popular?.map(tvToMovie) ?? [];
  const topRatedMovies = topRated?.map(tvToMovie) ?? [];
  const airingTodayMovies = airingToday?.map(tvToMovie) ?? [];
  const onTheAirMovies = onTheAir?.map(tvToMovie) ?? [];

  function buildUrl(tvId: number) {
    const tvBase = STREAM_BASE_URL.replace("/movie/", "/tv/");
    return `${tvBase}${tvId}/1/1?primaryColor=${STREAM_PRIMARY_COLOR}&lang=${STREAM_DEFAULT_LANG}&ds_lang=ar&sub_lang=ar`;
  }

  function handleSelect(m: Movie) { navigate(`/tv/${m.id}`); }
  function handlePlay(m: Movie) {
    setPlayingId(m.id);
    setPlayingTitle(m.title || m.name || "");
  }

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-20 md:pb-0">
      {/* Featured Hero */}
      {featured && (
        <div className="relative h-[80vh] overflow-hidden">
          {featured.backdrop_path ? (
            <img src={tmdb.imgUrl(featured.backdrop_path, "original")} alt={featured.name} loading="lazy" className="w-full h-full object-cover" />
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
            <p className="text-white/80 text-sm md:text-base line-clamp-3 mb-5 leading-relaxed">{featured.overview}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlay(tvToMovie(featured))}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-200"
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
      )}

      <div className={featured ? "-mt-16 relative z-10" : "pt-24"}>
        {popularMovies.length > 0 && (
          <MovieRow title="📺 Popular" movies={popularMovies} onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />
        )}
        {topRatedMovies.length > 0 && (
          <MovieRow title="⭐ Top Rated" movies={topRatedMovies} onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />
        )}
        {airingTodayMovies.length > 0 && (
          <MovieRow title="🔴 Airing Today" movies={airingTodayMovies} onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />
        )}
        {onTheAirMovies.length > 0 && (
          <MovieRow title="📡 On The Air" movies={onTheAirMovies} onSelect={handleSelect} onPlay={handlePlay} mediaType="tv" />
        )}
      </div>

      {playingId !== null && (
        <MoviePlayer
          url={buildUrl(playingId)}
          title={playingTitle}
          movieId={playingId}
          onClose={() => setPlayingId(null)}
        />
      )}
    </div>
  );
}
