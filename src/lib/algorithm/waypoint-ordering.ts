import type { LngLat } from "@/types/geo";
import { projectOntoLine, bearing } from "@/lib/geo/distance";

interface HasLngLat {
  lngLat: LngLat;
}

/**
 * Order waypoints along the start→end direction for point-to-point mode.
 */
export function orderWaypointsLinear<T extends HasLngLat>(
  waypoints: T[],
  start: LngLat,
  end: LngLat
): T[] {
  return [...waypoints].sort((a, b) => {
    const projA = projectOntoLine(a.lngLat, start, end);
    const projB = projectOntoLine(b.lngLat, start, end);
    return projA - projB;
  });
}

/**
 * Order waypoints clockwise by bearing from center for loop mode.
 */
export function orderWaypointsRadial<T extends HasLngLat>(
  waypoints: T[],
  center: LngLat
): T[] {
  return [...waypoints].sort((a, b) => {
    const bearingA = bearing(center, a.lngLat);
    const bearingB = bearing(center, b.lngLat);
    return bearingA - bearingB;
  });
}
