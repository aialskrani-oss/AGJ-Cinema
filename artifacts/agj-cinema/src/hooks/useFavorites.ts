import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Movie } from "../api/tmdb";

export interface WatchlistEntry {
  movie: Movie;
  progress: number;
  lastWatched: string;
  completed: boolean;
  completedAt?: string;
}

function favKey(username: string) { return `agj_favorites_${username}`; }
function watchKey(username: string) { return `agj_watchlist_${username}`; }

export function useFavorites() {
  const { user, isLoggedIn } = useAuth();
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  useEffect(() => {
    if (!user) { setFavorites([]); setWatchlist([]); return; }
    try {
      const fav = localStorage.getItem(favKey(user.username));
      setFavorites(fav ? (JSON.parse(fav) as Movie[]) : []);
    } catch { setFavorites([]); }
    try {
      const wl = localStorage.getItem(watchKey(user.username));
      setWatchlist(wl ? (JSON.parse(wl) as WatchlistEntry[]) : []);
    } catch { setWatchlist([]); }
  }, [user]);

  const saveFavorites = useCallback((list: Movie[]) => {
    if (!user) return;
    localStorage.setItem(favKey(user.username), JSON.stringify(list));
    setFavorites(list);
  }, [user]);

  const saveWatchlist = useCallback((list: WatchlistEntry[]) => {
    if (!user) return;
    localStorage.setItem(watchKey(user.username), JSON.stringify(list));
    setWatchlist(list);
  }, [user]);

  const isFavorite = useCallback(
    (movieId: number) => favorites.some((m) => m.id === movieId),
    [favorites]
  );

  const addFavorite = useCallback((movie: Movie) => {
    if (!isLoggedIn || favorites.some((m) => m.id === movie.id)) return;
    saveFavorites([...favorites, movie]);
  }, [isLoggedIn, favorites, saveFavorites]);

  const removeFavorite = useCallback((movieId: number) => {
    if (!isLoggedIn) return;
    saveFavorites(favorites.filter((m) => m.id !== movieId));
  }, [isLoggedIn, favorites, saveFavorites]);

  const toggleFavorite = useCallback((movie: Movie): boolean => {
    const wasFavorite = favorites.some((m) => m.id === movie.id);
    if (wasFavorite) {
      if (isLoggedIn) saveFavorites(favorites.filter((m) => m.id !== movie.id));
    } else {
      if (isLoggedIn) saveFavorites([...favorites, movie]);
    }
    return !wasFavorite;
  }, [isLoggedIn, favorites, saveFavorites]);

  const getWatchProgress = useCallback((movieId: number): number => {
    const entry = watchlist.find((e) => e.movie.id === movieId);
    return entry?.progress ?? 0;
  }, [watchlist]);

  const addToWatchlist = useCallback((movie: Movie, progress: number) => {
    if (!isLoggedIn || !user) return;
    const existing = watchlist.find((e) => e.movie.id === movie.id);
    const entry: WatchlistEntry = {
      movie,
      progress,
      lastWatched: new Date().toISOString(),
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt,
    };
    const updated = [
      entry,
      ...watchlist.filter((e) => e.movie.id !== movie.id),
    ];
    saveWatchlist(updated);
  }, [isLoggedIn, user, watchlist, saveWatchlist]);

  const markCompleted = useCallback((movieId: number) => {
    if (!isLoggedIn) return;
    const updated = watchlist.map((e) =>
      e.movie.id === movieId
        ? { ...e, completed: true, completedAt: new Date().toISOString() }
        : e
    );
    saveWatchlist(updated);
  }, [isLoggedIn, watchlist, saveWatchlist]);

  const removeFromWatchlist = useCallback((movieId: number) => {
    saveWatchlist(watchlist.filter((e) => e.movie.id !== movieId));
  }, [watchlist, saveWatchlist]);

  return {
    favorites,
    watchlist,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getWatchProgress,
    addToWatchlist,
    markCompleted,
    removeFromWatchlist,
  };
}
