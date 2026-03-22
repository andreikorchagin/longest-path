export type FeatureType =
  | "pier"
  | "marina"
  | "viewpoint"
  | "waterfront"
  | "park"
  | "footway"
  | "cycleway"
  | "path";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  geometry?: Array<{ lat: number; lon: number }>;
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  members?: Array<{
    type: "node" | "way" | "relation";
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}
