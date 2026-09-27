import { ReactElement, useState } from "react";
import type { Map } from "maplibre-gl";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";

import {
  canSaveOffline,
  estimateMegabytes,
  MAX_TILES,
  MAX_ZOOM,
  MIN_ZOOM,
  saveArea,
  tilesInBounds,
} from "../map/offline";

type Step =
  | { name: "closed" }
  | { name: "confirm"; tileCount: number }
  | { name: "too-big"; tileCount: number }
  | { name: "not-ready" }
  | { name: "saving"; done: number; total: number }
  | { name: "done"; failed: number };

export default function SaveAreaButton({ map }: { map: Map }): ReactElement {
  const [step, setStep] = useState<Step>({ name: "closed" });

  function open() {
    if (!canSaveOffline()) {
      setStep({ name: "not-ready" });
      return;
    }
    const tileCount = tilesInBounds(map.getBounds()).length;
    setStep(
      tileCount > MAX_TILES
        ? { name: "too-big", tileCount }
        : { name: "confirm", tileCount },
    );
  }

  async function save() {
    const tiles = tilesInBounds(map.getBounds());
    setStep({ name: "saving", done: 0, total: tiles.length });
    try {
      const { failed } = await saveArea(map, tiles, (done, total) =>
        setStep({ name: "saving", done, total }),
      );
      setStep({ name: "done", failed });
    } catch {
      setStep({ name: "done", failed: tiles.length });
    }
  }

  const close = () => setStep({ name: "closed" });

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<DownloadForOfflineIcon />}
        onClick={open}
        sx={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
      >
        Save area
      </Button>
      <Dialog
        open={step.name !== "closed"}
        onClose={step.name === "saving" ? undefined : close}
      >
        <DialogTitle>Save this area for offline</DialogTitle>
        <DialogContent>
          {step.name === "confirm" && (
            <DialogContentText>
              Saves the base map and trails for the visible area, zoom{" "}
              {MIN_ZOOM} to {MAX_ZOOM} and closer: {step.tileCount} tiles, about{" "}
              {estimateMegabytes(step.tileCount).toFixed(1)} MB. Contours,
              hillshade and zoomed-out trails need a signal.
            </DialogContentText>
          )}
          {step.name === "too-big" && (
            <DialogContentText>
              This area needs {step.tileCount} tiles. The limit is {MAX_TILES}.
              Zoom in and try again.
            </DialogContentText>
          )}
          {step.name === "not-ready" && (
            <DialogContentText>
              Offline saving isn't ready yet. Reload the page and try again.
            </DialogContentText>
          )}
          {step.name === "saving" && (
            <>
              <DialogContentText>
                Saving {step.done} of {step.total}…
              </DialogContentText>
              <LinearProgress
                variant="determinate"
                value={(step.done / step.total) * 100}
              />
            </>
          )}
          {step.name === "done" && (
            <DialogContentText>
              {step.failed === 0
                ? "Saved. This area will work without a signal."
                : `Done, but ${step.failed} downloads failed. Try again with a better signal.`}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          {step.name === "confirm" && (
            <>
              <Button onClick={close}>Cancel</Button>
              <Button variant="contained" onClick={save}>
                Save
              </Button>
            </>
          )}
          {(step.name === "too-big" ||
            step.name === "not-ready" ||
            step.name === "done") && <Button onClick={close}>OK</Button>}
        </DialogActions>
      </Dialog>
    </>
  );
}
