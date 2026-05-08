/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
