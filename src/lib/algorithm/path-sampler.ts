import type { LngLat } from "@/types/geo";
import type { PathGeometry } from "./overpass-query";
import type { ScoredWaypoint } from "./types";
import {
  haversineDistance,
  projectOntoLine,
  bearing,
  angleBetween,
} from "@/lib/geo/distance";

const WATER_PROXIMITY_M = 400;
const MAX_PIERS = 3;

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
 */
function alignmentScore(
  path: PathGeometry,
  travelBearing: number
): number {
  if (path.coordinates.length < 2) return 0;
  const first = path.coordinates[0];
  const last = path.coordinates[path.coordinates.length - 1];
  const pathBearing = bearing(first, last);

  const angle1 = angleBetween(pathBearing, travelBearing);
  const angle2 = angleBetween((pathBearing + 180) % 360, travelBearing);
  const bestAngle = Math.min(angle1, angle2);

  // 0 degrees = perfectly aligned = score 1.0
  // 90 degrees = perpendicular = score 0.0
  return Math.max(0, 1 - bestAngle / 90);
}

/**
 * Score a path for being the "one best continuous running path."
 *
 * Philosophy: a runner wants ONE long, continuous, car-free path
 * that goes roughly in their direction. Not 20 short random footways.
 *
 * Top priorities:
 * 1. Length — longer paths are exponentially better (they ARE the route)
 * 2. Near water — waterfront paths are the best running infrastructure
 * 3. Named — named paths are real running routes, not random sidewalk segments
 * 4. Directional alignment — perpendicular paths cause turns
 */
function scorePathForBestRoute(
  path: PathGeometry,
  waterPaths: PathGeometry[],
  travelBearing: number
): number {
  if (path.type === "waterfront" || path.type === "park") return 0;

  const len = pathLength(path.coordinates);
  if (len < 200) return 0; // Ignore short segments

  let score = 0;

  // Length is king — a 2km path is worth way more than five 200m paths
  score += Math.min(len / 50, 50); // Up to 50 points for 2.5km+

  // Near water = major bonus
  const midIdx = Math.floor(path.coordinates.length / 2);
  if (isNearWater(path.coordinates[midIdx], waterPaths)) {
    score += 40;
  }

  // Named = real infrastructure
  if (path.name) {
    score += 30;
  }

  // Directional alignment — penalize paths that would cause turns
  const alignment = alignmentScore(path, travelBearing);
  score *= 0.5 + 0.5 * alignment; // 50-100% multiplier based on alignment

  return score;
}

/**
 * From a single continuous path, pick a small number of evenly-spaced
 * waypoints that will guide the route along it without excess turns.
 *
 * Key insight: fewer waypoints = fewer turns = better running route.
 * We just need enough to "pull" the route onto the path.
 */
function pickGuidepointsFromPath(
  path: PathGeometry,
  start: LngLat,
  end: LngLat,
  count: number
): ScoredWaypoint[] {
  const coords = path.coordinates;
  if (coords.length < 2) return [];

  // Filter to only coordinates that are between start and end
  const inCorridor = coords.filter((c) => {
    const proj = projectOntoLine(c, start, end);
    return proj >= -0.05 && proj <= 1.05;
  });

  if (inCorridor.length < 2) return [];

  // Pick `count` evenly spaced points from the corridor-filtered path
  const step = Math.max(1, Math.floor(inCorridor.length / (count + 1)));
  const waypoints: ScoredWaypoint[] = [];

  for (let i = 1; i <= count; i++) {
    const idx = Math.min(i * step, inCorridor.length - 1);
    const coord = inCorridor[idx];

    // Skip if too close to start or end
    if (haversineDistance(coord, start) < 150) continue;
    if (haversineDistance(coord, end) < 150) continue;

    waypoints.push({
      id: `${path.id}-guide-${i}`,
      lngLat: coord,
      featureType: "footway",
      score: 80,
      isDeadEnd: false,
      name: path.name,
    });
  }

  return waypoints;
}

/**
 * Select the best piers along the route — ones that are close to the
 * main path and won't cause a big detour.
 */
function selectBestPiers(
  piers: PathGeometry[],
  start: LngLat,
  end: LngLat,
  maxPiers: number
): ScoredWaypoint[] {
  const scored = piers
    .map((pier) => {
      const len = pathLength(pier.coordinates);
      // Use the tip (endpoint farthest from the midpoint of start-end)
      const first = pier.coordinates[0];
      const last = pier.coordinates[pier.coordinates.length - 1];
      const tip =
        haversineDistance(first, start) > haversineDistance(last, start)
          ? first
          : last;

      // Only include piers that are between start and end
      const proj = projectOntoLine(tip, start, end);
      if (proj < -0.1 || proj > 1.1) return null;

      // Score: prefer longer piers (more interesting) and named ones
      let score = 70;
      if (len > 200) score += 10;
      if (len > 500) score += 10;
      if (pier.name) score += 10;

      return {
        id: pier.id,
        lngLat: tip,
        featureType: "pier" as const,
        score,
        isDeadEnd: true,
        name: pier.name,
        proj, // for sorting
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.score - a.score);

  // Deduplicate — don't pick piers too close to each other
  const selected: (typeof scored)[0][] = [];
  for (const pier of scored) {
    if (selected.length >= maxPiers) break;
    const tooClose = selected.some(
      (s) => haversineDistance(s.lngLat, pier.lngLat) < 400
    );
    if (!tooClose) {
      selected.push(pier);
    }
  }

  return selected;
}

/**
 * Main entry point: find the ONE best continuous running path,
 * pick a few guidepoints along it, and add a couple pier detours.
 *
 * This produces routes with minimal turns that a runner can actually
 * remember and enjoy.
 */
export function sampleWaypointsFromPaths(
  paths: PathGeometry[],
  start: LngLat,
  end: LngLat,
  maxWaypoints: number = 20
): ScoredWaypoint[] {
  const waterPaths = paths.filter((p) => p.type === "waterfront");
  const runnablePaths = paths.filter(
    (p) => p.type === "running_path"
  );
  const pierPaths = paths.filter((p) => p.type === "pier");
  const travelBearing = bearing(start, end);

  // Score all runnable paths and find the top ones
  const scoredPaths = runnablePaths
    .map((p) => ({
      path: p,
      score: scorePathForBestRoute(p, waterPaths, travelBearing),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  const waypoints: ScoredWaypoint[] = [];

  // Pick guidepoints from the top 2-3 paths (usually just 1 great one)
  // Use fewer guidepoints per path = fewer turns
  const guidepointsPerPath = Math.min(4, Math.ceil(maxWaypoints / 3));
  const topPathCount = Math.min(3, scoredPaths.length);

  for (let i = 0; i < topPathCount; i++) {
    const { path } = scoredPaths[i];
    // Fewer points for lower-ranked paths
    const count = i === 0 ? guidepointsPerPath : Math.max(2, guidepointsPerPath - 2);
    const guides = pickGuidepointsFromPath(path, start, end, count);
    waypoints.push(...guides);
  }

  // Add a few piers (max 3)
  const piers = selectBestPiers(pierPaths, start, end, MAX_PIERS);
  waypoints.push(...piers);

  // Deduplicate any waypoints too close to each other
  const deduped: ScoredWaypoint[] = [];
  const sorted = [...waypoints].sort((a, b) => b.score - a.score);
  for (const wp of sorted) {
    const tooClose = deduped.some(
      (existing) => haversineDistance(existing.lngLat, wp.lngLat) < 200
    );
    if (!tooClose) {
      deduped.push(wp);
    }
  }

  return deduped.slice(0, maxWaypoints);
}
