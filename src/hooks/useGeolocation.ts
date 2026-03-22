"use client";

import { useState, useCallback } from "react";
import type { LngLat } from "@/types/geo";

interface GeolocationState {
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
  });

  const getCurrentPosition = useCallback((): Promise<LngLat> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation not supported";
        setState({ loading: false, error: err });
        reject(new Error(err));
        return;
      }

      setState({ loading: true, error: null });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({ loading: false, error: null });
          resolve([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Location access denied"
              : "Could not get location";
          setState({ loading: false, error: msg });
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { ...state, getCurrentPosition };
}
