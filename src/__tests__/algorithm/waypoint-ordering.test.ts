import { describe, it, expect } from "vitest";
import {
  orderWaypointsLinear,
  orderWaypointsRadial,
} from "@/lib/algorithm/waypoint-ordering";
import type { ScoredWaypoint } from "@/lib/algorithm/types";
import type { LngLat } from "@/types/geo";

function makeWaypoint(id: string, lngLat: LngLat): ScoredWaypoint {
  return {
    id,
    lngLat,
    featureType: "park",
    score: 50,
    isDeadEnd: false,
  };
}

describe("orderWaypointsLinear", () => {
  it("orders waypoints along the start→end direction", () => {
    const start: LngLat = [-74.01, 40.70];
    const end: LngLat = [-74.01, 40.80]; // Due north

    const waypoints: ScoredWaypoint[] = [
      makeWaypoint("far", [-74.01, 40.78]),
      makeWaypoint("near", [-74.01, 40.72]),
      makeWaypoint("mid", [-74.01, 40.75]),
    ];

    const ordered = orderWaypointsLinear(waypoints, start, end);

    expect(ordered[0].id).toBe("near");
    expect(ordered[1].id).toBe("mid");
    expect(ordered[2].id).toBe("far");
  });

  it("does not mutate the original array", () => {
    const start: LngLat = [-74.01, 40.70];
    const end: LngLat = [-74.01, 40.80];

    const waypoints: ScoredWaypoint[] = [
      makeWaypoint("b", [-74.01, 40.78]),
      makeWaypoint("a", [-74.01, 40.72]),
    ];

    const ordered = orderWaypointsLinear(waypoints, start, end);

    expect(waypoints[0].id).toBe("b"); // Original unchanged
    expect(ordered[0].id).toBe("a");
  });
});

describe("orderWaypointsRadial", () => {
  it("orders waypoints clockwise by bearing", () => {
    const center: LngLat = [-74.01, 40.73];

    const waypoints: ScoredWaypoint[] = [
      makeWaypoint("south", [-74.01, 40.72]), // ~180°
      makeWaypoint("north", [-74.01, 40.74]), // ~0°
      makeWaypoint("east", [-74.00, 40.73]), // ~90°
      makeWaypoint("west", [-74.02, 40.73]), // ~270°
    ];

    const ordered = orderWaypointsRadial(waypoints, center);

    // Should be ordered: north (~0°), east (~90°), south (~180°), west (~270°)
    expect(ordered[0].id).toBe("north");
    expect(ordered[1].id).toBe("east");
    expect(ordered[2].id).toBe("south");
    expect(ordered[3].id).toBe("west");
  });
});
