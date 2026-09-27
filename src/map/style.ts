import type { StyleSpecification } from "maplibre-gl";

// OpenGIS "outdoors" style (https://github.com/OpenGIS/outdoors), pinned to a commit so it can't change
// underneath us. It is loaded at runtime instead of copied into this repo because the upstream repo has no license.
export const STYLE_URL =
  "https://cdn.jsdelivr.net/gh/OpenGIS/outdoors@fe161168b2a844fd8f8ddda5afbefeb8951cda73/style.json";

// Source id of the OpenFreeMap base tiles in the style. These are the only tiles saved for offline use.
export const BASE_SOURCE = "openmaptiles";

export async function loadStyle(): Promise<StyleSpecification> {
  const response = await fetch(STYLE_URL);
  if (!response.ok) {
    throw new Error(`Failed to load map style: ${response.status}`);
  }
  const style = (await response.json()) as StyleSpecification;

  // Drop satellite imagery and 3D terrain. Neither is used, and both add network requests on every view.
  style.layers = style.layers.filter(
    (layer) => !("source" in layer && layer.source === "esri-satellite"),
  );
  delete style.sources["esri-satellite"];
  delete style.terrain;

  tuneParkBoundaries(style);

  return style;
}

// Park and protected-area boundaries (state parks, reserves, state forests) are drawn as thick green lines with
// few labels, which is cluttered and hard to read. Make them thin and faint, and name each area along its line.
function tuneParkBoundaries(style: StyleSpecification) {
  // Both layers draw the same boundaries from zoom 14; keep one.
  style.layers = style.layers.filter(
    (layer) => layer.id !== "National park outline",
  );

  const index = style.layers.findIndex(
    (layer) => layer.id === "National parks",
  );
  const boundary = style.layers[index];
  if (boundary?.type !== "line") {
    return;
  }
  boundary.paint = {
    ...boundary.paint,
    "line-opacity": 0.6,
    "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 14, 1.2],
  };

  style.layers.splice(index + 1, 0, {
    id: "Park boundary labels",
    type: "symbol",
    source: BASE_SOURCE,
    "source-layer": "park",
    minzoom: 12,
    filter: ["==", ["geometry-type"], "Polygon"],
    layout: {
      "symbol-placement": "line",
      "symbol-spacing": 150,
      // Boundaries are jagged; the default (45) hides most labels.
      "text-max-angle": 90,
      "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
      "text-font": ["Open Sans Italic", "Noto Sans Italic"],
      "text-size": 10,
    },
    paint: {
      "text-color": "#3d5c28",
      "text-halo-color": "rgba(255, 255, 255, 0.8)",
      "text-halo-width": 1,
    },
  });
}
