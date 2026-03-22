import { describe, it, expect } from "vitest";
import { sampleWaypointsFromPaths } from "@/lib/algorithm/path-sampler";
import type { PathGeometry } from "@/lib/algorithm/overpass-query";
import type { LngLat } from "@/types/geo";

const start: LngLat = [-74.01, 40.72];
const end: LngLat = [-74.01, 40.74];

function makeRunningPath(
  id: string,
  coords: LngLat[],
  name?: string
): PathGeometry {
  return {
    id: `way-${id}`,
    type: "running_path",
    name,
    coordinates: coords,
    tags: { highway: "footway", ...(name ? { name } : {}) },
  };
}

function makePier(id: string, coords: LngLat[], name?: string): PathGeometry {
  return {
    id: `way-${id}`,
    type: "pier",
    name,
    coordinates: coords,
    tags: { man_made: "pier", ...(name ? { name } : {}) },
  };
}

function makeWaterfront(id: string, coords: LngLat[]): PathGeometry {
  return {
    id: `way-${id}`,
    type: "waterfront",
    coordinates: coords,
    tags: { natural: "coastline" },
  };
}

describe("sampleWaypointsFromPaths", () => {
  it("samples waypoints along a running path", () => {
    const paths: PathGeometry[] = [
      makeRunningPath(
        "1",
        [
          [-74.01, 40.725],
          [-74.01, 40.73],
          [-74.01, 40.735],
        ],
        "Hudson River Greenway"
      ),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    expect(waypoints.length).toBeGreaterThan(0);
    expect(waypoints[0].featureType).toBe("footway");
  });

  it("uses pier tips as dead-end waypoints", () => {
    const paths: PathGeometry[] = [
      makePier("1", [
        [-74.01, 40.73],  // base
        [-74.015, 40.73], // tip
      ], "Pier 40"),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    const piers = waypoints.filter((w) => w.isDeadEnd);
    expect(piers.length).toBeGreaterThan(0);
    expect(piers[0].featureType).toBe("pier");
    expect(piers[0].name).toBe("Pier 40");
  });

  it("scores named paths higher than unnamed ones", () => {
    const paths: PathGeometry[] = [
      makeRunningPath(
        "named",
        [
          [-74.009, 40.725],
          [-74.009, 40.735],
        ],
        "Hudson River Greenway"
      ),
      makeRunningPath("unnamed", [
        [-74.008, 40.725],
        [-74.008, 40.735],
      ]),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    const named = waypoints.filter((w) => w.name);
    const unnamed = waypoints.filter((w) => !w.name);

    if (named.length > 0 && unnamed.length > 0) {
      expect(named[0].score).toBeGreaterThan(unnamed[0].score);
    }
  });

  it("scores paths near water higher", () => {
    const waterfront = makeWaterfront("water", [
      [-74.015, 40.725],
      [-74.015, 40.735],
    ]);

    // Path near water
    const nearWater = makeRunningPath("near", [
      [-74.014, 40.725],
      [-74.014, 40.735],
    ]);

    // Path far from water
    const farFromWater = makeRunningPath("far", [
      [-74.005, 40.725],
      [-74.005, 40.735],
    ]);

    const waypointsNear = sampleWaypointsFromPaths(
      [waterfront, nearWater],
      start,
      end
    );
    const waypointsFar = sampleWaypointsFromPaths(
      [waterfront, farFromWater],
      start,
      end
    );

    const nearScore = waypointsNear.find((w) => w.id.includes("near"))?.score;
    const farScore = waypointsFar.find((w) => w.id.includes("far"))?.score;

    if (nearScore !== undefined && farScore !== undefined) {
      expect(nearScore).toBeGreaterThan(farScore);
    }
  });

  it("skips very short paths", () => {
    const paths: PathGeometry[] = [
      makeRunningPath("short", [
        [-74.01, 40.73],
        [-74.01, 40.73005], // ~5m, too short
      ]),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    expect(waypoints).toHaveLength(0);
  });

  it("skips waterfront elements (not runnable)", () => {
    const paths: PathGeometry[] = [
      makeWaterfront("coast", [
        [-74.015, 40.725],
        [-74.015, 40.735],
      ]),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    expect(waypoints).toHaveLength(0);
  });

  it("does not exceed maxWaypoints", () => {
    // Create many long paths
    const paths: PathGeometry[] = [];
    for (let i = 0; i < 20; i++) {
      const lng = -74.01 + i * 0.002;
      paths.push(
        makeRunningPath(
          `p${i}`,
          [
            [lng, 40.72],
            [lng, 40.725],
            [lng, 40.73],
            [lng, 40.735],
            [lng, 40.74],
          ],
          `Path ${i}`
        )
      );
    }

    const waypoints = sampleWaypointsFromPaths(paths, start, end, 10);
    expect(waypoints.length).toBeLessThanOrEqual(10);
  });

  it("removes waypoints too close to start or end", () => {
    const paths: PathGeometry[] = [
      makeRunningPath("edge", [
        [-74.01, 40.72],    // Same as start
        [-74.01, 40.725],
        [-74.01, 40.74],    // Same as end
      ]),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    for (const wp of waypoints) {
      // None should be exactly at start or end
      expect(wp.lngLat).not.toEqual(start);
      expect(wp.lngLat).not.toEqual(end);
    }
  });
});
