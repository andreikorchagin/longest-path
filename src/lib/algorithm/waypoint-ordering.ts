import type { LngLat } from "@/types/geo";
import type { ScoredWaypoint } from "./types";
import { projectOntoLine, bearing } from "@/lib/geo/distance";

/**
 * Order waypoints along the start→end direction for point-to-point mode.
 * Projects each waypoint onto the start-end vector and sorts by projection.
 */
export function orderWaypointsLinear(
  waypoints: ScoredWaypoint[],
  start: LngLat,
  end: LngLat
): ScoredWaypoint[] {
  return [...waypoints].sort((a, b) => {
    const projA = projectOntoLine(a.lngLat, start, end);
    const projB = projectOntoLine(b.lngLat, start, end);
    return projA - projB;
  });
}

/**
 * Order waypoints clockwise by bearing from center for loop mode.
 */
export function orderWaypointsRadial(
  waypoints: ScoredWaypoint[],
  center: LngLat
): ScoredWaypoint[] {
  return [...waypoints].sort((a, b) => {
    const bearingA = bearing(center, a.lngLat);
    const bearingB = bearing(center, b.lngLat);
    return bearingA - bearingB;
  });
}
