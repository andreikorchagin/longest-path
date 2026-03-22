import type { LngLat } from "@/types/geo";
import type { PathGeometry } from "./overpass-query";
import type { StrategicWaypoint } from "./types";
import {
  haversineDistance,
  bearing,
  angleBetween,
  projectOntoLine,
} from "@/lib/geo/distance";
import {
  MAX_STRATEGIC_WAYPOINTS,
  MIN_PATH_LENGTH_M,
  MAX_DETOUR_DISTANCE_M,
  MIN_ALIGNMENT,
} from "@/lib/constants";

/**
 * Calculate the total length of a path in meters.
 */
function pathLength(coords: LngLat[]): number {
  let len = 0;
  for (let i = 1; i < coords.length; i++) {
    len += haversineDistance(coords[i - 1], coords[i]);
  }
  return len;
}

/**
 * Find the midpoint coordinate of a path (by distance, not index).
 */
function pathMidpoint(coords: LngLat[]): LngLat {
  const totalLen = pathLength(coords);
  const halfLen = totalLen / 2;
  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    const segLen = haversineDistance(coords[i - 1], coords[i]);
    if (accumulated + segLen >= halfLen) {
      // Interpolate within this segment
      const ratio = (halfLen - accumulated) / segLen;
      return [
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * ratio,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * ratio,
      ];
    }
    accumulated += segLen;
  }

  // Fallback to geometric midpoint
  const mid = Math.floor(coords.length / 2);
  return coords[mid];
}

/**
 * Check if any point of a path is near water features.
 */
