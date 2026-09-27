import type { LngLatBounds, Map, VectorTileSource } from "maplibre-gl";

import { BASE_SOURCE } from "./style";

// OpenFreeMap tiles stop at zoom 14 and contain every trail there; closer zooms reuse the zoom 14 tiles.
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 14;
export const MAX_TILES = 3000;

// Measured average for OpenFreeMap tiles around Mendocino (3.3 MB for 207 tiles).
const AVERAGE_TILE_BYTES = 16 * 1024;

// Unicode ranges needed for English labels, including curly quotes and dashes (8192-8447).
const GLYPH_RANGES = ["0-255", "256-511", "8192-8447"];

const PARALLEL_REQUESTS = 6;

type Tile = { z: number; x: number; y: number };

function lngToX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}

function latToY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z,
  );
}

export function tilesInBounds(bounds: LngLatBounds): Tile[] {
  const tiles: Tile[] = [];
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const last = 2 ** z - 1;
    const x0 = Math.max(0, lngToX(bounds.getWest(), z));
    const x1 = Math.min(last, lngToX(bounds.getEast(), z));
    const y0 = Math.max(0, latToY(bounds.getNorth(), z));
    const y1 = Math.min(last, latToY(bounds.getSouth(), z));
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

export function estimateMegabytes(tileCount: number): number {
  return (tileCount * AVERAGE_TILE_BYTES) / (1024 * 1024);
}

export function canSaveOffline(): boolean {
  return Boolean(navigator.serviceWorker?.controller);
}

function glyphUrls(map: Map): string[] {
  const style = map.getStyle();
  if (!style.glyphs) {
    return [];
  }
  const fontstacks = new Set<string>();
  for (const layer of style.layers) {
    const font =
      layer.type === "symbol" ? layer.layout?.["text-font"] : undefined;
    if (Array.isArray(font) && font.every((name) => typeof name === "string")) {
      fontstacks.add(font.join(","));
    }
  }
  return [...fontstacks].flatMap((fontstack) =>
    GLYPH_RANGES.map((range) =>
      style.glyphs!.replace("{fontstack}", fontstack).replace("{range}", range),
    ),
  );
}

function tileUrls(map: Map, tiles: Tile[]): string[] {
  const template = map.getSource<VectorTileSource>(BASE_SOURCE)?.tiles?.[0];
  if (!template) {
    throw new Error("Base map tiles are not loaded yet.");
  }
  return tiles.map(({ z, x, y }) =>
    template
      .replace("{z}", String(z))
      .replace("{x}", String(x))
      .replace("{y}", String(y)),
  );
}

// Fetches every base tile (and the label fonts) for the area. The service worker stores each response,
// so saving is just requesting everything once while online.
export async function saveArea(
  map: Map,
  tiles: Tile[],
  onProgress: (done: number, total: number) => void,
): Promise<{ failed: number }> {
  // Ask the browser not to evict saved tiles when storage runs low. Browsers may say no.
  await navigator.storage?.persist?.();

  const urls = [...glyphUrls(map), ...tileUrls(map, tiles)];
  let next = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      try {
        const response = await fetch(url);
        if (!response.ok) {
          failed++;
        }
      } catch {
        failed++;
      }
      onProgress(++done, urls.length);
    }
  }

  await Promise.all(Array.from({ length: PARALLEL_REQUESTS }, worker));
  return { failed };
}
