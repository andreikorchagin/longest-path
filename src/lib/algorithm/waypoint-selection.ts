import type { LngLat } from "@/types/geo";
import type { ScoredWaypoint } from "./types";
import {
  haversineDistance,
  bearing,
  angleBetween,
} from "@/lib/geo/distance";
import { MAX_WAYPOINTS, DEDUP_RADIUS_M } from "@/lib/constants";

/**
 * Select waypoints using greedy scoring with anti-zigzag filtering.
 *
 * A waypoint is rejected if:
 * - Angular deviation from travel direction > 90° (unless dead-end)
 * - Within DEDUP_RADIUS_M of an already-selected waypoint
 * - Would exceed MAX_WAYPOINTS budget
 */
export function selectWaypoints(
  candidates: ScoredWaypoint[],
  start: LngLat,
  end: LngLat
): ScoredWaypoint[] {
  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  const travelBearing = bearing(start, end);
  const selected: ScoredWaypoint[] = [];

  for (const wp of sorted) {
    if (selected.length >= MAX_WAYPOINTS) break;

    // Anti-zigzag: check angular deviation from travel direction
    if (!wp.isDeadEnd) {
      const wpBearing = bearing(start, wp.lngLat);
      const deviation = angleBetween(travelBearing, wpBearing);
      if (deviation > 90) continue;
    }

    // Deduplication: skip if too close to an already-selected waypoint
    const tooClose = selected.some(
      (s) => haversineDistance(s.lngLat, wp.lngLat) < DEDUP_RADIUS_M
    );
    if (tooClose) continue;

    // Don't select waypoints that are very close to start or end
    if (haversineDistance(wp.lngLat, start) < DEDUP_RADIUS_M) continue;
    if (haversineDistance(wp.lngLat, end) < DEDUP_RADIUS_M) continue;

    selected.push(wp);
  }

  return selected;
}
