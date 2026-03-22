import type { LngLat } from "@/types/geo";
import type { Route } from "@/types/route";
import type { ScoredWaypoint, ProgressCallback } from "./types";
import type { PipelineResult } from "./route-pipeline";
import { radiusBBox } from "@/lib/geo/bbox";
import { buildOverpassQuery, parsePathGeometries } from "./overpass-query";
import { sampleWaypointsFromPaths } from "./path-sampler";
import { orderWaypointsRadial } from "./waypoint-ordering";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";
import { haversineDistance } from "@/lib/geo/distance";
import {
  LOOP_RADIUS_FACTOR,
  LOOP_DISTANCE_TOLERANCE,
  LOOP_MAX_ITERATIONS,
} from "@/lib/constants";

/**
 * Generate a loop route using path-following approach.
 * Samples waypoints from actual running path geometries,
 * orders them radially, and iterates to match target distance.
 */
export async function generateLoopRoute(
  start: LngLat,
  targetDistanceKm: number,
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

    onProgress?.("analyzing", "Analyzing path network...");
    const pathGeometries = parsePathGeometries(overpassData.elements);

    // For loop mode, we use start as both start and a far point
    // Create a virtual "end" point to the east to seed the sampling
    const virtualEnd: LngLat = [
      start[0] + radiusM / 111320 / Math.cos((start[1] * Math.PI) / 180),
      start[1],
    ];

    onProgress?.("selecting", "Selecting loop waypoints...");
    const sampledWaypoints = sampleWaypointsFromPaths(
      pathGeometries,
      start,
      virtualEnd,
      16
    );

    if (sampledWaypoints.length === 0) {
      radiusM *= 1.5;
      continue;
    }

    // Filter out waypoints too close to start
    const filtered = sampledWaypoints.filter(
      (wp) => haversineDistance(wp.lngLat, start) > 200
    );

    if (filtered.length === 0) {
      radiusM *= 1.5;
      continue;
    }

    // Order radially for loop
    const orderedWaypoints = orderWaypointsRadial(filtered, start);

    onProgress?.("routing", "Calculating loop route...");
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
      discoveredFeatures: sampledWaypoints,
      selectedWaypoints: orderedWaypoints,
    };

    const ratio = actualDistanceKm / targetDistanceKm;

    if (
      ratio >= 1 - LOOP_DISTANCE_TOLERANCE &&
      ratio <= 1 + LOOP_DISTANCE_TOLERANCE
    ) {
      break;
    }

    if (ratio < 1 - LOOP_DISTANCE_TOLERANCE) {
      radiusM *= 1.2;
    } else {
      radiusM *= 0.85;
    }
  }

  if (!bestResult) {
    throw new Error(
      "Could not generate a loop route. Try a different area or distance."
    );
  }

  onProgress?.("done");
  return bestResult;
}
