import type { LngLat } from "@/types/geo";
import type { Route } from "@/types/route";
import type { StrategicWaypoint, ProgressCallback } from "./types";
import type { PipelineResult } from "./route-pipeline";
import { radiusBBox } from "@/lib/geo/bbox";
import {
  buildOverpassQuery,
  parsePathGeometries,
  mergeConnectedWays,
} from "./overpass-query";
import { findStrategicWaypointsForLoop } from "./path-sampler";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";
import { haversineDistance, bearing, movePoint } from "@/lib/geo/distance";
import {
  LOOP_RADIUS_FACTOR,
  LOOP_DISTANCE_TOLERANCE,
  LOOP_MAX_ITERATIONS,
} from "@/lib/constants";

/**
 * Generate a loop route using the Strategic Nudge approach.
 *
 * 1. Find the best nearby car-free path
 * 2. Place one waypoint on it + a turnaround point on the far side
 * 3. Route: [start, waypoint, turnaround, start]
 * 4. Iterate to match target distance
 */
export async function generateLoopRoute(
  start: LngLat,
  targetDistanceKm: number,
  paceMinPerMile: number = 9,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const targetDistanceM = targetDistanceKm * 1000;

  let radiusM = (targetDistanceM / (2 * Math.PI)) * LOOP_RADIUS_FACTOR;
  radiusM = Math.max(500, Math.min(radiusM, 10000));

  let bestResult: PipelineResult | null = null;

  for (let iteration = 0; iteration < LOOP_MAX_ITERATIONS; iteration++) {
    onProgress?.(
      "discovering",
      iteration === 0
        ? "Searching for running paths..."
        : `Adjusting search area (attempt ${iteration + 1})...`
    );

    const bbox = radiusBBox(start, radiusM);
    const query = buildOverpassQuery(bbox);
    const overpassData = await queryOverpass(query);

    onProgress?.("analyzing", "Merging path segments...");
    const rawPaths = parsePathGeometries(overpassData.elements);
    const mergedPaths = mergeConnectedWays(rawPaths);

    onProgress?.("selecting", "Finding best loop path...");
    const waypoints = findStrategicWaypointsForLoop(mergedPaths, start, radiusM);

    // Build loop coordinates
    let coordinates: LngLat[];

    if (waypoints.length > 0) {
      const wp = waypoints[0];
      // Turnaround: opposite side of loop from waypoint
      const wpBearing = bearing(start, wp.lngLat);
      const turnaround = movePoint(start, radiusM * 0.6, (wpBearing + 180) % 360);

      coordinates = [start, wp.lngLat, turnaround, start];
    } else {
      // No qualifying paths — simple out-and-back
      const turnaround = movePoint(start, radiusM, 0); // Go north
      coordinates = [start, turnaround, start];
    }

    onProgress?.("routing", "Calculating loop route...");
    const data = await getDirections(coordinates);

    if (!data.routes || data.routes.length === 0) {
      radiusM *= 1.2;
      continue;
    }

    const mapboxRoute = data.routes[0];
    const distanceKm = mapboxRoute.distance / 1000;
    const distanceMi = distanceKm * 0.621371;

    const route: Route = {
      geometry: {
        type: "Feature",
        properties: {},
        geometry: mapboxRoute.geometry,
      },
      stats: {
        distanceKm,
        distanceMi,
        durationMin: distanceMi * paceMinPerMile,
      },
    };

    bestResult = {
      route,
      strategicWaypoints: waypoints,
      usedBareRoute: waypoints.length === 0,
    };

    // Check distance
    const ratio = distanceKm / targetDistanceKm;
    if (
      ratio >= 1 - LOOP_DISTANCE_TOLERANCE &&
      ratio <= 1 + LOOP_DISTANCE_TOLERANCE
    ) {
      break;
    }

    radiusM *= ratio < 1 - LOOP_DISTANCE_TOLERANCE ? 1.2 : 0.85;
  }

  if (!bestResult) {
    throw new Error("Could not generate a loop route. Try a different area or distance.");
  }

  onProgress?.("done");
  return bestResult;
}
