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

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Precache all Vite-built assets ─────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Allowlist — these domains are NEVER blocked ────────────────────────────
const ALLOWED_DOMAINS = [
  "vaplayer.ru",
  "vidapi.ru",
  "api.themoviedb.org",
  "image.tmdb.org",
  "themoviedb.org",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "firebaseio.com",
  "firebaseapp.com",
  "googleapis.com",
];

// ── Ad / popup / tracking domain blocklist ─────────────────────────────────
const AD_DOMAINS = [
  // Google ad stack
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "pagead2.googlesyndication.com",
  "adservice.google.com",
  // Popup / popunder networks
  "popads.net",
  "popcash.net",
  "pop-cash.net",
  "popunder.ru",
  "propellerads.com",
  "monetag.com",
  "clickadu.com",
  "hilltopads.net",
  "adsterra.com",
  "trafficjunky.net",
  "trafficfactory.biz",
  "traffic-media.co",
  "adhaven.com",
  // Adult / video ad networks
  "exoclick.com",
  "juicyads.com",
  "ero-advertising.com",
  "trafficstars.com",
  "adskeeper.com",
  // Programmatic / DSP / SSP
  "adnxs.com",
  "appnexus.com",
  "rubiconproject.com",
  "openx.net",
  "pubmatic.com",
  "smartadserver.com",
  "adzerk.net",
  "amazon-adsystem.com",
  "criteo.com",
  "360yield.com",
  "bidvertiser.com",
  "clicksor.com",
  "adcash.com",
  "yllix.com",
  "valueclick.com",
  "advertising.com",
  // Analytics / tracking pixels
  "scorecardresearch.com",
  "moatads.com",
  "quantserve.com",
  "doubleverify.com",
  "integral-ads.com",
  "nexac.com",
  "hotjar.com",
  "mouseflow.com",
  "fullstory.com",
  // Native / content recommendation
  "taboola.com",
  "outbrain.com",
  "revcontent.com",
  "mgid.com",
  "contentad.net",
  // URL shorteners used for redirect traps
  "adf.ly",
  "ad.fly",
  "linkvertise.com",
  "lnkr.js.org",
];

// ── Query params used by redirect/popup mechanics ──────────────────────────
const REDIRECT_PARAMS = [
  "popup",
  "redirect_url",
  "redirect",
  "popunder",
  "pop",
  "clickthrough",
  "clickout",
  "bounce",
  "redir",
  "outclick",
];

// ── Helpers ────────────────────────────────────────────────────────────────
function isAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
}

function isBlocked(hostname: string): boolean {
  return AD_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
}

function stripRedirectParams(url: URL): URL | null {
  const dirty = REDIRECT_PARAMS.filter((p) => url.searchParams.has(p));
  if (dirty.length === 0) return null;
  const clean = new URL(url.toString());
  dirty.forEach((p) => clean.searchParams.delete(p));
  return clean;
}

// ── Empty 200 response (used to silence blocked requests) ──────────────────
function blocked(label: string): Response {
  console.log(`[AGJ-SW] Blocked ad request to: ${label}`);
  return new Response("", {
    status: 200,
    statusText: "Blocked by AGJ Cinema",
    headers: { "Content-Type": "text/plain" },
  });
}

// ── Ad-blocking route — registered FIRST so it wins over everything else ───
registerRoute(
  ({ url }) => !isAllowed(url.hostname) && isBlocked(url.hostname),
  async ({ url }) => blocked(url.hostname)
);

// ── Navigation blocker — stops popup windows from loading ──────────────────
// When a popup opens to an unknown external domain, intercept the navigation.
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    url.origin !== self.location.origin &&
    !isAllowed(url.hostname),
  async ({ url }) => {
    console.log(`[AGJ-SW] Blocked navigation/popup to: ${url.href}`);
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

// ── Redirect-param stripping ───────────────────────────────────────────────
// For requests that slip through the blocklist, strip known redirect params.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip: already handled by Workbox routes above, or allowed domains
  if (isAllowed(url.hostname) || isBlocked(url.hostname)) return;
  // Skip: same-origin requests (our own app assets)
  if (url.origin === self.location.origin) return;

  const cleaned = stripRedirectParams(url);
  if (cleaned) {
    console.log(
      `[AGJ-SW] Stripped redirect params from: ${url.hostname} → ${cleaned.pathname}`
    );
    event.respondWith(fetch(new Request(cleaned.toString(), event.request)));
  }
});

// ── Runtime caching ────────────────────────────────────────────────────────

// TMDB API — NetworkFirst (always try fresh, fall back to cache after 5s)
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
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// Google Fonts — StaleWhileRevalidate (serve instantly, refresh in background)
registerRoute(
  ({ url }) =>
    ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname),
  new StaleWhileRevalidate({
    cacheName: "google-fonts-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);
