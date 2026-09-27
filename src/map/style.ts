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

  return style;
}
