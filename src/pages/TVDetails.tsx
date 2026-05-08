import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Play, Plus, Heart, ThumbsUp, Star, Clock, ExternalLink, Tv, ChevronDown, LogIn } from "lucide-react";
import { useTVDetails, useSimilarTV, useVideosTV, useSeasonDetails } from "../hooks/useTmdb";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useToast } from "../contexts/ToastContext";
import MovieRow from "../components/MovieRow";
import MoviePlayer from "../components/MoviePlayer";
import { tmdb, tvToMovie } from "../api/tmdb";
import type { Movie } from "../api/tmdb";

const STREAM_BASE_URL = import.meta.env.VITE_STREAM_BASE_URL as string;
const STREAM_PRIMARY_COLOR = import.meta.env.VITE_STREAM_PRIMARY_COLOR as string;
const STREAM_DEFAULT_LANG = import.meta.env.VITE_STREAM_DEFAULT_LANG as string;

export default function TVDetails() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");

  const { data: show, isLoading, isError } = useTVDetails(id);
  const { data: similar } = useSimilarTV(id);
  const { data: videos } = useVideosTV(id);
  const { data: seasonData } = useSeasonDetails(id, selectedSeason);

  const { isLoggedIn } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const trailer = videos?.find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));

  function buildEpisodeUrl(seasonNum: number, episodeNum: number) {
    const tvBase = STREAM_BASE_URL.replace("/movie/", "/tv/");
    return `${tvBase}${id}/${seasonNum}/${episodeNum}?primaryColor=${STREAM_PRIMARY_COLOR}&lang=${STREAM_DEFAULT_LANG}&ds_lang=ar&sub_lang=ar`;
  }

  function handleWatchEpisode(seasonNum: number, episodeNum: number, episodeTitle: string) {
    setPlayingUrl(buildEpisodeUrl(seasonNum, episodeNum));
    setPlayingTitle(episodeTitle);
  }

  function handleFavorite() {
    if (!isLoggedIn) {
      showToast("Sign in to add favorites", "info");
      navigate("/login");
      return;
    }
    if (!show) return;
    const showAsMovie = tvToMovie(show);
    const wasAdded = !isFavorite(show.id);
    toggleFavorite(showAsMovie);
    showToast(
      wasAdded ? "\u2713 Added to Favorites" : "\u2717 Removed from Favorites",
      wasAdded ? "success" : "info"
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !show) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-4">
        <p className="text-white text-xl font-bold">TV Show not found</p>
        <button onClick={() => navigate("/")} className="bg-cyan-400 text-black font-bold px-6 py-2 rounded-full hover:bg-cyan-300 transition-colors">
          Go Home
        </button>
      </div>
    );
  }

  const year = show.first_air_date?.slice(0, 4) ?? "";
  const matchPercent = Math.round(show.vote_average * 10);
  const cast = show.credits?.cast?.slice(0, 8) ?? [];
  const mainSeasons = show.seasons?.filter((s) => s.season_number > 0) ?? [];
  const similarMovies: Movie[] = similar?.map(tvToMovie) ?? [];
  const favored = isFavorite(show.id);

  return (
    <div className="min-h-screen bg-[#141414] animate-fadeIn pb-24 md:pb-0">
      {/* Backdrop hero */}
      <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        {show.backdrop_path ? (
          <img src={tmdb.imgUrl(show.backdrop_path, "original")} alt={show.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />

        <button
          onClick={() => window.history.back()}
          className="absolute top-20 left-4 flex items-center gap-2 glass border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="-mt-20 md:-mt-32 relative z-10 px-4 md:px-12">
        <div className="flex gap-6 md:gap-8">
          <div className="hidden md:block flex-shrink-0">
            {show.poster_path ? (
              <img src={tmdb.imgUrl(show.poster_path, "w342")} alt={show.name} loading="lazy" className="w-56 lg:w-72 rounded-2xl shadow-2xl" />
            ) : (
              <div className="w-56 lg:w-72 aspect-[2/3] bg-gray-800 rounded-2xl" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                <Tv className="w-3 h-3" /> TV Show
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight">{show.name}</h1>
            {show.tagline && <p className="text-white/50 italic text-base mb-3">{show.tagline}</p>}

            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold">{show.vote_average.toFixed(1)}</span>
              </div>
              <span className="text-green-400 font-bold">{matchPercent}%</span>
              {show.number_of_seasons && (
                <span className="text-white/60">{show.number_of_seasons} Season{show.number_of_seasons > 1 ? "s" : ""}</span>
              )}
              {show.number_of_episodes && (
                <span className="text-white/60">{show.number_of_episodes} Episodes</span>
              )}
              {show.episode_run_time && show.episode_run_time[0] && (
                <div className="flex items-center gap-1 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span>~{show.episode_run_time[0]}m / ep</span>
                </div>
              )}
              {year && <span className="text-white/60">{year}</span>}
              {show.status && (
                <span className="bg-cyan-400/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-400/30">{show.status}</span>
              )}
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {show.genres.map((g) => (
                  <span key={g.id} className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full border border-white/10">{g.name}</span>
                ))}
              </div>
            )}

            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">{show.overview}</p>

            {show.networks && show.networks.length > 0 && (
              <p className="text-white/40 text-xs mb-4">
                Network: <span className="text-white/70">{show.networks.map(n => n.name).join(", ")}</span>
              </p>
            )}
            {show.created_by && show.created_by.length > 0 && (
              <p className="text-white/40 text-xs mb-5">
                Created by: <span className="text-white/70">{show.created_by.map(c => c.name).join(", ")}</span>
              </p>
            )}

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button
                onClick={() => handleWatchEpisode(1, 1, `${show.name} — S1E1`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-white/90 transition-all duration-200 active:scale-95"
              >
                <Play className="w-5 h-5 fill-black" /> Watch S1E1
              </button>

              <button
                onClick={handleFavorite}
                className={`flex items-center gap-2 border font-semibold px-5 py-2.5 rounded-full transition-all duration-200 ${
                  favored
                    ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                    : isLoggedIn
                    ? "glass border-white/20 text-white hover:bg-white/20"
                    : "border-white/10 text-white/40"
                }`}
              >
                {favored ? (
                  <><Heart className="w-5 h-5 fill-red-400" /> Remove</>
                ) : isLoggedIn ? (
                  <><Plus className="w-5 h-5" /> My List</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Sign in</>
                )}
              </button>

              <button className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center hover:border-white transition-colors">
                <ThumbsUp className="w-5 h-5 text-white" />
              </button>
            </div>

            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors mb-6"
              >
                Watch Trailer on YouTube <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {cast.length > 0 && (
              <div className="mb-2">
                <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-3">Cast</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {cast.map((member) => (
                    <div key={member.id} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                        {member.profile_path ? (
                          <img src={tmdb.imgUrl(member.profile_path, "w92")} alt={member.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-lg">{member.name.charAt(0)}</div>
                        )}
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

      {/* Season Selector + Episodes */}
      {mainSeasons.length > 0 && (
        <div className="mt-12 px-4 md:px-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-xl">Episodes</h2>
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="appearance-none bg-[#1a1a1a] border border-white/20 text-white text-sm px-4 py-2 pr-8 rounded-full outline-none cursor-pointer hover:border-cyan-400/50 transition-colors"
              >
                {mainSeasons.map((s) => (
                  <option key={s.season_number} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            </div>
          </div>

          {seasonData?.episodes && seasonData.episodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasonData.episodes.map((ep) => (
                <div key={ep.id} className="bg-[#181818] rounded-xl overflow-hidden border border-white/5 hover:border-cyan-400/30 transition-all duration-200 group">
                  <div className="relative aspect-video bg-gray-800">
                    {ep.still_path ? (
                      <img src={tmdb.imgUrl(ep.still_path, "w300")} alt={ep.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleWatchEpisode(ep.season_number, ep.episode_number, `${show.name} — S${ep.season_number}E${ep.episode_number}: ${ep.name}`)}
                        className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-full text-sm hover:bg-cyan-400 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-black" /> Watch
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 text-white/80 text-xs px-2 py-0.5 rounded-md font-medium">
                      E{ep.episode_number}
                    </div>
                    {ep.vote_average > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 rounded-md px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-[10px] font-bold">{ep.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white font-semibold text-sm truncate mb-1">{ep.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 mb-2">
                      {ep.air_date && <span>{ep.air_date.slice(0, 4)}</span>}
                      {ep.runtime && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{ep.runtime}m</span>}
                    </div>
                    {ep.overview && <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">{ep.overview}</p>}
                    <button
                      onClick={() => handleWatchEpisode(ep.season_number, ep.episode_number, `${show.name} — S${ep.season_number}E${ep.episode_number}: ${ep.name}`)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-cyan-400 hover:text-black text-white text-xs font-semibold py-2 rounded-lg transition-all duration-200"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Watch Episode
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {similarMovies.length > 0 && (
        <div className="mt-10">
          <MovieRow
            title="More Like This"
            movies={similarMovies}
            onSelect={(m: Movie) => navigate(`/tv/${m.id}`)}
            onPlay={(m: Movie) => navigate(`/tv/${m.id}`)}
            mediaType="tv"
          />
        </div>
      )}

      {playingUrl && (
        <MoviePlayer url={playingUrl} title={playingTitle} movieId={id} onClose={() => setPlayingUrl(null)} />
      )}
    </div>
  );
}
