import { FormEvent, ReactElement, useState } from "react";
import type { Map } from "maplibre-gl";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";

import { Place, searchPlaces } from "../map/search";

export default function SearchBox({ map }: { map: Map }): ReactElement {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Searches only on submit: Nominatim forbids search-as-you-type.
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim() || searching) {
      return;
    }
    setSearching(true);
    setMessage(null);
    setResults(null);
    try {
      const places = await searchPlaces(query, map.getBounds());
      if (places.length === 0) {
        setMessage("No places found.");
      } else {
        setResults(places);
      }
    } catch {
      setMessage(
        navigator.onLine
          ? "Search failed. Try again."
          : "Search needs a signal.",
      );
    } finally {
      setSearching(false);
    }
  }

  function go(place: Place) {
    const [west, south, east, north] = place.bounds;
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 40, maxZoom: 16 },
    );
    setResults(null);
  }

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 10,
        left: 10,
        // Leave room for the zoom and location controls on the right.
        right: 56,
        // Results cover the Save area button below.
        zIndex: 2,
      }}
    >
      <form onSubmit={submit} style={{ display: "flex" }} role="search">
        <InputBase
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search places"
          inputProps={{ "aria-label": "Search places", enterKeyHint: "search" }}
          sx={{ flex: 1, pl: 1.5 }}
        />
        <IconButton type="submit" aria-label="Search" disabled={searching}>
          <SearchIcon />
        </IconButton>
      </form>
      {message && (
        <Typography variant="body2" sx={{ px: 1.5, pb: 1 }}>
          {message}
        </Typography>
      )}
      {results && (
        <List dense disablePadding>
          {results.map((place) => (
            <ListItemButton key={place.id} onClick={() => go(place)}>
              <ListItemText primary={place.name} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
