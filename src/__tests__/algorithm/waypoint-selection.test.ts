import { describe, it, expect } from "vitest";
import { selectWaypoints } from "@/lib/algorithm/waypoint-selection";
import type { ScoredWaypoint } from "@/lib/algorithm/types";
import type { LngLat } from "@/types/geo";

function makeWaypoint(
  overrides: Partial<ScoredWaypoint> & { lngLat: LngLat }
): ScoredWaypoint {
  return {
    id: `wp-${Math.random()}`,
    featureType: "park",
    score: 50,
    isDeadEnd: false,
    ...overrides,
  };
}

describe("selectWaypoints", () => {
  const start: LngLat = [-74.01, 40.70];
  const end: LngLat = [-74.01, 40.75]; // Due north

  it("selects waypoints sorted by score", () => {
    const candidates: ScoredWaypoint[] = [
      makeWaypoint({ id: "low", lngLat: [-74.008, 40.72], score: 30 }),
      makeWaypoint({ id: "high", lngLat: [-74.009, 40.73], score: 90 }),
      makeWaypoint({ id: "mid", lngLat: [-74.007, 40.74], score: 60 }),
    ];

    const selected = selectWaypoints(candidates, start, end);

    expect(selected[0].id).toBe("high");
    expect(selected).toHaveLength(3);
  });

  it("rejects waypoints with angular deviation > 90 degrees", () => {
    const candidates: ScoredWaypoint[] = [
      // This is in the right direction (north)
      makeWaypoint({ id: "ok", lngLat: [-74.01, 40.73], score: 50 }),
      // This is behind (south of start)
      makeWaypoint({ id: "behind", lngLat: [-74.01, 40.68], score: 80 }),
    ];

    const selected = selectWaypoints(candidates, start, end);

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("ok");
  });

  it("allows dead-end features regardless of angular deviation", () => {
    const candidates: ScoredWaypoint[] = [
      // Pier behind the start (south), but dead-end so it should be allowed
      makeWaypoint({
        id: "pier-behind",
        lngLat: [-74.02, 40.69],
        score: 100,
        isDeadEnd: true,
        featureType: "pier",
      }),
    ];

    const selected = selectWaypoints(candidates, start, end);

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("pier-behind");
  });

  it("deduplicates waypoints within 200m of each other", () => {
    const candidates: ScoredWaypoint[] = [
      makeWaypoint({ id: "first", lngLat: [-74.01, 40.73], score: 90 }),
      // Very close to first (~10m)
      makeWaypoint({
        id: "duplicate",
        lngLat: [-74.0101, 40.7301],
        score: 80,
      }),
    ];

    const selected = selectWaypoints(candidates, start, end);

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("first");
  });

  it("skips waypoints too close to start or end", () => {
    const candidates: ScoredWaypoint[] = [
      // Right on top of start
      makeWaypoint({ id: "at-start", lngLat: [-74.01, 40.70], score: 90 }),
      // Right on top of end
      makeWaypoint({ id: "at-end", lngLat: [-74.01, 40.75], score: 90 }),
      // In between, should be selected
      makeWaypoint({ id: "middle", lngLat: [-74.01, 40.725], score: 50 }),
    ];

    const selected = selectWaypoints(candidates, start, end);

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("middle");
  });

  it("respects the 23 waypoint maximum", () => {
    const candidates: ScoredWaypoint[] = [];
    // Create 30 waypoints spread along the route
    for (let i = 0; i < 30; i++) {
      candidates.push(
        makeWaypoint({
          id: `wp-${i}`,
          lngLat: [-74.01 + i * 0.003, 40.71 + i * 0.001],
          score: 50,
        })
      );
    }

    const selected = selectWaypoints(candidates, start, end);

    expect(selected.length).toBeLessThanOrEqual(23);
  });
});
