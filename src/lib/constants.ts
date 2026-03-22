import type { FeatureType } from "@/types/overpass";

export const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
export const OVERPASS_FALLBACK_URL =
  "https://overpass.kumi.systems/api/interpreter";

// Scoring weights for feature types (0-100)
export const FEATURE_SCORES: Record<FeatureType, number> = {
  pier: 90,
  marina: 75,
  viewpoint: 70,
  waterfront: 65,
  park: 55,
  footway: 35,
  cycleway: 30,
  path: 20,
};

// Dead-end bonus for features where you want to route out-and-back
export const DEAD_END_BONUS = 10;

// Features that are inherently dead-ends (route out and back)
export const DEAD_END_FEATURES: FeatureType[] = ["pier"];

// Max waypoints for Mapbox Directions (25 total, reserve 2 for start/end)
export const MAX_WAYPOINTS = 23;

// Minimum distance between waypoints (meters)
export const DEDUP_RADIUS_M = 200;

// Corridor expansion factor (fraction of straight-line distance)
export const CORRIDOR_EXPANSION = 0.5;

// Loop mode: search radius factor
export const LOOP_RADIUS_FACTOR = 1.3;

// Distance tolerance for loop mode (accept if within this % of target)
export const LOOP_DISTANCE_TOLERANCE = 0.15;

// Max iterations for loop distance adjustment
export const LOOP_MAX_ITERATIONS = 3;
