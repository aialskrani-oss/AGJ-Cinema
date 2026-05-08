import { useLocation } from "wouter";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import {
  useTrending, useTopRated, usePopular, useNowPlaying, useUpcoming,
  usePopularTV, useTopRatedTV,
} from "../hooks/useTmdb";
import { useAuth } from "../contexts/AuthContext";
import type { Movie } from "../api/tmdb";
import { tvToMovie } from "../api/tmdb";

export default function Home() {
  const [, navigate] = useLocation();
  const { isLoggedIn } = useAuth();

  const { data: trending }   = useTrending();
  const { data: topRated }   = useTopRated();
  const { data: popular }    = usePopular();
  const { data: nowPlaying } = useNowPlaying();
  const { data: upcoming }   = useUpcoming();
  const { data: popularTV }  = usePopularTV();
  const { data: topRatedTV } = useTopRatedTV();

  function handlePlay(movie: Movie) {
    if (movie.media_type === "tv") { navigate(`/tv/${movie.id}`); return; }
    navigate(`/watch/movie/${movie.id}`);
  }

  function handleSelect(movie: Movie)   { navigate(`/movie/${movie.id}`); }
  function handleSelectTV(movie: Movie) { navigate(`/tv/${movie.id}`); }

  const popularTVMovies  = popularTV?.map(tvToMovie)  ?? [];
  const topRatedTVMovies = topRatedTV?.map(tvToMovie) ?? [];

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-20 md:pb-0">
      {trending && trending.length > 0 && (
        <HeroBanner movies={trending.slice(0, 5)} onPlay={handlePlay} />
      )}

      <div className="-mt-16 relative z-10">
        {trending   && <MovieRow title="Trending Now"              movies={trending}         onSelect={handleSelect}   onPlay={handlePlay} />}
        {nowPlaying && <MovieRow title="Now Playing"               movies={nowPlaying}        onSelect={handleSelect}   onPlay={handlePlay} />}
        {popular    && <MovieRow title="Popular on AGJ Cinema"     movies={popular}           onSelect={handleSelect}   onPlay={handlePlay} />}
        {topRated   && <MovieRow title="Top Rated"                 movies={topRated}          onSelect={handleSelect}   onPlay={handlePlay} />}
        {upcoming   && <MovieRow title="Coming Soon"               movies={upcoming}          onSelect={handleSelect}   onPlay={handlePlay} />}

        {popularTVMovies.length > 0 && (
          <MovieRow title="📺 Popular TV Shows" movies={popularTVMovies}  onSelect={handleSelectTV} onPlay={handlePlay} mediaType="tv" />
        )}
        {topRatedTVMovies.length > 0 && (
          <MovieRow title="⭐ Top Rated TV Shows" movies={topRatedTVMovies} onSelect={handleSelectTV} onPlay={handlePlay} mediaType="tv" />
        )}
      </div>

      {!isLoggedIn && (
        <div className="mx-4 md:mx-12 my-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-400/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Enjoying AGJ Cinema?</p>
            <p className="text-white/50 text-sm">Sign in to save your watchlist and track progress.</p>
          </div>
          <button onClick={() => navigate("/login")} className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-colors flex-shrink-0">
            Sign In Free
          </button>
        </div>
      )}
    </div>
  );
}
