import { useEffect, useRef, useState } from "react";
import { X, Subtitles } from "lucide-react";

type SubLang = "ar" | "en" | "off";

interface MoviePlayerProps {
  url: string;
  title: string;
  movieId: number;
  onClose: () => void;
}

export default function MoviePlayer({ url, title, onClose }: MoviePlayerProps) {
  const [sub, setSub] = useState<SubLang>("ar");
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  function buildUrl(base: string, s: SubLang) {
    let u = base;
    if (s === "ar") u += (u.includes("?") ? "&" : "?") + "ds_lang=ar&sub_lang=ar";
    if (s === "en") u += (u.includes("?") ? "&" : "?") + "ds_lang=en&sub_lang=en";
    return u;
  }

  function changeSub(lang: SubLang) {
    setSub(lang);
    setIframeKey(k => k + 1);
    setLoading(true);
    setShowMenu(false);
  }

  const origOpen = useRef<typeof window.open>(window.open);
  useEffect(() => {
    origOpen.current = window.open;
    window.open = () => null;
    return () => { window.open = origOpen.current; };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const subLabel = sub === "ar" ? "🇸🇦 عربي" : sub === "en" ? "🇬🇧 English" : "⊘ Off";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => showMenu && setShowMenu(false)}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <p className="text-white/80 text-sm font-semibold truncate max-w-xs">{title}</p>
        <div className="flex items-center gap-2">
          {/* Subtitle picker */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                sub !== "off"
                  ? "bg-cyan-400/20 border-cyan-400/60 text-cyan-400"
                  : "bg-white/10 border-white/20 text-white/70"
              }`}
            >
              <Subtitles className="w-4 h-4" />
              <span className="hidden sm:inline">{subLabel}</span>
            </button>
            {showMenu && (
              <div className="absolute top-10 right-0 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden w-40">
                {(["ar", "en", "off"] as SubLang[]).map(lang => (
                  <button key={lang} onClick={() => changeSub(lang)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sub === lang ? "text-cyan-400 bg-cyan-400/10 font-semibold" : "text-white/80 hover:bg-white/8"
                    }`}>
                    {lang === "ar" ? "🇸🇦 عربي" : lang === "en" ? "🇬🇧 English" : "⊘ إيقاف"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">جاري التحميل…</p>
        </div>
      )}

      {/* iframe */}
      <iframe
        key={iframeKey}
        src={buildUrl(url, sub)}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
