import type { StateCreator } from "zustand";
import type { Route, RouteStats } from "@/types/route";
import type { StoreState } from "./index";
import { getDirections } from "@/lib/api/mapbox-directions";

export interface RouteSlice {
  routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null;
  routeStats: RouteStats | null;
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
  isGenerating: false,
  error: null,

  generateRoute: async () => {
    const { startPoint, endPoint } = get();

    if (!startPoint || !endPoint) {
      set({ error: "Set both start and end points" });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const data = await getDirections([startPoint, endPoint]);

      if (!data.routes || data.routes.length === 0) {
        set({ error: "No route found", isGenerating: false });
        return;
      }

      const route = data.routes[0];
      const distanceKm = route.distance / 1000;

      const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: route.geometry,
      };

      const routeStats: RouteStats = {
        distanceKm,
        distanceMi: distanceKm * 0.621371,
        durationMin: route.duration / 60,
      };

      set({ routeGeoJSON, routeStats, isGenerating: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Route generation failed",
        isGenerating: false,
      });
    }
  },

  clearRoute: () =>
    set({ routeGeoJSON: null, routeStats: null, error: null }),
});
