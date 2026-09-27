import type { LngLatBounds } from "maplibre-gl";

// Nominatim, OpenStreetMap's free place search. Policy (https://operations.osmfoundation.org/policies/nominatim/):
// at most 1 request per second, no search-as-you-type, show OpenStreetMap attribution (the map already does).
const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MIN_INTERVAL_MS = 1000;

export type Place = {
  id: number;
  name: string;
  // [west, south, east, north]
  bounds: [number, number, number, number];
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  // [south, north, west, east], as strings
  boundingbox: [string, string, string, string];
};

const cache = new Map<string, Place[]>();
let lastRequest = 0;

// Results near the current view rank higher, but places elsewhere are still found.
export async function searchPlaces(
  query: string,
  near: LngLatBounds,
): Promise<Place[]> {
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequest = Date.now();

  const params = new URLSearchParams({
    q: query.trim(),
    format: "jsonv2",
    limit: "5",
    viewbox: [
      near.getWest(),
      near.getNorth(),
      near.getEast(),
      near.getSouth(),
    ].join(","),
  });
  const response = await fetch(`${ENDPOINT}?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  const results = (await response.json()) as NominatimResult[];
  const places = results.map(
    ({ place_id, display_name, boundingbox: [s, n, w, e] }) => ({
      id: place_id,
      name: display_name,
      bounds: [Number(w), Number(s), Number(e), Number(n)] as Place["bounds"],
    }),
  );
  cache.set(key, places);
  return places;
}
