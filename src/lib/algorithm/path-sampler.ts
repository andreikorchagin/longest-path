import type { LngLat } from "@/types/geo";
import type { PathGeometry } from "./overpass-query";
import type { ScoredWaypoint } from "./types";
import {
  haversineDistance,
  projectOntoLine,
  bearing,
  angleBetween,
} from "@/lib/geo/distance";

const SAMPLE_INTERVAL_M = 400;
const MIN_PATH_LENGTH_M = 100;
const WATER_PROXIMITY_M = 300;

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
 * Sample points along a path geometry at regular intervals.
 */
function sampleAlongPath(coords: LngLat[], intervalM: number): LngLat[] {
  if (coords.length < 2) return [];

  const samples: LngLat[] = [coords[0]];
  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    const segmentDist = haversineDistance(coords[i - 1], coords[i]);
    accumulated += segmentDist;

    if (accumulated >= intervalM) {
      samples.push(coords[i]);
      accumulated = 0;
    }
  }

  // Always include the last point
  const last = coords[coords.length - 1];
  const lastSample = samples[samples.length - 1];
  if (haversineDistance(last, lastSample) > intervalM * 0.3) {
    samples.push(last);
  }

  return samples;
}

/**
 * Check if a point is near any water feature.
 */
function isNearWater(point: LngLat, waterPaths: PathGeometry[]): boolean {
  for (const wp of waterPaths) {
    for (const coord of wp.coordinates) {
      if (haversineDistance(point, coord) < WATER_PROXIMITY_M) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a path is roughly aligned with the travel direction.
 * Returns true if the path runs within 60 degrees of the travel bearing.
 * Perpendicular inland paths (like cross streets) return false.
 */
function isAlignedWithTravel(
  path: PathGeometry,
  travelBearing: number
): boolean {
  if (path.coordinates.length < 2) return true;
  const first = path.coordinates[0];
  const last = path.coordinates[path.coordinates.length - 1];
  const pathBearing = bearing(first, last);

  // Check both directions (a path from A to B has bearing X, B to A has X+180)
  const angle1 = angleBetween(pathBearing, travelBearing);
  const angle2 = angleBetween((pathBearing + 180) % 360, travelBearing);

  return Math.min(angle1, angle2) < 60;
}

/**
 * Score a path based on its properties and context.
 *
 * Scoring philosophy: strongly prefer paths that would make a runner
 * choose them naturally — waterfront, parks, named trails, car-free.
 * Generic unnamed inland footways score very low to prevent zigzagging.
 */
function scorePath(
  path: PathGeometry,
  waterPaths: PathGeometry[],
  travelBearing: number
): number {
  let score = 0;

  // Base scores by type
  switch (path.type) {
    case "pier":
      score = 95;
      break;
    case "running_path":
      score = 15; // LOW base — unnamed inland footways shouldn't win
      break;
    case "park":
      score = 40;
      break;
    case "waterfront":
      score = 0; // Water features, not runnable paths
      break;
  }

  // Named paths are significant running infrastructure
  if (path.name && path.type === "running_path") {
    score += 35;
  }

  // Near water = major bonus (this is the primary signal)
  if (path.type === "running_path" || path.type === "pier") {
    const midIdx = Math.floor(path.coordinates.length / 2);
    const midpoint = path.coordinates[midIdx];
    if (isNearWater(midpoint, waterPaths)) {
      score += 40;
    }
  }

  // Alignment with travel direction — penalize perpendicular inland paths
  if (
    path.type === "running_path" &&
    !isNearWater(
      path.coordinates[Math.floor(path.coordinates.length / 2)],
      waterPaths
    )
  ) {
    if (!isAlignedWithTravel(path, travelBearing)) {
      score -= 20; // Perpendicular inland path = likely a cross-street footway
    }
  }

  // Longer continuous paths are more likely to be real infrastructure
  const len = pathLength(path.coordinates);
  if (len > 500) score += 5;
  if (len > 1000) score += 10;

  return score;
}

/**
 * Main function: convert path geometries into scored waypoints
 * by sampling along the highest-scoring paths.
 *
 * Waypoints are sampled FROM path geometries (producing continuous routes)
 * instead of being isolated feature centroids (which cause zigzagging).
 */
export function sampleWaypointsFromPaths(
  paths: PathGeometry[],
  start: LngLat,
  end: LngLat,
  maxWaypoints: number = 20
): ScoredWaypoint[] {
  const waterPaths = paths.filter((p) => p.type === "waterfront");
  const runnablePaths = paths.filter((p) => p.type !== "waterfront");
  const travelBearing = bearing(start, end);

  // Score and sort runnable paths
  const scoredPaths = runnablePaths
    .filter((p) => pathLength(p.coordinates) >= MIN_PATH_LENGTH_M)
    .map((p) => ({
      path: p,
      score: scorePath(p, waterPaths, travelBearing),
    }))
    .sort((a, b) => b.score - a.score);

  // Minimum score threshold: only quality paths make it
  const MIN_SCORE = 45;

  const allWaypoints: ScoredWaypoint[] = [];

  for (const { path, score } of scoredPaths) {
    if (score < MIN_SCORE) continue;

    if (path.type === "pier") {
      // For piers: just use the tip (endpoint farthest from start)
      const first = path.coordinates[0];
      const last = path.coordinates[path.coordinates.length - 1];
      const tip =
        haversineDistance(first, start) > haversineDistance(last, start)
          ? first
          : last;

      allWaypoints.push({
        id: path.id,
        lngLat: tip,
        featureType: "pier",
        score,
        isDeadEnd: true,
        name: path.name,
      });
    } else {
      // For running paths: sample along the geometry
      const samples = sampleAlongPath(path.coordinates, SAMPLE_INTERVAL_M);

      for (let i = 0; i < samples.length; i++) {
        allWaypoints.push({
          id: `${path.id}-s${i}`,
          lngLat: samples[i],
          featureType: path.type === "park" ? "park" : "footway",
          score,
          isDeadEnd: false,
          name: path.name,
        });
      }
    }
  }

  // Filter: only keep waypoints within the corridor
  const filtered = allWaypoints.filter((wp) => {
    const proj = projectOntoLine(wp.lngLat, start, end);
    const margin = wp.isDeadEnd ? 0.3 : 0.1;
    return proj >= -margin && proj <= 1 + margin;
  });

  // Deduplicate: remove points too close to each other
  const deduped = deduplicateWaypoints(filtered, 150);

  // Remove waypoints too close to start or end
  const cleaned = deduped.filter(
    (wp) =>
      haversineDistance(wp.lngLat, start) > 100 &&
      haversineDistance(wp.lngLat, end) > 100
  );

  // Take top N by score
  return cleaned.sort((a, b) => b.score - a.score).slice(0, maxWaypoints);
}

/**
 * Remove waypoints that are too close to each other,
 * keeping the higher-scored one.
 */
function deduplicateWaypoints(
  waypoints: ScoredWaypoint[],
  minDistM: number
): ScoredWaypoint[] {
  const sorted = [...waypoints].sort((a, b) => b.score - a.score);
  const result: ScoredWaypoint[] = [];

  for (const wp of sorted) {
    const tooClose = result.some(
      (existing) => haversineDistance(existing.lngLat, wp.lngLat) < minDistM
    );
    if (!tooClose) {
      result.push(wp);
    }
  }

  return result;
}
