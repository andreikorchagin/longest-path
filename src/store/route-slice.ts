import type { StateCreator } from "zustand";
import type { RouteStats } from "@/types/route";
import type { ScoredWaypoint } from "@/lib/algorithm/types";
import type { StoreState } from "./index";
import { generatePointToPointRoute } from "@/lib/algorithm/route-pipeline";
import { generateLoopRoute } from "@/lib/algorithm/loop-generator";

export interface RouteSlice {
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null;
  routeStats: RouteStats | null;
  discoveredFeatures: ScoredWaypoint[];
  selectedWaypoints: ScoredWaypoint[];
  isGenerating: boolean;
  error: string | null;

  generateRoute: () => Promise<void>;
  clearRoute: () => void;
}

export const createRouteSlice: StateCreator<StoreState, [], [], RouteSlice> = (
  set,
  get
) => ({
  routeGeoJSON: null,
  routeStats: null,
  discoveredFeatures: [],
  selectedWaypoints: [],
  isGenerating: false,
  error: null,

  generateRoute: async () => {
    const { startPoint, endPoint, mode, targetDistanceKm } = get();

    if (!startPoint) {
      set({ error: "Set a start point" });
      return;
    }

    if (mode === "point-to-point" && !endPoint) {
      set({ error: "Set both start and end points" });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const result =
        mode === "loop"
          ? await generateLoopRoute(startPoint, targetDistanceKm)
          : await generatePointToPointRoute(startPoint, endPoint!);

      set({
        routeGeoJSON: result.route.geometry,
        routeStats: result.route.stats,
        discoveredFeatures: result.discoveredFeatures,
        selectedWaypoints: result.selectedWaypoints,
        isGenerating: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Route generation failed",
        isGenerating: false,
      });
    }
  },

  clearRoute: () =>
    set({
      routeGeoJSON: null,
      routeStats: null,
      discoveredFeatures: [],
      selectedWaypoints: [],
      error: null,
    }),
});
