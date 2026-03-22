import type { LngLat } from "@/types/geo";
import type { Route } from "@/types/route";
import type { ScoredWaypoint, ProgressCallback } from "./types";
import { createCorridor } from "./corridor";
import { buildOverpassQuery, parsePathGeometries } from "./overpass-query";
import { sampleWaypointsFromPaths } from "./path-sampler";
import { orderWaypointsLinear } from "./waypoint-ordering";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";

export interface PipelineResult {
  route: Route;
  discoveredFeatures: ScoredWaypoint[];
  selectedWaypoints: ScoredWaypoint[];
}

/**
 * Generate a point-to-point route that follows running infrastructure.
 *
 * New approach: "path-following" instead of "point-hopping"
 * 1. Query Overpass for path geometries (footways, waterfront, piers)
 * 2. Sample waypoints along these paths (not isolated centroids)
 * 3. Score by water proximity and path quality
 * 4. Order along travel direction
 * 5. Route through Mapbox — waypoints follow actual paths, so no zigzag
 */
export async function generatePointToPointRoute(
  start: LngLat,
  end: LngLat,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  // Step 1: Create corridor
  onProgress?.("discovering", "Searching for running paths...");
  const bbox = createCorridor(start, end);

  // Step 2: Query Overpass for path geometries
  const query = buildOverpassQuery(bbox);
  const overpassData = await queryOverpass(query);

  // Step 3: Parse into typed path geometries
  onProgress?.("analyzing", "Analyzing path network...");
  const pathGeometries = parsePathGeometries(overpassData.elements);

  // Step 4: Sample waypoints along paths, scored by quality
  onProgress?.("selecting", "Selecting best route...");
  const sampledWaypoints = sampleWaypointsFromPaths(
    pathGeometries,
    start,
    end,
    20 // Keep under 23 (Mapbox limit minus start/end)
  );

  // Step 5: Order along travel direction
  const orderedWaypoints = orderWaypointsLinear(sampledWaypoints, start, end);

  // Step 6: Route through Mapbox
  onProgress?.("routing", "Calculating route...");
  const coordinates: LngLat[] = [
    start,
    ...orderedWaypoints.map((wp) => wp.lngLat),
    end,
  ];

  const data = await getDirections(coordinates);

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No route found");
  }

  const mapboxRoute = data.routes[0];
  const distanceKm = mapboxRoute.distance / 1000;

  const route: Route = {
    geometry: {
      type: "Feature",
      properties: {},
      geometry: mapboxRoute.geometry,
    },
    stats: {
      distanceKm,
      distanceMi: distanceKm * 0.621371,
      durationMin: mapboxRoute.duration / 60,
    },
  };

  onProgress?.("done");

  return {
    route,
    discoveredFeatures: sampledWaypoints, // All sampled waypoints
    selectedWaypoints: orderedWaypoints,   // The ones used in routing
  };
}
