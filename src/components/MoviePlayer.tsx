import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Subtitles } from "lucide-react";

type SubLang = "ar" | "en" | "off";

const STREAM_BASE  = (import.meta.env.VITE_STREAM_BASE_URL  as string | undefined) ?? "https://vidsrc.xyz/embed/movie/";
const STREAM_COLOR = (import.meta.env.VITE_STREAM_PRIMARY_COLOR as string | undefined) ?? "06b6d4";
const STREAM_LANG  = (import.meta.env.VITE_STREAM_DEFAULT_LANG  as string | undefined) ?? "en";

function buildSrc(
  isTV: boolean,
  id: number,
  season: number,
  episode: number,
  sub: SubLang
): string {
  const movieBase = STREAM_BASE.endsWith("/") ? STREAM_BASE : STREAM_BASE + "/";
  const tvBase    = movieBase.replace(/\/movie\//i, "/tv/");
  const base      = isTV ? tvBase : movieBase;

  let url = isTV
    ? `${base}${id}/${season}/${episode}`
    : `${base}${id}`;

  url += `?primaryColor=${STREAM_COLOR}&lang=${STREAM_LANG}`;
  if (sub === "ar") url += "&ds_lang=ar&sub_lang=ar";
  if (sub === "en") url += "&ds_lang=en&sub_lang=en";
  return url;
}

export interface MoviePlayerProps {
  /** TMDB movie or TV show id */
  movieId: number;
  /** Display title shown in loading state */
  title?: string;
  /** Set to true for TV show episodes */
  isTV?: boolean;
  season?: number;
  episode?: number;
  onClose: () => void;
}

export default function MoviePlayer({
  movieId,
  title = "",
  isTV  = false,
  season  = 1,
  episode = 1,
  onClose,
}: MoviePlayerProps) {
  const [sub,       setSub]      = useState<SubLang>("ar");
  const [iframeKey, setIframeKey] = useState(0);
  const [loading,   setLoading]  = useState(true);
  const [showMenu,  setShowMenu] = useState(false);
  const [showBar,   setShowBar]  = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll while player is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetHide = useCallback(() => {
    setShowBar(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowBar(false), 4000);
  }, []);

  useEffect(() => {
    resetHide();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHide]);

  function changeSub(lang: SubLang) {
    setSub(lang);
    setIframeKey(k => k + 1);
    setLoading(true);
    setShowMenu(false);
    resetHide();
  }

  const src      = buildSrc(isTV, movieId, season, episode, sub);
  const subLabel = sub === "ar" ? "🇸🇦 عربي" : sub === "en" ? "🇬🇧 English" : "⊘ Off";

  const player = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onMouseMove={resetHide}
      onTouchStart={resetHide}
      onClick={() => { if (showMenu) setShowMenu(false); }}
    >
      {/* ── Top control bar ─────────────────────────────────────────────── */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3
          bg-gradient-to-b from-black/80 to-transparent
          transition-opacity duration-500 ${showBar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close player"
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">إغلاق</span>
        </button>

        {/* Movie title */}
        {title && (
          <p className="text-white/70 text-sm font-semibold truncate max-w-[200px] md:max-w-md">
            {title}
          </p>
        )}

        {/* Subtitle language selector */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              sub !== "off"
                ? "bg-cyan-400/20 border-cyan-400/60 text-cyan-400"
                : "bg-white/10 border-white/20 text-white/70 hover:text-white"
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span className="hidden sm:inline">{subLabel}</span>
          </button>

          {showMenu && (
            <div className="absolute top-10 right-0 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden w-40 animate-fadeIn">
              {(["ar", "en", "off"] as SubLang[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => changeSub(lang)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sub === lang
                      ? "text-cyan-400 bg-cyan-400/10 font-semibold"
                      : "text-white/80 hover:bg-white/[0.08]"
                  }`}
                >
                  {lang === "ar" ? "🇸🇦 عربي" : lang === "en" ? "🇬🇧 English" : "⊘ إيقاف"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading overlay ──────────────────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-black gap-3 pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
          {title && <p className="text-white/40 text-sm truncate max-w-xs">{title}</p>}
        </div>
      )}

      {/* ── Player iframe ────────────────────────────────────────────────── */}
      <iframe
        key={iframeKey}
        src={src}
        className="w-full flex-1 border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoading(false)}
        title={title || "Video Player"}
      />
    </div>
  );

  return createPortal(player, document.body);
}
