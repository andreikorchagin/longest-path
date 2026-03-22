import { describe, it, expect } from "vitest";
import {
  orderWaypointsLinear,
  orderWaypointsRadial,
} from "@/lib/algorithm/waypoint-ordering";
import type { LngLat } from "@/types/geo";

function makeWaypoint(id: string, lngLat: LngLat) {
  return { id, lngLat, score: 50 };
}

describe("orderWaypointsLinear", () => {
  it("orders waypoints along the start→end direction", () => {
    const start: LngLat = [-74.01, 40.70];
    const end: LngLat = [-74.01, 40.80];

    const waypoints = [
      makeWaypoint("far", [-74.01, 40.78]),
      makeWaypoint("near", [-74.01, 40.72]),
      makeWaypoint("mid", [-74.01, 40.75]),
    ];

    const ordered = orderWaypointsLinear(waypoints, start, end);

    expect(ordered[0].id).toBe("near");
    expect(ordered[1].id).toBe("mid");
    expect(ordered[2].id).toBe("far");
  });
});

describe("orderWaypointsRadial", () => {
  it("orders waypoints clockwise by bearing", () => {
    const center: LngLat = [-74.01, 40.73];

    const waypoints = [
      makeWaypoint("south", [-74.01, 40.72]),
      makeWaypoint("north", [-74.01, 40.74]),
      makeWaypoint("east", [-74.00, 40.73]),
      makeWaypoint("west", [-74.02, 40.73]),
    ];

    const ordered = orderWaypointsRadial(waypoints, center);

    expect(ordered[0].id).toBe("north");
    expect(ordered[1].id).toBe("east");
    expect(ordered[2].id).toBe("south");
    expect(ordered[3].id).toBe("west");
  });
});
