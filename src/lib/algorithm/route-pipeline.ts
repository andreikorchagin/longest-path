import type { LngLat } from "@/types/geo";
import type { Route } from "@/types/route";
import type { StrategicWaypoint, ProgressCallback } from "./types";
import { createCorridor } from "./corridor";
import {
  buildOverpassQuery,
  parsePathGeometries,
  mergeConnectedWays,
} from "./overpass-query";
import { findStrategicWaypoints } from "./path-sampler";
import { orderWaypointsLinear } from "./waypoint-ordering";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";
import { MAX_DETOUR_RATIO } from "@/lib/constants";

export interface PipelineResult {
  route: Route;
  strategicWaypoints: StrategicWaypoint[];
  usedBareRoute: boolean;
}

/**
 * Build a Route object from Mapbox response.
 */
function buildRoute(
  mapboxRoute: { geometry: GeoJSON.LineString; distance: number; duration: number },
  paceMinPerMile: number
): Route {
  const distanceKm = mapboxRoute.distance / 1000;
  const distanceMi = distanceKm * 0.621371;
  return {
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
}

/**
 * Generate a point-to-point route using the "Strategic Nudge" approach.
 *
 * 1. BARE ROUTE: Get baseline from Mapbox with walkway_bias=1
 * 2. DISCOVER: Query Overpass for major car-free paths
 * 3. MERGE: Connect OSM way segments into continuous paths
 * 4. QUALIFY + PLACE: Find strategic waypoints (one midpoint per path, max 3)
 * 5. ROUTE: Get waypointed route from Mapbox
 * 6. SAFETY CHECK: If waypointed route is too long, use bare route
 */
export async function generatePointToPointRoute(
  start: LngLat,
  end: LngLat,
  paceMinPerMile: number = 9,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  // Step 1: Bare route (baseline)
  onProgress?.("routing", "Getting baseline route...");
  const bareData = await getDirections([start, end]);

  if (!bareData.routes || bareData.routes.length === 0) {
    throw new Error("No route found between these points");
  }

  const bareRoute = buildRoute(bareData.routes[0], paceMinPerMile);

  // Step 2: Discover major paths
  onProgress?.("discovering", "Searching for running paths...");
  const bbox = createCorridor(start, end);
  const query = buildOverpassQuery(bbox);
  const overpassData = await queryOverpass(query);

  // Step 3: Parse and merge
  onProgress?.("analyzing", "Merging path segments...");
  const rawPaths = parsePathGeometries(overpassData.elements);
  const mergedPaths = mergeConnectedWays(rawPaths);

  // Step 4: Find strategic waypoints
  onProgress?.("selecting", "Finding best car-free paths...");
  const waypoints = findStrategicWaypoints(mergedPaths, start, end);

  // If no qualifying paths, return bare route
  if (waypoints.length === 0) {
    onProgress?.("done");
    return { route: bareRoute, strategicWaypoints: [], usedBareRoute: true };
  }

  // Step 5: Route with strategic waypoints
  onProgress?.("routing", "Calculating improved route...");
  const ordered = orderWaypointsLinear(
    waypoints.map((w) => ({
      ...w,
      featureType: "footway",
      isDeadEnd: false,
      name: w.pathName,
    })),
    start,
    end
  );

  const coordinates: LngLat[] = [
    start,
    ...ordered.map((wp) => wp.lngLat),
    end,
  ];

  const nudgedData = await getDirections(coordinates);

  if (!nudgedData.routes || nudgedData.routes.length === 0) {
    // Waypointed route failed — return bare route
    onProgress?.("done");
    return { route: bareRoute, strategicWaypoints: [], usedBareRoute: true };
  }

  const nudgedRoute = buildRoute(nudgedData.routes[0], paceMinPerMile);

  // Step 6: Safety check — is the detour worth it?
  const ratio = nudgedRoute.stats.distanceKm / bareRoute.stats.distanceKm;
  if (ratio > MAX_DETOUR_RATIO) {
    // Detour too large — return bare route
    onProgress?.("done");
    return { route: bareRoute, strategicWaypoints: [], usedBareRoute: true };
  }

  onProgress?.("done");
  return {
    route: nudgedRoute,
    strategicWaypoints: waypoints,
    usedBareRoute: false,
  };
}
