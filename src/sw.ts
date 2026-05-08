/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

// ── Lifecycle ──────────────────────────────────────────────────────────────
self.skipWaiting();
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });

// ── Precache all Vite-built assets ─────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Allowlist ──────────────────────────────────────────────────────────────
const ALLOWED_DOMAINS = [
  "vaplayer.ru", "vidapi.ru", "vidsrc.xyz", "vidsrc.me",
  "api.themoviedb.org", "image.tmdb.org", "themoviedb.org",
  "fonts.googleapis.com", "fonts.gstatic.com",
];

// ── Ad domain blocklist ────────────────────────────────────────────────────
const AD_DOMAINS = [
  "doubleclick.net","googlesyndication.com","googleadservices.com",
  "pagead2.googlesyndication.com","adservice.google.com",
  "popads.net","popcash.net","pop-cash.net","popunder.ru",
  "propellerads.com","monetag.com","clickadu.com","hilltopads.net",
  "adsterra.com","trafficjunky.net","trafficfactory.biz","adhaven.com",
  "exoclick.com","juicyads.com","ero-advertising.com","trafficstars.com",
  "adskeeper.com","adnxs.com","appnexus.com","rubiconproject.com",
  "openx.net","pubmatic.com","smartadserver.com","adzerk.net",
  "amazon-adsystem.com","criteo.com","360yield.com","bidvertiser.com",
  "adcash.com","yllix.com","valueclick.com","advertising.com",
  "scorecardresearch.com","moatads.com","quantserve.com",
  "doubleverify.com","taboola.com","outbrain.com","mgid.com",
  "adf.ly","linkvertise.com",
];

const REDIRECT_PARAMS = ["popup","redirect_url","redirect","popunder","pop","clickthrough","bounce","redir"];

function isAllowed(h: string) { return ALLOWED_DOMAINS.some(d => h === d || h.endsWith("." + d)); }
function isBlocked(h: string) { return AD_DOMAINS.some(d => h === d || h.endsWith("." + d)); }

function blocked(label: string): Response {
  console.log(`[AGJ-SW] Blocked: ${label}`);
  return new Response("", { status: 200, statusText: "Blocked by AGJ Cinema", headers: { "Content-Type": "text/plain" } });
}

// ── Ad-blocking route ──────────────────────────────────────────────────────
registerRoute(
  ({ url }) => !isAllowed(url.hostname) && isBlocked(url.hostname),
  async ({ url }) => blocked(url.hostname)
);

// ── Navigation popup blocker ───────────────────────────────────────────────
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    url.origin !== self.location.origin &&
    !isAllowed(url.hostname),
  async ({ url }) => {
    console.log(`[AGJ-SW] Blocked popup: ${url.href}`);
    return new Response(
      `<!DOCTYPE html><html><head><title>Blocked</title>
       <style>body{background:#141414;color:#06b6d4;font-family:sans-serif;
       display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
       p{font-size:1.1rem;}</style></head>
       <body><p>🛡️ Popup blocked by AGJ Cinema</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
);

// ── Redirect param stripping ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (isAllowed(url.hostname) || isBlocked(url.hostname)) return;
  if (url.origin === self.location.origin) return;
  const dirty = REDIRECT_PARAMS.filter(p => url.searchParams.has(p));
  if (dirty.length > 0) {
    const clean = new URL(url.toString());
    dirty.forEach(p => clean.searchParams.delete(p));
    event.respondWith(fetch(new Request(clean.toString(), event.request)));
  }
});

// ── Runtime caching ────────────────────────────────────────────────────────

// TMDB via proxy (production) — NetworkFirst with 5-min cache
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/tmdb"),
  new NetworkFirst({
    cacheName: "tmdb-proxy-v1",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// TMDB API direct (development) — NetworkFirst
registerRoute(
  ({ url }) => url.hostname === "api.themoviedb.org",
  new NetworkFirst({
    cacheName: "tmdb-api-v1",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
);

// TMDB Images — CacheFirst (posters/backdrops rarely change)
registerRoute(
  ({ url }) => url.hostname === "image.tmdb.org",
  new CacheFirst({
    cacheName: "tmdb-images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Google Fonts — StaleWhileRevalidate
registerRoute(
  ({ url }) => ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname),
  new StaleWhileRevalidate({
    cacheName: "google-fonts-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);
