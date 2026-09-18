"use client";

import { useEffect, useState } from "react";

export type GeolocationState = {
  locating: boolean;
  lat: string;
  lng: string;
  denied: boolean;
};

/** Silently captures the browser's current GPS position on mount, wherever a form needs location context. */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(() => ({
    locating: typeof navigator !== "undefined" && !!navigator.geolocation,
    lat: "",
    lng: "",
    denied: false,
  }));

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          locating: false,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
          denied: false,
        });
      },
      (err) => {
        setState((s) => ({ ...s, locating: false, denied: err.code === err.PERMISSION_DENIED }));
      },
      { timeout: 8000 }
    );
  }, []);

  return state;
}
