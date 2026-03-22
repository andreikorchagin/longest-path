import type { StateCreator } from "zustand";
import type { LngLat, ViewState } from "@/types/geo";

export interface MapSlice {
  viewState: ViewState;
  setViewState: (vs: ViewState) => void;

  startPoint: LngLat | null;
  endPoint: LngLat | null;
  setStartPoint: (p: LngLat | null) => void;
  setEndPoint: (p: LngLat | null) => void;

  placingMarker: "start" | "end" | null;
  setPlacingMarker: (m: "start" | "end" | null) => void;
}

export const createMapSlice: StateCreator<MapSlice> = (set) => ({
  viewState: {
    longitude: -74.01,
    latitude: 40.725,
    zoom: 14,
  },
  setViewState: (viewState) => set({ viewState }),

  startPoint: null,
  endPoint: null,
  setStartPoint: (startPoint) => set({ startPoint }),
  setEndPoint: (endPoint) => set({ endPoint }),

  placingMarker: "start",
  setPlacingMarker: (placingMarker) => set({ placingMarker }),
});
