import type { LngLat } from "@/types/geo";
import type { PathGeometry } from "./overpass-query";
import type { ScoredWaypoint } from "./types";
import { haversineDistance, projectOntoLine } from "@/lib/geo/distance";

const SAMPLE_INTERVAL_M = 400; // Sample every 400m along paths
const MIN_PATH_LENGTH_M = 100; // Ignore very short paths
const WATER_PROXIMITY_M = 300; // A path is "waterfront" if within 300m of water

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
  if (
    haversineDistance(last, lastSample) > intervalM * 0.3
  ) {
    samples.push(last);
  }

  return samples;
}

/**
 * Check if a point is near any water feature.
 */
function isNearWater(
  point: LngLat,
  waterPaths: PathGeometry[]
): boolean {
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
 * Score a path based on its properties and water proximity.
 */
function scorePath(
  path: PathGeometry,
  waterPaths: PathGeometry[]
): number {
  let score = 0;

  // Base scores by type
  switch (path.type) {
    case "pier":
      score = 95; // Always interesting
      break;
    case "running_path":
      score = 40; // Base for any running path
      break;
    case "park":
      score = 30;
      break;
    case "waterfront":
      score = 0; // These ARE water features, not paths to run on
      break;
  }

  // Bonus for named paths (usually major running infrastructure)
  if (path.name) {
    score += 25;
  }

  // Bonus for paths near water
  if (path.type === "running_path" || path.type === "pier") {
    const midIdx = Math.floor(path.coordinates.length / 2);
    const midpoint = path.coordinates[midIdx];
    if (isNearWater(midpoint, waterPaths)) {
      score += 30; // Big bonus for waterfront running paths
    }
  }

  // Bonus for longer continuous paths (more likely to be real infrastructure)
  const len = pathLength(path.coordinates);
  if (len > 500) score += 10;
  if (len > 1000) score += 10;

  return score;
}

/**
 * Main function: convert path geometries into scored waypoints
 * by sampling along the highest-scoring paths.
 *
 * This is the core difference from the old algorithm: waypoints
 * are sampled FROM path geometries (producing continuous routes)
 * instead of being isolated feature centroids (which zigzag).
 */
export function sampleWaypointsFromPaths(
  paths: PathGeometry[],
  start: LngLat,
  end: LngLat,
  maxWaypoints: number = 20
): ScoredWaypoint[] {
  // Separate water features from runnable paths
  const waterPaths = paths.filter((p) => p.type === "waterfront");
  const runnablePaths = paths.filter((p) => p.type !== "waterfront");

  // Score and sort runnable paths
  const scoredPaths = runnablePaths
    .filter((p) => pathLength(p.coordinates) >= MIN_PATH_LENGTH_M)
    .map((p) => ({ path: p, score: scorePath(p, waterPaths) }))
    .sort((a, b) => b.score - a.score);

  // Collect sampled waypoints from top paths
  const allWaypoints: ScoredWaypoint[] = [];

  for (const { path, score } of scoredPaths) {
    if (score < 30) continue; // Skip low-value paths

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

  // Filter: only keep waypoints that are within the corridor
  // (between start and end along the travel axis, with some margin)
  const filtered = allWaypoints.filter((wp) => {
    const proj = projectOntoLine(wp.lngLat, start, end);
    // Allow some overshoot for piers
    const margin = wp.isDeadEnd ? 0.3 : 0.1;
    return proj >= -margin && proj <= 1 + margin;
  });

  // Deduplicate: remove points too close to each other, keeping higher-scored ones
  const deduped = deduplicateWaypoints(filtered, 150);

  // Don't include waypoints too close to start or end
  const cleaned = deduped.filter(
    (wp) =>
      haversineDistance(wp.lngLat, start) > 100 &&
      haversineDistance(wp.lngLat, end) > 100
  );

  // Take top N by score, then re-sort by projection for ordering
  const topN = cleaned
    .sort((a, b) => b.score - a.score)
    .slice(0, maxWaypoints);

  return topN;
}

/**
 * Remove waypoints that are too close to each other,
 * keeping the higher-scored one.
 */
function deduplicateWaypoints(
  waypoints: ScoredWaypoint[],
  minDistM: number
): ScoredWaypoint[] {
  // Sort by score descending so we keep higher-scored ones
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
