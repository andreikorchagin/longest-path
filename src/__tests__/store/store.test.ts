import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/store";

describe("Zustand store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useStore.setState({
      startPoint: null,
      endPoint: null,
      placingMarker: "start",
      routeGeoJSON: null,
      routeStats: null,
      discoveredFeatures: [],
      selectedWaypoints: [],
      isGenerating: false,
      progressStep: null,
      progressDetail: null,
      error: null,
      mode: "point-to-point",
      targetDistanceKm: 5,
      units: "mi",
    });
  });

  describe("map slice", () => {
    it("sets start point", () => {
      useStore.getState().setStartPoint([-74.01, 40.725]);
      expect(useStore.getState().startPoint).toEqual([-74.01, 40.725]);
    });

    it("sets end point", () => {
      useStore.getState().setEndPoint([-73.95, 40.78]);
      expect(useStore.getState().endPoint).toEqual([-73.95, 40.78]);
    });

    it("updates placing marker state", () => {
      expect(useStore.getState().placingMarker).toBe("start");
      useStore.getState().setPlacingMarker("end");
      expect(useStore.getState().placingMarker).toBe("end");
      useStore.getState().setPlacingMarker(null);
      expect(useStore.getState().placingMarker).toBeNull();
    });

    it("updates view state", () => {
      useStore.getState().setViewState({
        longitude: -73.95,
        latitude: 40.78,
        zoom: 16,
      });
      expect(useStore.getState().viewState.zoom).toBe(16);
    });
  });

  describe("settings slice", () => {
    it("defaults to point-to-point mode", () => {
      expect(useStore.getState().mode).toBe("point-to-point");
    });

    it("switches mode", () => {
      useStore.getState().setMode("loop");
      expect(useStore.getState().mode).toBe("loop");
    });

    it("sets target distance", () => {
      useStore.getState().setTargetDistance(10);
      expect(useStore.getState().targetDistanceKm).toBe(10);
    });

    it("toggles units", () => {
      expect(useStore.getState().units).toBe("mi");
      useStore.getState().setUnits("km");
      expect(useStore.getState().units).toBe("km");
    });
  });

  describe("route slice", () => {
    it("starts with no route", () => {
      expect(useStore.getState().routeGeoJSON).toBeNull();
      expect(useStore.getState().routeStats).toBeNull();
    });

    it("clears route state", () => {
      useStore.setState({
        routeGeoJSON: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [[-74.01, 40.725], [-73.95, 40.78]],
          },
        },
        routeStats: { distanceKm: 5, distanceMi: 3.1, durationMin: 50 },
        discoveredFeatures: [
          {
            id: "test",
            lngLat: [-74.0, 40.73] as [number, number],
            featureType: "pier" as const,
            score: 90,
            isDeadEnd: true,
          },
        ],
      });

      useStore.getState().clearRoute();

      expect(useStore.getState().routeGeoJSON).toBeNull();
      expect(useStore.getState().routeStats).toBeNull();
      expect(useStore.getState().discoveredFeatures).toHaveLength(0);
      expect(useStore.getState().selectedWaypoints).toHaveLength(0);
      expect(useStore.getState().error).toBeNull();
    });

    it("sets error when generating without start point", async () => {
      await useStore.getState().generateRoute();
      expect(useStore.getState().error).toBe("Set a start point");
    });

    it("sets error when generating P2P without end point", async () => {
      useStore.getState().setStartPoint([-74.01, 40.725]);
      await useStore.getState().generateRoute();
      expect(useStore.getState().error).toBe(
        "Set both start and end points"
      );
    });
  });
});
