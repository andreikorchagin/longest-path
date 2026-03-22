import type { LngLat } from "@/types/geo";

export interface StrategicWaypoint {
  id: string;
  lngLat: LngLat;
  pathName: string;
  pathLengthM: number;
  score: number;
}

// Keep ScoredWaypoint as alias for store compatibility
export interface ScoredWaypoint {
  id: string;
  lngLat: LngLat;
  featureType: string;
  score: number;
  isDeadEnd: boolean;
  name?: string;
}

export type RoutingMode = "point-to-point" | "loop";

export type ProgressStep =
  | "discovering"
  | "analyzing"
  | "selecting"
  | "routing"
  | "done";

export interface ProgressCallback {
  (step: ProgressStep, detail?: string): void;
}
