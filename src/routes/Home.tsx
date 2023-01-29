import { ReactElement, useEffect, useRef, useState } from "react";
import { Map, NavigationControl } from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

export default function Home(): ReactElement {
  const mapContainer = useRef(null);
  const map = useRef<Map | null>(null);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [longitude, _setLongitude] = useState(-123.7995);
  const [latitude, _setLatitude] = useState(39.3077);
  const [zoom, _setZoom] = useState(13);
  const style = 'mapbox://styles/mapbox/outdoors-v12'; // mapbox://styles/mapbox/satellite-v9';
  /* eslint-enable @typescript-eslint/no-unused-vars */

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }
    if (map.current) {
      return;
    }

    const mapbox = new Map({
      accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
      attributionControl: false,
      center: [longitude, latitude],
      container: mapContainer.current,
      style,
      zoom: zoom,
    });
    mapbox.addControl(new NavigationControl());

    map.current = mapbox;
  });

  return (
    <Container>
      <Box ref={mapContainer} sx={{ height: 400 }} />
    </Container>
  );
}
