import type { StateCreator } from "zustand";
import type { RoutingMode } from "@/lib/algorithm/types";

export interface SettingsSlice {
  mode: RoutingMode;
  targetDistanceKm: number;
  units: "km" | "mi";
  paceMinPerMile: number; // Running pace in min/mile

  setMode: (m: RoutingMode) => void;
  setTargetDistance: (d: number) => void;
  setUnits: (u: "km" | "mi") => void;
  setPace: (p: number) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  mode: "point-to-point",
  targetDistanceKm: 5,
  units: "mi",
  paceMinPerMile: 9, // Default 9:00/mile

  setMode: (mode) => set({ mode }),
  setTargetDistance: (targetDistanceKm) => set({ targetDistanceKm }),
  setUnits: (units) => set({ units }),
  setPace: (paceMinPerMile) => set({ paceMinPerMile }),
});
