import type { StateCreator } from "zustand";
import type { RoutingMode } from "@/lib/algorithm/types";

export interface SettingsSlice {
  mode: RoutingMode;
  targetDistanceKm: number;
  units: "km" | "mi";

  setMode: (m: RoutingMode) => void;
  setTargetDistance: (d: number) => void;
  setUnits: (u: "km" | "mi") => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  mode: "point-to-point",
  targetDistanceKm: 5,
  units: "mi",

  setMode: (mode) => set({ mode }),
  setTargetDistance: (targetDistanceKm) => set({ targetDistanceKm }),
  setUnits: (units) => set({ units }),
});
