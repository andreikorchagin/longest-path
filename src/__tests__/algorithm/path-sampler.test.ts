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
  it("produces waypoints from a long named running path", () => {
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
      makePier(
        "1",
        [
          [-74.01, 40.73],
          [-74.015, 40.73],
        ],
        "Pier 40"
      ),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    const piers = waypoints.filter((w) => w.isDeadEnd);
    expect(piers.length).toBeGreaterThan(0);
    expect(piers[0].featureType).toBe("pier");
    expect(piers[0].name).toBe("Pier 40");
  });

  it("prefers waterfront paths over inland paths when both available", () => {
    const waterfront = makeWaterfront("water", [
      [-74.015, 40.725],
      [-74.015, 40.735],
    ]);

    // Long path near water
    const nearWater = makeRunningPath(
      "near",
      [
        [-74.014, 40.722],
        [-74.014, 40.726],
        [-74.014, 40.73],
        [-74.014, 40.734],
        [-74.014, 40.738],
      ],
      "Waterfront Path"
    );

    // Short path far from water
    const farFromWater = makeRunningPath("far", [
      [-74.005, 40.728],
      [-74.005, 40.732],
    ]);

    const waypoints = sampleWaypointsFromPaths(
      [waterfront, nearWater, farFromWater],
      start,
      end
    );

    // The near-water path should produce waypoints; the short far one shouldn't
    const nearWaypoints = waypoints.filter((w) => w.id.includes("near"));
    expect(nearWaypoints.length).toBeGreaterThan(0);
  });

  it("limits piers to MAX_PIERS (3)", () => {
    const piers: PathGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      piers.push(
        makePier(
          `pier-${i}`,
          [
            [-74.01, 40.722 + i * 0.003],
            [-74.015, 40.722 + i * 0.003],
          ],
          `Pier ${i}`
        )
      );
    }

    const waypoints = sampleWaypointsFromPaths(piers, start, end);
    const pierWaypoints = waypoints.filter((w) => w.isDeadEnd);
    expect(pierWaypoints.length).toBeLessThanOrEqual(3);
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

  it("produces fewer waypoints for simple routes (minimize turns)", () => {
    // Single long path — should produce just a few guidepoints, not dozens
    const longCoords: LngLat[] = [];
    for (let i = 0; i < 50; i++) {
      longCoords.push([-74.01, 40.72 + i * 0.0004]);
    }

    const paths: PathGeometry[] = [
      makeRunningPath("long", longCoords, "River Path"),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    // Should produce just a few guidepoints, not 50
    expect(waypoints.length).toBeLessThanOrEqual(8);
    expect(waypoints.length).toBeGreaterThan(0);
  });

  it("removes waypoints too close to start or end", () => {
    const paths: PathGeometry[] = [
      makeRunningPath(
        "edge",
        [
          [-74.01, 40.72], // Same as start
          [-74.01, 40.725],
          [-74.01, 40.73],
          [-74.01, 40.735],
          [-74.01, 40.74], // Same as end
        ],
        "Path"
      ),
    ];

    const waypoints = sampleWaypointsFromPaths(paths, start, end);
    for (const wp of waypoints) {
      expect(wp.lngLat).not.toEqual(start);
      expect(wp.lngLat).not.toEqual(end);
    }
  });
});