function isNearWater(path: PathGeometry, waterPaths: PathGeometry[]): boolean {
  // Sample a few points along the path
  const sampleIndices = [
    0,
    Math.floor(path.coordinates.length / 4),
    Math.floor(path.coordinates.length / 2),
    Math.floor((3 * path.coordinates.length) / 4),
    path.coordinates.length - 1,
  ];

  for (const idx of sampleIndices) {
    const point = path.coordinates[Math.min(idx, path.coordinates.length - 1)];
    for (const wp of waterPaths) {
      for (const coord of wp.coordinates) {
        if (haversineDistance(point, coord) < 200) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Score a path for strategic waypoint qualification.
 *
 * Simple: length + water proximity + alignment.
 * No elaborate feature-type weights.
 */
function scorePath(
  path: PathGeometry,
  waterPaths: PathGeometry[],
  travelBearing: number
): number {
  const len = pathLength(path.coordinates);

  // Length is primary: min(len/1000, 5) — caps at 5km
  let score = Math.min(len / 1000, 5);

  // Water proximity: +3
  if (isNearWater(path, waterPaths)) {
    score += 3;
  }

  // Alignment multiplier: 0.5 to 1.0
  if (path.coordinates.length >= 2) {
    const first = path.coordinates[0];
    const last = path.coordinates[path.coordinates.length - 1];
    const pathBearing = bearing(first, last);
    const angle1 = angleBetween(pathBearing, travelBearing);
    const angle2 = angleBetween((pathBearing + 180) % 360, travelBearing);
    const alignment = Math.max(0, 1 - Math.min(angle1, angle2) / 90);
    score *= 0.5 + 0.5 * alignment;
  }

  return score;
}

/**
 * Find the minimum distance from a path's midpoint to the
 * line between start and end.
 */
function distanceFromRoute(
  path: PathGeometry,
  start: LngLat,
  end: LngLat
): number {
  const mid = pathMidpoint(path.coordinates);
  // Approximate: distance from midpoint to the closest point on the start-end line
  const proj = projectOntoLine(mid, start, end);
  const clampedProj = Math.max(0, Math.min(1, proj));
  const closestOnLine: LngLat = [
    start[0] + (end[0] - start[0]) * clampedProj,
    start[1] + (end[1] - start[1]) * clampedProj,
  ];
  return haversineDistance(mid, closestOnLine);
}

/**
 * Find strategic waypoints: ONE midpoint per qualifying major path.
 *
 * Philosophy: Mapbox with walkway_bias=1 already produces decent routes.
 * We only intervene to nudge the route toward a major car-free path
 * it would otherwise miss. Fewer waypoints = fewer turns = smoother route.
 */
export function findStrategicWaypoints(
  paths: PathGeometry[],
  start: LngLat,
  end: LngLat
): StrategicWaypoint[] {
  const waterPaths = paths.filter((p) => p.type === "waterfront");
  const runnablePaths = paths.filter((p) => p.type === "running_path");
  const travelBearing = bearing(start, end);

  // Filter to qualifying paths
  const qualifying = runnablePaths
    .map((p) => ({
      path: p,
      length: pathLength(p.coordinates),
      distFromRoute: distanceFromRoute(p, start, end),
      score: scorePath(p, waterPaths, travelBearing),
    }))
    .filter((p) => p.length >= MIN_PATH_LENGTH_M)
    .filter((p) => p.distFromRoute <= MAX_DETOUR_DISTANCE_M)
    .filter((p) => {
      // Alignment check
      if (p.path.coordinates.length < 2) return false;
      const first = p.path.coordinates[0];
      const last = p.path.coordinates[p.path.coordinates.length - 1];
      const pathBearing = bearing(first, last);
      const angle1 = angleBetween(pathBearing, travelBearing);
      const angle2 = angleBetween((pathBearing + 180) % 360, travelBearing);
      const alignment = Math.max(0, 1 - Math.min(angle1, angle2) / 90);
      return alignment >= MIN_ALIGNMENT;
    })
    .sort((a, b) => b.score - a.score);

  // Take top paths, one waypoint each
  const waypoints: StrategicWaypoint[] = [];

  for (const q of qualifying) {
    if (waypoints.length >= MAX_STRATEGIC_WAYPOINTS) break;

    const midpoint = pathMidpoint(q.path.coordinates);

    // Skip if too close to start or end
    if (haversineDistance(midpoint, start) < 200) continue;
    if (haversineDistance(midpoint, end) < 200) continue;

    // Skip if too close to an already-placed waypoint
    const tooClose = waypoints.some(
      (w) => haversineDistance(w.lngLat, midpoint) < 500
    );
    if (tooClose) continue;

    waypoints.push({
      id: q.path.id,
      lngLat: midpoint,
      pathName: q.path.name || "Unnamed path",
      pathLengthM: q.length,
      score: q.score,
    });
  }

  return waypoints;
}

/**
 * Variant for loop mode: no alignment filter, find best path nearby.
 */
export function findStrategicWaypointsForLoop(
  paths: PathGeometry[],
  start: LngLat,
  radiusM: number
): StrategicWaypoint[] {
  const waterPaths = paths.filter((p) => p.type === "waterfront");
  const runnablePaths = paths.filter((p) => p.type === "running_path");

  const qualifying = runnablePaths
    .map((p) => {
      const mid = pathMidpoint(p.coordinates);
      const dist = haversineDistance(start, mid);
      const len = pathLength(p.coordinates);
      let score = Math.min(len / 1000, 5);
      if (isNearWater(p, waterPaths)) score += 3;
      return { path: p, length: len, dist, score };
    })
    .filter((p) => p.length >= MIN_PATH_LENGTH_M)
    .filter((p) => p.dist <= radiusM)
    .sort((a, b) => b.score - a.score);

  if (qualifying.length === 0) return [];

  const best = qualifying[0];
  const midpoint = pathMidpoint(best.path.coordinates);

  if (haversineDistance(midpoint, start) < 200) return [];

  return [
    {
      id: best.path.id,
      lngLat: midpoint,
      pathName: best.path.name || "Unnamed path",
      pathLengthM: best.length,
      score: best.score,
    },
  ];
}
