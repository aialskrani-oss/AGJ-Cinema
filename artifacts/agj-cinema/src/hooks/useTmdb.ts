import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getTrending, getTopRated, getPopular, getNowPlaying, getUpcoming,
  getMovieDetails, getSimilar, getVideos, searchMovies, discoverByGenre, searchMulti,
  getPopularTV, getTopRatedTV, getAiringTodayTV, getOnTheAirTV,
  getTVDetails, getSimilarTV, getVideosTV, getSeasonDetails,
} from "../api/tmdb";

const STALE = 5 * 60 * 1000;

// ─── Movies ────────────────────────────────────────────────────────────────

export function useTrending() {
  return useQuery({ queryKey: ["trending"], queryFn: getTrending, staleTime: STALE, retry: 1 });
}

export function useTopRated() {
  return useQuery({ queryKey: ["top-rated"], queryFn: getTopRated, staleTime: STALE, retry: 1 });
}

export function usePopular() {
  return useQuery({ queryKey: ["popular"], queryFn: getPopular, staleTime: STALE, retry: 1 });
}

export function useNowPlaying() {
  return useQuery({ queryKey: ["now-playing"], queryFn: getNowPlaying, staleTime: STALE, retry: 1 });
}

export function useUpcoming() {
  return useQuery({ queryKey: ["upcoming"], queryFn: getUpcoming, staleTime: STALE, retry: 1 });
}

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovieDetails(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSimilar(id: number) {
  return useQuery({
    queryKey: ["similar", id],
    queryFn: () => getSimilar(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useVideos(id: number) {
  return useQuery({
    queryKey: ["videos", id],
    queryFn: () => getVideos(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMovies(query),
    enabled: query.length > 2,
    staleTime: STALE,
    retry: 1,
  });
}

export function useDiscoverByGenre(genreId: number | null) {
  return useInfiniteQuery({
    queryKey: ["discover-genre", genreId],
    queryFn: ({ pageParam }) => discoverByGenre(genreId!, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: genreId !== null,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSearchInfinite(query: string, genreId: number | null) {
  return useInfiniteQuery({
    queryKey: ["search-infinite", query, genreId],
    queryFn: ({ pageParam }) => searchMovies(query, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: query.length > 2,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSearchMulti(query: string) {
  return useQuery({
    queryKey: ["search-multi", query],
    queryFn: () => searchMulti(query),
    enabled: query.length > 2,
    staleTime: STALE,
    retry: 1,
  });
}

// ─── TV Shows ───────────────────────────────────────────────────────────────

export function usePopularTV() {
  return useQuery({ queryKey: ["tv-popular"], queryFn: getPopularTV, staleTime: STALE, retry: 1 });
}

export function useTopRatedTV() {
  return useQuery({ queryKey: ["tv-top-rated"], queryFn: getTopRatedTV, staleTime: STALE, retry: 1 });
}

export function useAiringTodayTV() {
  return useQuery({ queryKey: ["tv-airing-today"], queryFn: getAiringTodayTV, staleTime: STALE, retry: 1 });
}

export function useOnTheAirTV() {
  return useQuery({ queryKey: ["tv-on-the-air"], queryFn: getOnTheAirTV, staleTime: STALE, retry: 1 });
}

export function useTVDetails(id: number) {
  return useQuery({
    queryKey: ["tv", id],
    queryFn: () => getTVDetails(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSimilarTV(id: number) {
  return useQuery({
    queryKey: ["tv-similar", id],
    queryFn: () => getSimilarTV(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useVideosTV(id: number) {
  return useQuery({
    queryKey: ["tv-videos", id],
    queryFn: () => getVideosTV(id),
    enabled: id > 0,
    staleTime: STALE,
    retry: 1,
  });
}

export function useSeasonDetails(tvId: number, seasonNum: number) {
  return useQuery({
    queryKey: ["tv-season", tvId, seasonNum],
    queryFn: () => getSeasonDetails(tvId, seasonNum),
    enabled: tvId > 0 && seasonNum >= 0,
    staleTime: STALE,
    retry: 1,
  });
}
