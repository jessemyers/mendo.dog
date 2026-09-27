import { ReactElement, useEffect, useRef, useState } from "react";
import {
  GeolocateControl,
  Map,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
// MapLibre loads its worker by URL; Vite has to bundle it (and its shared chunk) as a worker.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import SaveAreaButton from "../components/SaveAreaButton";
import { loadStyle } from "../map/style";

setWorkerUrl(workerUrl);

const MENDOCINO: [number, number] = [-123.7995, 39.3077];
// Zoom 14 is where the offline base tiles include every trail.
const START_ZOOM = 14;

export default function Home(): ReactElement {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: Map | null = null;

    loadStyle().then((style) => {
      if (cancelled || !mapContainer.current) {
        return;
      }
      created = new Map({
        attributionControl: { compact: true },
        center: MENDOCINO,
        container: mapContainer.current,
        style,
        zoom: START_ZOOM,
      });
      created.addControl(new NavigationControl());
      created.addControl(
        new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        }),
      );
      created.once("load", () => setMap(created));
    });

    // StrictMode runs effects twice in dev; tear down so only one map exists.
    return () => {
      cancelled = true;
      created?.remove();
      setMap(null);
    };
  }, []);

  return (
    <Container>
      <Box sx={{ position: "relative", m: 1 }}>
        <Box ref={mapContainer} sx={{ height: "90vh" }} />
        {map && <SaveAreaButton map={map} />}
      </Box>
    </Container>
  );
}
