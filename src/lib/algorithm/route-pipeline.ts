import type { LngLat } from "@/types/geo";
import type { Route, RouteStats } from "@/types/route";
import type { ScoredWaypoint } from "./types";
import { createCorridor } from "./corridor";
import { buildOverpassQuery, elementsToWaypoints } from "./overpass-query";
import { selectWaypoints } from "./waypoint-selection";
import { orderWaypointsLinear } from "./waypoint-ordering";
import { queryOverpass } from "@/lib/api/overpass";
import { getDirections } from "@/lib/api/mapbox-directions";

export interface PipelineResult {
  route: Route;
  discoveredFeatures: ScoredWaypoint[];
  selectedWaypoints: ScoredWaypoint[];
}

/**
 * Generate a point-to-point route that maximizes interesting exploration.
 *
 * 1. Create expanded corridor between start and end
 * 2. Query Overpass for interesting features
 * 3. Score and select waypoints (anti-zigzag)
 * 4. Order waypoints along travel direction
 * 5. Route through Mapbox Directions API
 */
export async function generatePointToPointRoute(
  start: LngLat,
  end: LngLat
): Promise<PipelineResult> {
  // Step 1: Create corridor
  const bbox = createCorridor(start, end);

  // Step 2: Query Overpass for features
  const query = buildOverpassQuery(bbox);
  const overpassData = await queryOverpass(query);
  const discoveredFeatures = elementsToWaypoints(overpassData.elements);

  // Step 3: Select waypoints
  const selectedWaypoints = selectWaypoints(discoveredFeatures, start, end);

  // Step 4: Order waypoints
  const orderedWaypoints = orderWaypointsLinear(selectedWaypoints, start, end);

  // Step 5: Build coordinate list and route
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

  return { route, discoveredFeatures, selectedWaypoints: orderedWaypoints };
}
