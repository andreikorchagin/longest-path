import type { StateCreator } from "zustand";
import type { RouteStats } from "@/types/route";
import type { StrategicWaypoint, ProgressStep } from "@/lib/algorithm/types";
import type { StoreState } from "./index";
import { generatePointToPointRoute } from "@/lib/algorithm/route-pipeline";
import { generateLoopRoute } from "@/lib/algorithm/loop-generator";

export interface RouteSlice {
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null;
  routeStats: RouteStats | null;
  strategicWaypoints: StrategicWaypoint[];
  usedBareRoute: boolean;
  isGenerating: boolean;
  progressStep: ProgressStep | null;
  progressDetail: string | null;
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
  strategicWaypoints: [],
  usedBareRoute: false,
  isGenerating: false,
  progressStep: null,
  progressDetail: null,
  error: null,

  generateRoute: async () => {
    const { startPoint, endPoint, mode, targetDistanceKm, paceMinPerMile } = get();

    if (!startPoint) {
      set({ error: "Set a start point" });
      return;
    }

    if (mode === "point-to-point" && !endPoint) {
      set({ error: "Set both start and end points" });
      return;
    }

    set({ isGenerating: true, error: null, progressStep: null });

    const onProgress = (step: ProgressStep, detail?: string) => {
      set({ progressStep: step, progressDetail: detail || null });
    };

    try {
      const result =
        mode === "loop"
          ? await generateLoopRoute(startPoint, targetDistanceKm, paceMinPerMile, onProgress)
          : await generatePointToPointRoute(startPoint, endPoint!, paceMinPerMile, onProgress);

      set({
        routeGeoJSON: result.route.geometry,
        routeStats: result.route.stats,
        strategicWaypoints: result.strategicWaypoints,
        usedBareRoute: result.usedBareRoute,
        isGenerating: false,
        progressStep: null,
        progressDetail: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Route generation failed",
        isGenerating: false,
        progressStep: null,
        progressDetail: null,
      });
    }
  },

  clearRoute: () =>
    set({
      routeGeoJSON: null,
      routeStats: null,
      strategicWaypoints: [],
      usedBareRoute: false,
      error: null,
      progressStep: null,
      progressDetail: null,
    }),
});
