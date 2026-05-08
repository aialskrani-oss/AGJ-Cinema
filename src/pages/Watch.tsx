import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Subtitles } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import { useMovieDetails } from "../hooks/useTmdb";

type SubLang = "ar" | "en" | "off";

const BASE  = import.meta.env.VITE_STREAM_BASE_URL as string;
const COLOR = import.meta.env.VITE_STREAM_PRIMARY_COLOR as string;
const LANG  = import.meta.env.VITE_STREAM_DEFAULT_LANG as string;

function buildSrc(isTV: boolean, id: string, season: string, episode: string, sub: SubLang) {
  const base = isTV ? BASE.replace("/movie/", "/tv/") : BASE;
  let url    = isTV ? `${base}${id}/${season}/${episode}` : `${base}${id}`;
  url += `?primaryColor=${COLOR}&lang=${LANG}`;
  if (sub === "ar") url += "&ds_lang=ar&sub_lang=ar";
  if (sub === "en") url += "&ds_lang=en&sub_lang=en";
  return url;
}

function goBack(navigate: (to: string) => void) {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate("/");
  }
}

export default function Watch() {
  const [location, navigate] = useLocation();
  const params = useParams<{ id: string; season?: string; episode?: string }>();

  const isTV    = location.startsWith("/watch/tv/");
  const id      = params.id ?? "";
  const season  = params.season ?? "1";
  const episode = params.episode ?? "1";

  const [sub,       setSub]       = useState<SubLang>("ar");
  const [iframeKey, setIframeKey] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [showBar,   setShowBar]   = useState(true);
  const [showMenu,  setShowMenu]  = useState(false);
  const hideTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origOpen                  = useRef<typeof window.open>(window.open);
  const startTime                 = useRef<number>(Date.now());

  const { addToWatchlist } = useFavorites();
  const { data: movieData } = useMovieDetails(!isTV ? Number(id) : 0);

  useEffect(() => {
    const title = isTV ? "Watch TV Show — AGJ Cinema" : "Watch Movie — AGJ Cinema";
    document.title = title;
    return () => { document.title = "AGJ Cinema"; };
  }, [isTV]);

  useEffect(() => {
    if (isTV || !id) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      if (elapsed < 30) return;
      if (movieData) addToWatchlist(movieData, elapsed);
    }, 30000);
    return () => {
      clearInterval(interval);
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      if (elapsed > 30 && movieData) addToWatchlist(movieData, elapsed);
    };
  }, [isTV, id, movieData, addToWatchlist]);

  useEffect(() => {
    origOpen.current = window.open;
    window.open = () => { console.log("[AGJ] popup blocked"); return null; };
    return () => { window.open = origOpen.current; };
  }, []);

  function resetHide() {
    setShowBar(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowBar(false), 4000);
  }

  useEffect(() => {
    resetHide();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeSub(lang: SubLang) {
    setSub(lang);
    setIframeKey(k => k + 1);
    setLoading(true);
    setShowMenu(false);
    resetHide();
  }

  const src      = buildSrc(isTV, id, season, episode, sub);
  const subLabel = sub === "ar" ? "🇸🇦 عربي" : sub === "en" ? "🇬🇧 English" : "⊘ Off";

  return (
    <div
      className="fixed inset-0 bg-black"
      onMouseMove={resetHide}
      onTouchStart={resetHide}
      onClick={() => { if (showMenu) setShowMenu(false); }}
    >
      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3
          bg-gradient-to-b from-black/80 to-transparent
          transition-opacity duration-500 ${showBar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={() => goBack(navigate)}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          رجوع
        </button>

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
            <div className="absolute top-10 right-0 z-60 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden w-40 animate-fadeIn">
              {(["ar", "en", "off"] as SubLang[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => changeSub(lang)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sub === lang
                      ? "text-cyan-400 bg-cyan-400/10 font-semibold"
                      : "text-white/80 hover:bg-white/8"
                  }`}
                >
                  {lang === "ar" ? "🇸🇦 عربي" : lang === "en" ? "🇬🇧 English" : "⊘ إيقاف"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-3">
          <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">جاري التحميل…</p>
        </div>
      )}

      <iframe
        key={iframeKey}
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onLoad={() => setLoading(false)}
        title="Video Player"
      />
    </div>
  );
}
