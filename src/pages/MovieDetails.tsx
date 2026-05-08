import { useParams, useLocation } from "wouter";
import { ArrowLeft, Play, Heart, Plus, ThumbsUp, Star, Clock, ExternalLink, LogIn } from "lucide-react";
import { useMovieDetails, useSimilar, useVideos } from "../hooks/useTmdb";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useToast } from "../contexts/ToastContext";
import MovieRow from "../components/MovieRow";
import { tmdb } from "../api/tmdb";
import type { Movie } from "../api/tmdb";

export default function MovieDetails() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { isLoggedIn } = useAuth();
  const { isFavorite, toggleFavorite, getWatchProgress } = useFavorites();
  const { showToast } = useToast();

  const { data: movie, isLoading, isError } = useMovieDetails(id);
  const { data: similar } = useSimilar(id);
  const { data: videos } = useVideos(id);

  const trailer     = videos?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  const favored     = movie ? isFavorite(movie.id) : false;

  function handleFavorite() {
    if (!isLoggedIn) { showToast("Sign in to add favorites", "info"); navigate("/login"); return; }
    if (!movie) return;
    const wasAdded = !isFavorite(movie.id);
    toggleFavorite(movie);
    showToast(wasAdded ? "\u2713 Added to Favorites" : "\u2717 Removed from Favorites", wasAdded ? "success" : "info");
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError || !movie) return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-4">
      <p className="text-white text-xl font-bold">Movie not found</p>
      <button onClick={() => navigate("/")} className="bg-cyan-400 text-black font-bold px-6 py-2 rounded-full hover:bg-cyan-300 transition-colors">Go Home</button>
    </div>
  );

  const year          = movie.release_date?.slice(0, 4) ?? "";
  const matchPercent  = Math.round(movie.vote_average * 10);
  const cast          = movie.credits?.cast?.slice(0, 8) ?? [];
  const savedProgress = getWatchProgress(movie.id);
  const runtimeSec    = (movie.runtime ?? 120) * 60;

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-24 md:pb-0">
      {/* Backdrop */}
      <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        {movie.backdrop_path
          ? <img src={tmdb.imgUrl(movie.backdrop_path, "original")} alt={movie.title} loading="lazy" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gray-900" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />
        <button onClick={() => window.history.back()} className="absolute top-20 left-4 flex items-center gap-2 glass border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="-mt-20 md:-mt-32 relative z-10 px-4 md:px-12">
        <div className="flex gap-6 md:gap-8">
          <div className="hidden md:block flex-shrink-0">
            {movie.poster_path
              ? <img src={tmdb.imgUrl(movie.poster_path, "w342")} alt={movie.title} loading="lazy" className="w-56 lg:w-72 rounded-2xl shadow-2xl" />
              : <div className="w-56 lg:w-72 aspect-[2/3] bg-gray-800 rounded-2xl" />}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight">{movie.title}</h1>
            {movie.tagline && <p className="text-white/50 italic text-base mb-3">{movie.tagline}</p>}

            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold">{movie.vote_average.toFixed(1)}</span>
              </div>
              <span className="text-green-400 font-bold">{matchPercent}%</span>
              {movie.runtime && (
                <div className="flex items-center gap-1 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </div>
              )}
              {year && <span className="text-white/60">{year}</span>}
              <span className="border border-white/30 text-white/60 px-1.5 py-0.5 rounded text-xs">{movie.adult ? "18+" : "PG-13"}</span>
              {movie.status && <span className="bg-cyan-400/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-400/30">{movie.status}</span>}
            </div>

            {savedProgress > 60 && (
              <div className="mb-4 max-w-sm">
                <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                  <span>Continue watching</span>
                  <span>{Math.floor(savedProgress / 60)}m watched</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (savedProgress / runtimeSec) * 100)}%` }} />
                </div>
              </div>
            )}

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres.map(g => <span key={g.id} className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full border border-white/10">{g.name}</span>)}
              </div>
            )}

            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">{movie.overview}</p>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* ── Play → navigate to watch page ── */}
              <button
                onClick={() => navigate(`/watch/movie/${id}`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-200 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" />
                {savedProgress > 60 ? "Continue" : "Play"}
              </button>

              <button onClick={handleFavorite} className={`flex items-center gap-2 border font-semibold px-5 py-2.5 rounded-full transition-all duration-200 ${favored ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" : isLoggedIn ? "glass border-white/20 text-white hover:bg-white/20" : "border-white/10 text-white/40"}`}>
                {favored ? (<><Heart className="w-5 h-5 fill-red-400" /> Remove</>) : isLoggedIn ? (<><Plus className="w-5 h-5" /> Add to Favorites</>) : (<><LogIn className="w-4 h-4" /> Sign in</>)}
              </button>

              <button className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center hover:border-white transition-colors">
                <ThumbsUp className="w-5 h-5 text-white" />
              </button>
            </div>

            {trailer && (
              <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors mb-6">
                Watch Trailer on YouTube <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {cast.length > 0 && (
              <div className="mb-2">
                <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-3">Cast</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {cast.map(member => (
                    <div key={member.id} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                        {member.profile_path
                          ? <img src={tmdb.imgUrl(member.profile_path, "w92")} alt={member.name} loading="lazy" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-lg">{member.name.charAt(0)}</div>}
                      </div>
                      <p className="text-white/80 text-[10px] font-medium line-clamp-2 leading-tight">{member.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {similar && similar.length > 0 && (
        <div className="mt-10">
          <MovieRow title="More Like This" movies={similar} onSelect={(m: Movie) => navigate(`/movie/${m.id}`)} onPlay={(m: Movie) => navigate(`/watch/movie/${m.id}`)} />
        </div>
      )}
    </div>
  );
}
