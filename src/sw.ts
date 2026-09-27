/// <reference lib="webworker" />
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (PrecacheEntry | string)[];
};

const OPENFREEMAP = "https://tiles.openfreemap.org";

self.skipWaiting();
clientsClaim();

// The app itself (HTML, JS, CSS, icons), so it opens with no signal.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

const okOnly = new CacheableResponsePlugin({ statuses: [200] });

// OpenFreeMap's TileJSON points at a new tile version about weekly, so prefer the network,
// but give up quickly on a weak signal and use the saved copy.
registerRoute(
  ({ url }) => url.origin === OPENFREEMAP && url.pathname === "/planet",
  new NetworkFirst({
    cacheName: "map-assets",
    networkTimeoutSeconds: 3,
    plugins: [okOnly],
  }),
);

// OpenFreeMap tiles. Their URLs include a version (/planet/<version>/z/x/y.pbf); store them under a
// version-less key so saved tiles still match after OpenFreeMap publishes a new version.
registerRoute(
  ({ url }) =>
    url.origin === OPENFREEMAP &&
    url.pathname.startsWith("/planet/") &&
    url.pathname.endsWith(".pbf"),
  new StaleWhileRevalidate({
    cacheName: "offline-tiles",
    plugins: [
      okOnly,
      {
        cacheKeyWillBeUsed: async ({ request }) =>
          request.url.replace(/\/planet\/[^/]+\//, "/planet/"),
      },
    ],
  }),
);

// The style, its icons, and its label fonts. Without these the map can't draw at all offline.
// The OpenGIS extras (wider-zoom trails, contours, hillshade) are deliberately not cached here.
registerRoute(
  ({ url }) =>
    url.origin === "https://cdn.jsdelivr.net" ||
    (url.origin === "https://www.ogis.org" &&
      (url.pathname.startsWith("/basemap/") ||
        url.pathname.startsWith("/outdoors/sprite"))),
  new StaleWhileRevalidate({ cacheName: "map-assets", plugins: [okOnly] }),
);
