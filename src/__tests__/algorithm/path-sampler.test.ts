import { describe, it, expect } from "vitest";
import { findStrategicWaypoints, findStrategicWaypointsForLoop } from "@/lib/algorithm/path-sampler";
import type { PathGeometry } from "@/lib/algorithm/overpass-query";
import type { LngLat } from "@/types/geo";

const start: LngLat = [-74.01, 40.72];
const end: LngLat = [-74.01, 40.74];

function makeLongPath(id: string, name?: string): PathGeometry {
  // ~2km path running north-south (aligned with travel)
  const coords: LngLat[] = [];
  for (let i = 0; i < 20; i++) {
    coords.push([-74.012, 40.72 + i * 0.001]);
  }
  return {
    id: `way-${id}`,
    type: "running_path",
    name,
    coordinates: coords,
    tags: { highway: "cycleway" },
  };
}

function makeShortPath(id: string): PathGeometry {
  return {
    id: `way-${id}`,
    type: "running_path",
    name: "Short Path",
    coordinates: [[-74.01, 40.73], [-74.01, 40.7305]], // ~50m
    tags: { highway: "footway" },
  };
}

function makeWaterfront(): PathGeometry {
  return {
    id: "water-1",
    type: "waterfront",
    coordinates: [[-74.015, 40.72], [-74.015, 40.74]],
    tags: { natural: "coastline" },
  };
}

describe("findStrategicWaypoints", () => {
  it("returns one midpoint waypoint for a long qualifying path", () => {
    const paths = [makeLongPath("1", "River Greenway")];
    const waypoints = findStrategicWaypoints(paths, start, end);

    expect(waypoints.length).toBe(1);
    expect(waypoints[0].pathName).toBe("River Greenway");
  });

  it("returns empty array when no paths qualify (too short)", () => {
    const paths = [makeShortPath("1")];
    const waypoints = findStrategicWaypoints(paths, start, end);

    expect(waypoints).toHaveLength(0);
  });

  it("returns empty array for waterfront-only paths (not runnable)", () => {
    const paths = [makeWaterfront()];
    const waypoints = findStrategicWaypoints(paths, start, end);

    expect(waypoints).toHaveLength(0);
  });

  it("returns max 3 waypoints even with many qualifying paths", () => {
    const paths = [];
    for (let i = 0; i < 10; i++) {
      const coords: LngLat[] = [];
      for (let j = 0; j < 20; j++) {
        coords.push([-74.01 + i * 0.005, 40.72 + j * 0.001]);
      }
      paths.push({
        id: `way-${i}`,
        type: "running_path" as const,
        name: `Path ${i}`,
        coordinates: coords,
        tags: { highway: "cycleway" },
      });
    }

    const waypoints = findStrategicWaypoints(paths, start, end);
    expect(waypoints.length).toBeLessThanOrEqual(3);
  });

  it("skips paths too far from the route", () => {
    const farPath: PathGeometry = {
      id: "way-far",
      type: "running_path",
      name: "Far Away Path",
      coordinates: Array.from({ length: 20 }, (_, i) => [
        -73.95, // Far east
        40.72 + i * 0.001,
      ] as LngLat),
      tags: { highway: "cycleway" },
    };

    const waypoints = findStrategicWaypoints([farPath], start, end);
    expect(waypoints).toHaveLength(0);
  });

  it("scores waterfront-adjacent paths higher", () => {
    const nearWater = makeLongPath("near", "Waterfront Path");
    // Move it close to the water
    nearWater.coordinates = nearWater.coordinates.map(([, lat]) => [-74.014, lat]);

    const inland = makeLongPath("inland", "Inland Path");
    inland.coordinates = inland.coordinates.map(([, lat]) => [-74.005, lat]);

    const water = makeWaterfront();

    const waypoints = findStrategicWaypoints(
      [nearWater, inland, water],
      start,
      end
    );

    if (waypoints.length >= 1) {
      expect(waypoints[0].pathName).toBe("Waterfront Path");
    }
  });
});

describe("findStrategicWaypointsForLoop", () => {
  it("returns one waypoint for a qualifying path", () => {
    const paths = [makeLongPath("1", "Loop Path")];
    const waypoints = findStrategicWaypointsForLoop(paths, start, 2000);

    expect(waypoints.length).toBeLessThanOrEqual(1);
  });

  it("returns empty when no paths in radius", () => {
    const farPath: PathGeometry = {
      id: "way-far",
      type: "running_path",
      name: "Far Path",
      coordinates: Array.from({ length: 20 }, (_, i) => [
        -73.90, 40.72 + i * 0.001,
      ] as LngLat),
      tags: { highway: "cycleway" },
    };

    const waypoints = findStrategicWaypointsForLoop([farPath], start, 500);
    expect(waypoints).toHaveLength(0);
  });
});
