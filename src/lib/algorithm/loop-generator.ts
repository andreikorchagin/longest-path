import type { LngLat } from "@/types/geo";
import type { Route } from "@/types/route";
import type { ScoredWaypoint } from "./types";
import type { PipelineResult } from "./route-pipeline";
import { radiusBBox } from "@/lib/geo/bbox";
import { buildOverpassQuery, elementsToWaypoints } from "./overpass-query";
import { orderWaypointsRadial } from "./waypoint-ordering";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";
import { haversineDistance, bearing } from "@/lib/geo/distance";
import {
  MAX_WAYPOINTS,
  DEDUP_RADIUS_M,
  LOOP_RADIUS_FACTOR,
  LOOP_DISTANCE_TOLERANCE,
  LOOP_MAX_ITERATIONS,
} from "@/lib/constants";

const NUM_SECTORS = 8;

interface SectorWaypoint {
  sector: number;
  waypoint: ScoredWaypoint;
}

/**
 * Divide waypoints into angular sectors and pick the best from each.
 */
function selectBySector(
  waypoints: ScoredWaypoint[],
  center: LngLat,
  maxPerSector: number = 2
): ScoredWaypoint[] {
  const sectorSize = 360 / NUM_SECTORS;
  const sectors: Map<number, ScoredWaypoint[]> = new Map();

  for (const wp of waypoints) {
    // Skip waypoints too close to center
    if (haversineDistance(wp.lngLat, center) < DEDUP_RADIUS_M) continue;

    const brng = bearing(center, wp.lngLat);
    const sector = Math.floor(brng / sectorSize);

    if (!sectors.has(sector)) {
      sectors.set(sector, []);
    }
    sectors.get(sector)!.push(wp);
  }

  const selected: ScoredWaypoint[] = [];

  for (const [, sectorWps] of sectors) {
    // Sort by score descending, take top N
    const sorted = sectorWps.sort((a, b) => b.score - a.score);
    const toTake = Math.min(maxPerSector, sorted.length);

    for (let i = 0; i < toTake; i++) {
      if (selected.length >= MAX_WAYPOINTS) break;

      // Dedup against already selected
      const tooClose = selected.some(
        (s) => haversineDistance(s.lngLat, sorted[i].lngLat) < DEDUP_RADIUS_M
      );
      if (!tooClose) {
        selected.push(sorted[i]);
      }
    }
  }

  return selected;
}

/**
 * Generate a loop route from a start point with a target distance.
 *
 * 1. Compute search radius from target distance
 * 2. Query Overpass for features within radius
 * 3. Divide into sectors, pick best per sector
 * 4. Order clockwise
 * 5. Route as loop (start → waypoints → start)
 * 6. Iterate if distance is off target
 */
export async function generateLoopRoute(
  start: LngLat,
  targetDistanceKm: number
): Promise<PipelineResult> {
  const targetDistanceM = targetDistanceKm * 1000;

  // Initial radius: circumference = 2πr, so r = distance / (2π)
  let radiusM = (targetDistanceM / (2 * Math.PI)) * LOOP_RADIUS_FACTOR;
  radiusM = Math.max(500, Math.min(radiusM, 10000)); // Clamp

  let bestResult: PipelineResult | null = null;
  let discoveredFeatures: ScoredWaypoint[] = [];

  for (let iteration = 0; iteration < LOOP_MAX_ITERATIONS; iteration++) {
    // Query Overpass
    const bbox = radiusBBox(start, radiusM);
    const query = buildOverpassQuery(bbox);
    const overpassData = await queryOverpass(query);
    discoveredFeatures = elementsToWaypoints(overpassData.elements);

    // Select by sector
    const selectedWaypoints = selectBySector(discoveredFeatures, start);

    if (selectedWaypoints.length === 0) {
      // No features found, expand radius
      radiusM *= 1.5;
      continue;
    }

    // Order clockwise
    const orderedWaypoints = orderWaypointsRadial(selectedWaypoints, start);

    // Build loop coordinates: start → waypoints → start
    const coordinates: LngLat[] = [
      start,
      ...orderedWaypoints.map((wp) => wp.lngLat),
      start,
    ];

    const data = await getDirections(coordinates);

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const mapboxRoute = data.routes[0];
    const actualDistanceKm = mapboxRoute.distance / 1000;

    const route: Route = {
      geometry: {
        type: "Feature",
        properties: {},
        geometry: mapboxRoute.geometry,
      },
      stats: {
        distanceKm: actualDistanceKm,
        distanceMi: actualDistanceKm * 0.621371,
        durationMin: mapboxRoute.duration / 60,
      },
    };

    bestResult = {
      route,
      discoveredFeatures,
      selectedWaypoints: orderedWaypoints,
    };

    // Check if distance is close enough to target
    const ratio = actualDistanceKm / targetDistanceKm;

    if (ratio >= 1 - LOOP_DISTANCE_TOLERANCE && ratio <= 1 + LOOP_DISTANCE_TOLERANCE) {
      break; // Close enough
    }

    // Adjust radius for next iteration
    if (ratio < 1 - LOOP_DISTANCE_TOLERANCE) {
      // Too short, expand
      radiusM *= 1.2;
    } else {
      // Too long, shrink
      radiusM *= 0.85;
    }
  }

  if (!bestResult) {
    throw new Error("Could not generate a loop route. Try a different area or distance.");
  }

  return bestResult;
}
