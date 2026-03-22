import type { LngLat, BBox } from "@/types/geo";
import { corridorBBox } from "@/lib/geo/bbox";
import { CORRIDOR_EXPANSION } from "@/lib/constants";

/**
 * Create an expanded corridor bounding box between two points.
 * The corridor is expanded by CORRIDOR_EXPANSION (50%) of the
 * straight-line distance on each side to catch parallel features
 * like waterfront paths.
 */
export function createCorridor(start: LngLat, end: LngLat): BBox {
  return corridorBBox(start, end, CORRIDOR_EXPANSION);
}
