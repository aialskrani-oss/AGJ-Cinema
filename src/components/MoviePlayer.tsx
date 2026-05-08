import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, Settings, Subtitles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import type { Movie } from "../api/tmdb";

// ── Types ─────────────────────────────────────────────────────────────────────
type SubLang = "ar" | "en" | "off";
type SettingsTab = "speed" | "quality" | "subtitles" | null;
type LoadStage = "loading" | "slow" | "failed" | "ok";

interface MoviePlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  movieId: number;
  movie?: Movie;
  resumeProgress?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DURATION = 7200;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ["Auto", "1080p", "720p", "480p", "360p"];
const AMBIENT = [
  "radial-gradient(ellipse at 15% 50%,rgba(6,182,212,.13) 0%,transparent 55%),radial-gradient(ellipse at 85% 50%,rgba(59,130,246,.09) 0%,transparent 55%)",
  "radial-gradient(ellipse at 80% 20%,rgba(168,85,247,.11) 0%,transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(239,68,68,.08) 0%,transparent 55%)",
  "radial-gradient(ellipse at 50% 10%,rgba(16,185,129,.10) 0%,transparent 55%),radial-gradient(ellipse at 50% 90%,rgba(245,158,11,.08) 0%,transparent 55%)",
  "radial-gradient(ellipse at 10% 30%,rgba(6,182,212,.10) 0%,transparent 55%),radial-gradient(ellipse at 90% 70%,rgba(139,92,246,.11) 0%,transparent 55%)",
  "radial-gradient(ellipse at 70% 80%,rgba(248,113,113,.09) 0%,transparent 55%),radial-gradient(ellipse at 30% 20%,rgba(6,182,212,.11) 0%,transparent 55%)",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function buildSrc(base: string, lang: SubLang, resume: number): string {
  let u = base.replace(/&?ds_lang=[^&]*/g, "").replace(/&?sub_lang=[^&]*/g, "");
  if (lang === "ar") u += "&ds_lang=ar&sub_lang=ar";
  else if (lang === "en") u += "&ds_lang=en&sub_lang=en";
  if (resume > 0) u += `&t=${Math.floor(resume)}`;
  return u;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MoviePlayer({
  url,
  title,
  onClose,
  movieId,
  movie,
  resumeProgress = 0,
}: MoviePlayerProps) {
  // ── DOM & timer refs ───────────────────────────────────────────────────────
  const containerRef   = useRef<HTMLDivElement>(null);
  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const hideTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadTimer8     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer15    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef     = useRef<{ time: number; x: number } | null>(null);
  const touchStartRef  = useRef<{ x: number; y: number; side: "L" | "R" } | null>(null);
  const currentTimeRef = useRef(resumeProgress);

  // ── State ──────────────────────────────────────────────────────────────────
  const [visible,         setVisible]         = useState(false);
  const [loadStage,       setLoadStage]       = useState<LoadStage>("loading");
  const [showControls,    setShowControls]    = useState(true);
  const [isPlaying,       setIsPlaying]       = useState(true);
  const [isMuted,         setIsMuted]         = useState(false);
  const [volume,          setVolume]          = useState(80);
  const [currentTime,     setCurrentTime]     = useState(resumeProgress);
  const [progress,        setProgress]        = useState((resumeProgress / DURATION) * 100);
  const [hoverPct,        setHoverPct]        = useState<number | null>(null);
  const [showSettings,    setShowSettings]    = useState(false);
  const [settingsTab,     setSettingsTab]     = useState<SettingsTab>(null);
  const [playbackSpeed,   setPlaybackSpeed]   = useState(1);
  const [quality,         setQuality]         = useState("Auto");
  const [subtitleLang,    setSubtitleLang]    = useState<SubLang>("ar");
  const [showCenterFlash, setShowCenterFlash] = useState(false);
  const [iframeKey,       setIframeKey]       = useState(0);
  const [currentSrc,      setCurrentSrc]      = useState(() => buildSrc(url, "ar", resumeProgress));
  const [showResume,      setShowResume]      = useState(false);
  const [savedProgress,   setSavedProgress]   = useState(0);
  const [ambientIdx,      setAmbientIdx]      = useState(0);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [showEscHint,     setShowEscHint]     = useState(true);
  const [brightness,      setBrightness]      = useState(1);

  // ── Auth & watchlist ───────────────────────────────────────────────────────
  const { isLoggedIn }              = useAuth();
  const { addToWatchlist, markCompleted } = useFavorites();

  // ── Stable callback refs (avoid stale closures in timers) ─────────────────
  const onCloseRef           = useRef(onClose);
  const addToWatchlistRef    = useRef(addToWatchlist);
  const markCompletedRef     = useRef(markCompleted);
  const isLoggedInRef        = useRef(isLoggedIn);
  const movieRef             = useRef(movie);
  useEffect(() => { onCloseRef.current        = onClose; });
  useEffect(() => { addToWatchlistRef.current = addToWatchlist; });
  useEffect(() => { markCompletedRef.current  = markCompleted; });
  useEffect(() => { isLoggedInRef.current     = isLoggedIn; });
  useEffect(() => { movieRef.current          = movie; });
  useEffect(() => { currentTimeRef.current    = currentTime; });

  // ── Fade-in on mount ───────────────────────────────────────────────────────
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // ── Close with fade-out ───────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  // ── Start load timers ─────────────────────────────────────────────────────
  const startLoadTimers = useCallback(() => {
    if (loadTimer8.current)  clearTimeout(loadTimer8.current);
    if (loadTimer15.current) clearTimeout(loadTimer15.current);
    loadTimer8.current  = setTimeout(() => setLoadStage((s) => s === "loading" ? "slow"   : s), 8000);
    loadTimer15.current = setTimeout(() => setLoadStage((s) => s !== "ok"      ? "failed" : s), 15000);
  }, []);

  // ── Mount: history, resume check, ambient, fullscreen listener ────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.history.pushState({ player: true }, "");
    const popHandler = () => onCloseRef.current();
    window.addEventListener("popstate", popHandler);

    // Resume check
    try {
      const saved = localStorage.getItem(`progress_${movieId}`);
      if (saved) {
        const p = Number(saved);
        if (p > 60 && p < DURATION * 0.95 && resumeProgress === 0) {
          setSavedProgress(p);
          setShowResume(true);
        }
      }
    } catch { /* localStorage unavailable */ }

    // Block popup windows opened by the iframe
    const origOpen = window.open;
    window.open = (..._args) => {
      console.log("[AGJ] Blocked popup attempt");
      return null;
    };

    // ESC hint fades after 3s
    const escTimer = setTimeout(() => setShowEscHint(false), 3000);

    // Ambient glow cycling every 15s
    ambientTimer.current = setInterval(() => {
      setAmbientIdx((i) => (i + 1) % AMBIENT.length);
    }, 15000);

    // Fullscreen sync
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);

    startLoadTimers();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", popHandler);
      clearTimeout(escTimer);
      if (loadTimer8.current)   clearTimeout(loadTimer8.current);
      if (loadTimer15.current)  clearTimeout(loadTimer15.current);
      if (ambientTimer.current) clearInterval(ambientTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (hideTimer.current)    clearTimeout(hideTimer.current);
      document.removeEventListener("fullscreenchange", onFsChange);
      window.open = origOpen;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Simulated progress timer ───────────────────────────────────────────────
  useEffect(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (isPlaying && loadStage === "ok") {
      progressTimer.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          const pct = (next / DURATION) * 100;
          setProgress(pct);
          try { localStorage.setItem(`progress_${movieId}`, String(next)); } catch { /* ignore */ }
          if (isLoggedInRef.current && movieRef.current) {
            addToWatchlistRef.current(movieRef.current, next);
          }
          if (pct >= 95 && isLoggedInRef.current) {
            markCompletedRef.current(movieId);
          }
          return next;
        });
      }, 1000);
    }
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [isPlaying, loadStage, movieId]);

  // ── Controls auto-hide ─────────────────────────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 3000);
  }, [showSettings]);

  const bringControlsUp = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  // Keep controls visible while settings open
  useEffect(() => {
    if (showSettings) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
    }
  }, [showSettings]);

  // ── Toggle play (functional update avoids stale isPlaying) ────────────────
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      iframeRef.current?.contentWindow?.postMessage({ action: next ? "play" : "pause" }, "*");
      return next;
    });
    setShowCenterFlash(true);
    setTimeout(() => setShowCenterFlash(false), 700);
  }, []);

  // ── Skip ──────────────────────────────────────────────────────────────────
  const skipBy = useCallback((sec: number) => {
    setCurrentTime((prev) => {
      const next = Math.max(0, Math.min(DURATION, prev + sec));
      setProgress((next / DURATION) * 100);
      return next;
    });
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ": case "k": case "K":
          e.preventDefault(); togglePlay(); bringControlsUp(); break;
        case "ArrowLeft": case "j": case "J":
          e.preventDefault(); skipBy(-10); bringControlsUp(); break;
        case "ArrowRight": case "l": case "L":
          e.preventDefault(); skipBy(10); bringControlsUp(); break;
        case "ArrowUp":
          e.preventDefault(); setVolume((v) => Math.min(100, v + 10)); bringControlsUp(); break;
        case "ArrowDown":
          e.preventDefault(); setVolume((v) => Math.max(0, v - 10)); bringControlsUp(); break;
        case "f": case "F":
          e.preventDefault(); toggleFullscreen(); break;
        case "m": case "M":
          e.preventDefault(); setIsMuted((v) => !v); bringControlsUp(); break;
        case "Escape":
          if (showSettings) { setShowSettings(false); setSettingsTab(null); }
          else handleClose();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings, togglePlay, skipBy, toggleFullscreen, bringControlsUp, handleClose]);

  // ── Progress bar ──────────────────────────────────────────────────────────
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * DURATION;
    setCurrentTime(newTime);
    setProgress(pct * 100);
  }, []);

  const handleProgressMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPct(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, []);

  // ── Subtitle change ────────────────────────────────────────────────────────
  const changeSubtitle = useCallback((lang: SubLang) => {
    setSubtitleLang(lang);
    setCurrentSrc(buildSrc(url, lang, currentTimeRef.current));
    setIframeKey((k) => k + 1);
    setLoadStage("loading");
    startLoadTimers();
    setShowSettings(false);
    setSettingsTab(null);
  }, [url, startLoadTimers]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setLoadStage("loading");
    setIframeKey((k) => k + 1);
    startLoadTimers();
  }, [startLoadTimers]);

  // ── Resume modal ──────────────────────────────────────────────────────────
  const handleResume = useCallback((resume: boolean) => {
    setShowResume(false);
    if (resume) {
      setCurrentTime(savedProgress);
      setProgress((savedProgress / DURATION) * 100);
      setCurrentSrc(buildSrc(url, subtitleLang, savedProgress));
      setIframeKey((k) => k + 1);
      setLoadStage("loading");
      startLoadTimers();
    }
  }, [url, subtitleLang, savedProgress, startLoadTimers]);

  // ── Touch gestures ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const side: "L" | "R" = t.clientX < window.innerWidth / 2 ? "L" : "R";
    touchStartRef.current = { x: t.clientX, y: t.clientY, side };

    // Double-tap detection (300ms window, within 60px)
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.time < 300 && Math.abs(t.clientX - last.x) < 60) {
      side === "L" ? skipBy(-10) : skipBy(10);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: t.clientX };
    }
  }, [skipBy]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dy = t.clientY - touchStartRef.current.y;
    const absDy = Math.abs(dy);
    const absDx = Math.abs(t.clientX - touchStartRef.current.x);
    // Vertical swipe (>50px, clearly more vertical than horizontal)
    if (absDy > 50 && absDy > absDx * 1.5) {
      if (touchStartRef.current.side === "L") {
        setVolume((v) => dy < 0 ? Math.min(100, v + 15) : Math.max(0, v - 15));
      } else {
        setBrightness((b) => dy < 0 ? Math.min(1.4, b + 0.1) : Math.max(0.4, b - 0.1));
      }
    }
    touchStartRef.current = null;
  }, []);

  const handleSingleTap = useCallback(() => {
    setShowControls((v) => {
      if (!v) { scheduleHide(); return true; }
      return v;
    });
  }, [scheduleHide]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const controlsVisible = (showControls || showSettings) && !showResume;

  // ── No URL guard ──────────────────────────────────────────────────────────
  if (!url) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60">No stream URL provided.</p>
          <button
            onClick={handleClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2.5 rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, filter: `brightness(${brightness})` }}
      onMouseMove={bringControlsUp}
      onMouseLeave={() => {
        if (!showSettings) {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          setShowControls(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleSingleTap}
    >
      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-[4000ms]"
        style={{ background: AMBIENT[ambientIdx] }}
      />

      {/* ── Inner container ───────────────────────────────────────────────── */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col p-2 md:p-4">

        {/* ── Permanent close button — always above iframe ─────────────── */}
        <div className="absolute top-3 right-3 z-[60]">
          <button
            onClick={handleClose}
            aria-label="Close player"
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center shadow-2xl transition-all ring-2 ring-red-500/40"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* ── Iframe wrapper ──────────────────────────────────────────────── */}
        <div
          className="relative flex-1 rounded-xl overflow-hidden"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px rgba(0,0,0,0.9)" }}
        >
          {/* iframe */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={currentSrc}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            loading="eager"
            style={{ opacity: loadStage === "ok" ? 1 : 0, transition: "opacity 0.4s" }}
            onLoad={() => {
              setLoadStage("ok");
              if (loadTimer8.current)  clearTimeout(loadTimer8.current);
              if (loadTimer15.current) clearTimeout(loadTimer15.current);
            }}
          />

          {/* ── Edge shields — intercept popup-trigger clicks at iframe borders ─ */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* top strip */}
            <div className="absolute top-0 left-0 right-0 h-14 pointer-events-auto"
              onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
            {/* bottom strip */}
            <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-auto"
              onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
            {/* left strip */}
            <div className="absolute top-14 bottom-14 left-0 w-10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
            {/* right strip */}
            <div className="absolute top-14 bottom-14 right-0 w-10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
          </div>

          {/* ── Loading / error overlay ────────────────────────────────── */}
          {loadStage !== "ok" && (
            <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center gap-4">
              {loadStage === "failed" ? (
                <>
                  <p className="text-white/60 font-semibold text-center px-8 text-sm">
                    Stream unavailable. Please try another movie.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-1 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
                  >
                    Go Back
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
                  <p className="text-white/60 text-sm">
                    {loadStage === "slow" ? "Taking longer than usual..." : "Preparing your movie..."}
                  </p>
                  {loadStage === "slow" && (
                    <button
                      onClick={handleRetry}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2 rounded-full text-sm transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Center play/pause flash ────────────────────────────────── */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showCenterFlash ? "opacity-100" : "opacity-0"}`}
          >
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              {isPlaying
                ? <Pause className="w-9 h-9 text-white fill-white" />
                : <Play  className="w-9 h-9 text-white fill-white ml-1" />}
            </div>
          </div>

          {/* ── Large pause button (visible when paused, controls hidden) ─ */}
          {!isPlaying && !showCenterFlash && loadStage === "ok" && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              <button
                aria-label="Play"
                className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-110 transition-all flex items-center justify-center"
              >
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </button>
            </div>
          )}

          {/* ── Top bar ───────────────────────────────────────────────── */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-8 bg-gradient-to-b from-black/85 to-transparent transition-all duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <div className="flex flex-col min-w-0 mr-3">
              <p className="text-white/90 font-semibold text-sm md:text-base truncate leading-tight">{title}</p>
              <span className="text-cyan-400/70 text-[10px] font-medium tracking-wide">AGJ Cinema</span>
            </div>
            <div className="w-10 h-10 flex-shrink-0" />{/* close btn moved outside */}
          </div>

          {/* ── ESC hint ──────────────────────────────────────────────── */}
          {showEscHint && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 text-white/35 text-xs pointer-events-none select-none">
              اضغط ESC للإغلاق
            </div>
          )}

          {/* ── Controls overlay ──────────────────────────────────────── */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {/* Progress bar */}
            <div
              className="group px-3 pb-1 cursor-pointer"
              onClick={handleProgressClick}
              onMouseMove={handleProgressMove}
              onMouseLeave={() => setHoverPct(null)}
            >
              <div className="relative h-[3px] group-hover:h-[6px] sm:h-[4px] sm:group-hover:h-[7px] transition-all duration-150 rounded-full bg-white/20">
                {/* buffered */}
                <div
                  className="absolute inset-0 rounded-full bg-white/35"
                  style={{ width: `${Math.min(progress + 10, 100)}%` }}
                />
                {/* watched */}
                <div
                  className="absolute inset-0 rounded-full bg-cyan-400 transition-[width] duration-1000"
                  style={{ width: `${progress}%` }}
                />
                {/* thumb */}
                <div
                  className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, transform: "translate(-50%,-50%)" }}
                />
                {/* hover tooltip */}
                {hoverPct !== null && (
                  <div
                    className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap"
                    style={{ left: `${hoverPct * 100}%`, transform: "translateX(-50%)" }}
                  >
                    {fmt(hoverPct * DURATION)}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 pb-3 pt-1 bg-gradient-to-t from-black/85 to-transparent">

              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-10 h-10 flex items-center justify-center text-white hover:scale-110 transition-transform flex-shrink-0"
              >
                {isPlaying
                  ? <Pause className="w-6 h-6 fill-white" />
                  : <Play  className="w-6 h-6 fill-white ml-0.5" />}
              </button>

              {/* Skip back */}
              <button
                onClick={(e) => { e.stopPropagation(); skipBy(-10); }}
                aria-label="Back 10 seconds"
                className="w-8 h-8 flex items-center justify-center text-white/75 hover:text-white hover:scale-110 transition-all flex-shrink-0"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Skip forward */}
              <button
                onClick={(e) => { e.stopPropagation(); skipBy(10); }}
                aria-label="Forward 10 seconds"
                className="w-8 h-8 flex items-center justify-center text-white/75 hover:text-white hover:scale-110 transition-all flex-shrink-0"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
                  aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  className="w-8 h-8 flex items-center justify-center text-white/75 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0
                    ? <VolumeX className="w-5 h-5" />
                    : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range" min={0} max={100} value={isMuted ? 0 : volume}
                  onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Volume"
                  className="hidden sm:block w-20 accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="flex-1" />

              {/* Time */}
              <div className="text-white/80 text-[11px] sm:text-sm font-mono select-none flex-shrink-0">
                {fmt(currentTime)} / {fmt(DURATION)}
              </div>

              <div className="flex-1" />

              {/* Subtitles */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); setSettingsTab("subtitles"); }}
                aria-label="Subtitles"
                className={`w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0 ${subtitleLang !== "off" ? "text-cyan-400" : "text-white/70 hover:text-white"}`}
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Settings */}
              <div className="relative flex-shrink-0" ref={settingsPanelRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSettings((s) => !s); setSettingsTab(null); }}
                  aria-label="Settings"
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${showSettings ? "text-cyan-400" : "text-white/70 hover:text-white"}`}
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showSettings && (
                  <>
                    {/* click-outside backdrop */}
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 1 }}
                      onClick={(e) => { e.stopPropagation(); setShowSettings(false); setSettingsTab(null); }}
                    />
                    {/* panel */}
                    <div
                      className="absolute bottom-10 right-0 w-[220px] bg-[#181818]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
                      style={{ zIndex: 2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {settingsTab === null && (
                        <div className="p-2">
                          <p className="text-white/30 text-[10px] px-3 pt-2 pb-1 uppercase tracking-widest">Settings</p>
                          {[
                            { key: "speed",     label: "Speed",     val: playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x` },
                            { key: "quality",   label: "Quality",   val: quality },
                            { key: "subtitles", label: "Subtitles", val: subtitleLang === "ar" ? "Arabic" : subtitleLang === "en" ? "English" : "Off" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              onClick={() => setSettingsTab(item.key as SettingsTab)}
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/8 rounded-lg transition-colors text-sm"
                            >
                              <span className="text-white/80">{item.label}</span>
                              <span className="text-cyan-400 text-xs font-medium">{item.val}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {settingsTab === "speed" && (
                        <div className="p-2">
                          <button onClick={() => setSettingsTab(null)} className="text-white/40 hover:text-white text-xs px-3 py-1.5 mb-1 transition-colors">← Back</button>
                          {SPEEDS.map((s) => (
                            <button key={s}
                              onClick={() => { setPlaybackSpeed(s); setSettingsTab(null); setShowSettings(false); }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${playbackSpeed === s ? "text-cyan-400 bg-cyan-400/10 font-semibold" : "text-white/80 hover:bg-white/8"}`}
                            >
                              {s === 1 ? "Normal" : `${s}x`}
                            </button>
                          ))}
                        </div>
                      )}

                      {settingsTab === "quality" && (
                        <div className="p-2">
                          <button onClick={() => setSettingsTab(null)} className="text-white/40 hover:text-white text-xs px-3 py-1.5 mb-1 transition-colors">← Back</button>
                          {QUALITIES.map((q) => (
                            <button key={q}
                              onClick={() => { setQuality(q); setSettingsTab(null); setShowSettings(false); }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${quality === q ? "text-cyan-400 bg-cyan-400/10 font-semibold" : "text-white/80 hover:bg-white/8"}`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}

                      {settingsTab === "subtitles" && (
                        <div className="p-2">
                          <button onClick={() => setSettingsTab(null)} className="text-white/40 hover:text-white text-xs px-3 py-1.5 mb-1 transition-colors">← Back</button>
                          {(["ar", "en", "off"] as SubLang[]).map((lang) => (
                            <button key={lang}
                              onClick={() => changeSubtitle(lang)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${subtitleLang === lang ? "text-cyan-400 bg-cyan-400/10 font-semibold" : "text-white/80 hover:bg-white/8"}`}
                            >
                              {lang === "ar" ? "Arabic 🇸🇦" : lang === "en" ? "English 🇬🇧" : "Off"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="w-8 h-8 flex items-center justify-center text-white/75 hover:text-white transition-colors flex-shrink-0"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        {/* end iframe wrapper */}

      </div>
      {/* end inner container */}

      {/* ── Resume modal ──────────────────────────────────────────────────── */}
      {showResume && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fadeIn">
            <div className="w-11 h-11 bg-cyan-400/15 rounded-full flex items-center justify-center mb-4">
              <Play className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-white font-bold text-lg mb-1">Continue Watching?</h2>
            <p className="text-white/55 text-sm mb-6">
              You were at <span className="text-cyan-400 font-semibold">{fmt(savedProgress)}</span>. Would you like to resume or start over?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResume(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Start Over
              </button>
              <button
                onClick={() => handleResume(true)}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report issue link ──────────────────────────────────────────────── */}
      <a
        href={`mailto:support@agjcinema.com?subject=Stream%20Issue%20-%20${encodeURIComponent(title)}&body=Movie%20ID%3A%20${movieId}%0ATime%3A%20${fmt(currentTime)}`}
        className={`absolute bottom-4 right-5 text-white/25 hover:text-white/60 hover:underline text-xs transition-all duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => e.stopPropagation()}
      >
        Report broken stream?
      </a>
    </div>
  );
}
