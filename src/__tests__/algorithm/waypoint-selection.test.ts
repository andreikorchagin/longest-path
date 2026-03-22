import { describe, it, expect } from "vitest";
import { selectWaypoints } from "@/lib/algorithm/waypoint-selection";
import type { ScoredWaypoint } from "@/lib/algorithm/types";
import type { LngLat } from "@/types/geo";

// NOTE: This tests the legacy waypoint selection (still available as a utility).
// The primary algorithm now uses path-sampler.ts.

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

describe("selectWaypoints (legacy)", () => {
  const start: LngLat = [-74.01, 40.70];
  const end: LngLat = [-74.01, 40.75];

  it("selects waypoints sorted by score", () => {
    const candidates: ScoredWaypoint[] = [
      makeWaypoint({ id: "low", lngLat: [-74.008, 40.72], score: 30 }),
      makeWaypoint({ id: "high", lngLat: [-74.009, 40.73], score: 90 }),
      makeWaypoint({ id: "mid", lngLat: [-74.007, 40.74], score: 60 }),
    ];

    const selected = selectWaypoints(candidates, start, end);
    expect(selected[0].id).toBe("high");
  });

  it("allows dead-end features regardless of angular deviation", () => {
    const candidates: ScoredWaypoint[] = [
      makeWaypoint({
        id: "pier",
        lngLat: [-74.02, 40.69],
        score: 100,
        isDeadEnd: true,
        featureType: "pier",
      }),
    ];

    const selected = selectWaypoints(candidates, start, end);
    expect(selected).toHaveLength(1);
  });
});
