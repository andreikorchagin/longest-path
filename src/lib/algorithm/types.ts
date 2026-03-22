import type { LngLat } from "@/types/geo";
import type { FeatureType } from "@/types/overpass";

export interface ScoredWaypoint {
  id: string;
  lngLat: LngLat;
  featureType: FeatureType;
  score: number;
  isDeadEnd: boolean;
  name?: string;
}

export type RoutingMode = "point-to-point" | "loop";

export interface RoutePreferences {
  preferWaterfront: boolean;
  exploreDeadEnds: boolean;
  avoidBacktracking: boolean;
  stayOnRunningPaths: boolean;
}

export const DEFAULT_PREFERENCES: RoutePreferences = {
  preferWaterfront: true,
  exploreDeadEnds: true,
  avoidBacktracking: true,
  stayOnRunningPaths: true,
};
