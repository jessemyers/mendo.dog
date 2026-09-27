import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// False means no network at all (airplane mode, no signal). True only means a network is connected,
// not that the internet is reachable, so requests can still fail on a weak signal.
export default function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}
