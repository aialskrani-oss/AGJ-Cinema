import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import MoviePlayer from "../components/MoviePlayer";
import {
  useTrending, useTopRated, usePopular, useNowPlaying, useUpcoming,
  usePopularTV, useTopRatedTV,
} from "../hooks/useTmdb";
import { useAuth } from "../contexts/AuthContext";
import type { Movie } from "../api/tmdb";
import { tvToMovie } from "../api/tmdb";

interface PlayerState {
  movieId: number;
  title: string;
  isTV: boolean;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { isLoggedIn } = useAuth();

  // ── Player state ──────────────────────────────────────────────────────────
  const [player, setPlayer] = useState<PlayerState | null>(null);

  // ── TMDB data ─────────────────────────────────────────────────────────────
  const { data: trending,   isLoading: trendingLoading } = useTrending();
  const { data: topRated }   = useTopRated();
  const { data: popular }    = usePopular();
  const { data: nowPlaying } = useNowPlaying();
  const { data: upcoming }   = useUpcoming();
  const { data: popularTV }  = usePopularTV();
  const { data: topRatedTV } = useTopRatedTV();

  useEffect(() => {
    document.title = "AGJ Cinema — Watch Movies & TV Shows";
    return () => { document.title = "AGJ Cinema"; };
  }, []);

  // ── Play handlers ─────────────────────────────────────────────────────────

  /**
   * Called when user clicks Play on any movie or TV show card.
   *   - Movies  → open inline MoviePlayer overlay
   *   - TV shows → navigate to detail page (user picks episode there)
   */
  function handlePlay(movie: Movie) {
    if (movie.media_type === "tv") {
      // TV shows need episode selection — send to detail page
      navigate(`/tv/${movie.id}`);
      return;
    }
    // Movies — open inline overlay player
    setPlayer({
      movieId: movie.id,
      title:   movie.title || movie.name || "",
      isTV:    false,
    });
  }

  /** Same as handlePlay but only for TV rows — always sends to detail page */
  function handlePlayTV(movie: Movie) {
    navigate(`/tv/${movie.id}`);
  }

  function handleSelect(movie: Movie)   { navigate(`/movie/${movie.id}`); }
  function handleSelectTV(movie: Movie) { navigate(`/tv/${movie.id}`); }

  const popularTVMovies  = popularTV?.map(tvToMovie)  ?? [];
  const topRatedTVMovies = topRatedTV?.map(tvToMovie) ?? [];

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-20 md:pb-0">

      {/* ── Inline Movie Player overlay ───────────────────────────────────── */}
      {player && (
        <MoviePlayer
          movieId={player.movieId}
          title={player.title}
          isTV={player.isTV}
          onClose={() => setPlayer(null)}
        />
      )}

      {/* ── Hero Banner (shows skeleton while loading) ────────────────────── */}
      <HeroBanner
        movies={trending?.slice(0, 5) ?? []}
        onPlay={handlePlay}
        isLoading={trendingLoading}
      />

      {/* ── Movie / TV rows ───────────────────────────────────────────────── */}
      <div className="-mt-16 relative z-10">
        {trending   && <MovieRow title="Trending Now"           movies={trending}        onSelect={handleSelect}   onPlay={handlePlay}   />}
        {nowPlaying && <MovieRow title="Now Playing"            movies={nowPlaying}       onSelect={handleSelect}   onPlay={handlePlay}   />}
        {popular    && <MovieRow title="Popular on AGJ Cinema"  movies={popular}          onSelect={handleSelect}   onPlay={handlePlay}   />}
        {topRated   && <MovieRow title="Top Rated"              movies={topRated}         onSelect={handleSelect}   onPlay={handlePlay}   />}
        {upcoming   && <MovieRow title="Coming Soon"            movies={upcoming}         onSelect={handleSelect}   onPlay={handlePlay}   />}

        {popularTVMovies.length > 0 && (
          <MovieRow
            title="📺 Popular TV Shows"
            movies={popularTVMovies}
            onSelect={handleSelectTV}
            onPlay={handlePlayTV}
            mediaType="tv"
          />
        )}
        {topRatedTVMovies.length > 0 && (
          <MovieRow
            title="⭐ Top Rated TV Shows"
            movies={topRatedTVMovies}
            onSelect={handleSelectTV}
            onPlay={handlePlayTV}
            mediaType="tv"
          />
        )}
      </div>

      {/* ── Sign-in prompt for guests ─────────────────────────────────────── */}
      {!isLoggedIn && (
        <div className="mx-4 md:mx-12 my-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-400/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Enjoying AGJ Cinema?</p>
            <p className="text-white/50 text-sm">Sign in to save your watchlist and track progress.</p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-6 py-2.5 rounded-full text-sm transition-colors flex-shrink-0"
          >
            Sign In Free
          </button>
        </div>
      )}
    </div>
  );
}
