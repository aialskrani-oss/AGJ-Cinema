import { useEffect, useRef, useState, useCallback } from "react";
import { X, Subtitles } from "lucide-react";

type SubLang = "ar" | "en" | "off";

interface MoviePlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  movieId: number;
  movie?: import("../api/tmdb").Movie;
  resumeProgress?: number;
}

function buildSrc(base: string, lang: SubLang): string {
  let u = base
    .replace(/&?ds_lang=[^&]*/g, "")
    .replace(/&?sub_lang=[^&]*/g, "");
  if (lang === "ar") u += "&ds_lang=ar&sub_lang=ar";
  else if (lang === "en") u += "&ds_lang=en&sub_lang=en";
  return u;
}

export default function MoviePlayer({ url, title, onClose }: MoviePlayerProps) {
  const onCloseRef    = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const [visible,      setVisible]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [subtitleLang, setSubtitleLang] = useState<SubLang>("ar");
  const [iframeKey,    setIframeKey]    = useState(0);
  const [src,          setSrc]          = useState(() => buildSrc(url, "ar"));
  const [showSubMenu,  setShowSubMenu]  = useState(false);
  const origOpenRef                     = useRef<typeof window.open | null>(null);

  // Fade in
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Lock scroll + block popups + back-button close
  useEffect(() => {
    document.body.style.overflow = "hidden";

    origOpenRef.current = window.open;
    window.open = (..._a) => { console.log("[AGJ] popup blocked"); return null; };

    window.history.pushState({ player: true }, "");
    const onPop = () => onCloseRef.current();
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = "";
      if (origOpenRef.current) window.open = origOpenRef.current;
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  function changeSubtitle(lang: SubLang) {
    setSubtitleLang(lang);
    setSrc(buildSrc(url, lang));
    setIframeKey((k) => k + 1);
    setLoading(true);
    setShowSubMenu(false);
  }

  const subLabel = subtitleLang === "ar" ? "🇸🇦 عربي" : subtitleLang === "en" ? "🇬🇧 English" : "Off";

  if (!url) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center">
        <button onClick={handleClose} className="bg-cyan-500 text-black font-bold px-6 py-2.5 rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/98 flex flex-col transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-[60]">
        <p className="text-white/80 font-semibold text-sm truncate max-w-[60vw]">{title}</p>

        <div className="flex items-center gap-2">
          {/* Subtitle button */}
          <div className="relative">
            <button
              onClick={() => setShowSubMenu((s) => !s)}
              aria-label="Subtitles"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                subtitleLang !== "off"
                  ? "bg-cyan-400/20 border-cyan-400/60 text-cyan-400"
                  : "bg-white/10 border-white/20 text-white/70 hover:text-white"
              }`}
            >
              <Subtitles className="w-4 h-4" />
              <span className="hidden sm:inline">{subLabel}</span>
            </button>

            {showSubMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSubMenu(false)} />
                <div className="absolute top-10 right-0 z-20 bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden w-40 animate-fadeIn">
                  {(["ar", "en", "off"] as SubLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeSubtitle(lang)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        subtitleLang === lang
                          ? "text-cyan-400 bg-cyan-400/10 font-semibold"
                          : "text-white/80 hover:bg-white/8"
                      }`}
                    >
                      {lang === "ar" ? "🇸🇦 عربي" : lang === "en" ? "🇬🇧 English" : "⊘ Off"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close player"
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center shadow-xl transition-all ring-2 ring-red-500/30"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* ── Iframe ──────────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-white/40 text-sm">جاري التحميل…</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={src}
          title={title}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          loading="eager"
          onLoad={() => setLoading(false)}
        />

        {/* Edge shields — intercept stray popup-trigger clicks at iframe borders */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-0 right-0 h-16 pointer-events-auto" onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
          <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-auto" onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
          <div className="absolute top-16 bottom-10 left-0 w-8 pointer-events-auto"  onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
          <div className="absolute top-16 bottom-10 right-0 w-8 pointer-events-auto" onClick={(e) => e.stopPropagation()} style={{ background: "transparent" }} />
        </div>
      </div>
    </div>
  );
}
