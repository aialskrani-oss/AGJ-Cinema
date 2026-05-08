// ── Dev guard ───────────────────────────────────────────────────────────────
if (import.meta.env.DEV && !import.meta.env.VITE_TMDB_API_KEY) {
  console.warn(
    "[AGJ Cinema] ⚠️  VITE_TMDB_API_KEY is not set.\n" +
    "Copy .env.example to .env and fill in your TMDB key.\n" +
    "Get a free key at https://www.themoviedb.org/settings/api"
  );
}

export const tmdb = {
  BASE_URL:  "https://api.themoviedb.org/3",
  API_KEY:   import.meta.env.VITE_TMDB_API_KEY as string,
  PROXY_URL: "/api/tmdb",
  imgUrl(path: string | null, size: string = "w500"): string {
    if (!path) return "/placeholder-poster.svg";
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
};

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Movie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  runtime?: number;
  tagline?: string;
  genres?: Genre[];
  status?: string;
  credits?: { cast: CastMember[] };
  media_type?: "movie" | "tv";
}

export interface TVShow {
  id: number;
  name: string;
  title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  tagline?: string;
  genres?: Genre[];
  status?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  seasons?: TVSeason[];
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
}

export interface TVSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episode_count: number;
  episodes?: TVEpisode[];
}

export interface TVEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime?: number;
  vote_average: number;
}

export interface PagedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

export function tvToMovie(tv: TVShow): Movie {
  return {
    id:           tv.id,
    title:        tv.name,
    name:         tv.name,
    overview:     tv.overview,
    poster_path:  tv.poster_path,
    backdrop_path: tv.backdrop_path,
    release_date: tv.first_air_date ?? "",
    first_air_date: tv.first_air_date,
    vote_average: tv.vote_average,
    vote_count:   tv.vote_count,
    genre_ids:    tv.genre_ids,
    adult:        false,
    media_type:   "tv",
  };
}

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  let url: URL;
  if (import.meta.env.PROD) {
    // Production: route through Vercel Edge Function proxy (hides API key)
    url = new URL(tmdb.PROXY_URL, window.location.origin);
    url.searchParams.set("_path", endpoint);
  } else {
    // Development: call TMDB directly (API key is local-only)
    if (!tmdb.API_KEY) throw new Error("VITE_TMDB_API_KEY is not configured. See .env.example");
    url = new URL(`${tmdb.BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", tmdb.API_KEY);
  }
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const msg = res.status === 401
      ? "Invalid TMDB API key. Check VITE_TMDB_API_KEY in your .env file."
      : res.status === 429
      ? "Too many requests. Please wait a moment."
      : `TMDB API error: ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function getTrending(): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>("/trending/movie/week");
  return data.results;
}
export async function getTopRated(): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>("/movie/top_rated");
  return data.results;
}
export async function getPopular(): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>("/movie/popular");
  return data.results;
}
export async function getNowPlaying(): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>("/movie/now_playing");
  return data.results;
}
export async function getUpcoming(): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>("/movie/upcoming");
  return data.results;
}
export async function getMovieDetails(id: number): Promise<Movie> {
  return apiFetch<Movie>(`/movie/${id}`, { append_to_response: "credits" });
}
export async function getSimilar(id: number): Promise<Movie[]> {
  const data = await apiFetch<PagedResponse<Movie>>(`/movie/${id}/similar`);
  return data.results;
}
export async function getVideos(id: number): Promise<Video[]> {
  const data = await apiFetch<{ results: Video[] }>(`/movie/${id}/videos`);
  return data.results;
}
export async function searchMovies(query: string, page: number = 1): Promise<PagedResponse<Movie>> {
  return apiFetch<PagedResponse<Movie>>("/search/movie", { query, page: String(page) });
}
export async function discoverByGenre(genreId: number, page: number = 1): Promise<PagedResponse<Movie>> {
  return apiFetch<PagedResponse<Movie>>("/discover/movie", {
    with_genres: String(genreId),
    sort_by:     "popularity.desc",
    page:        String(page),
  });
}
export async function searchMulti(query: string, page: number = 1): Promise<PagedResponse<Movie>> {
  return apiFetch<PagedResponse<Movie>>("/search/multi", { query, page: String(page) });
}
export async function getPopularTV(): Promise<TVShow[]> {
  const data = await apiFetch<PagedResponse<TVShow>>("/tv/popular");
  return data.results;
}
export async function getTopRatedTV(): Promise<TVShow[]> {
  const data = await apiFetch<PagedResponse<TVShow>>("/tv/top_rated");
  return data.results;
}
export async function getAiringTodayTV(): Promise<TVShow[]> {
  const data = await apiFetch<PagedResponse<TVShow>>("/tv/airing_today");
  return data.results;
}
export async function getOnTheAirTV(): Promise<TVShow[]> {
  const data = await apiFetch<PagedResponse<TVShow>>("/tv/on_the_air");
  return data.results;
}
export async function getTVDetails(id: number): Promise<TVShow> {
  return apiFetch<TVShow>(`/tv/${id}`, { append_to_response: "credits,videos" });
}
export async function getSimilarTV(id: number): Promise<TVShow[]> {
  const data = await apiFetch<PagedResponse<TVShow>>(`/tv/${id}/similar`);
  return data.results;
}
export async function getVideosTV(id: number): Promise<Video[]> {
  const data = await apiFetch<{ results: Video[] }>(`/tv/${id}/videos`);
  return data.results;
}
export async function getSeasonDetails(tvId: number, seasonNum: number): Promise<TVSeason> {
  return apiFetch<TVSeason>(`/tv/${tvId}/season/${seasonNum}`);
}
