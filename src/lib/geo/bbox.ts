import type { LngLat, BBox } from "@/types/geo";

/** Create a bounding box from two points, expanded by a factor of the distance */
export function corridorBBox(
  start: LngLat,
  end: LngLat,
  expansionFactor: number
): BBox {
  const minLng = Math.min(start[0], end[0]);
  const maxLng = Math.max(start[0], end[0]);
  const minLat = Math.min(start[1], end[1]);
  const maxLat = Math.max(start[1], end[1]);

  const dLng = (maxLng - minLng) * expansionFactor;
  const dLat = (maxLat - minLat) * expansionFactor;

  // Ensure minimum expansion even for very close points
  const minExpansion = 0.005; // ~500m

  return {
    south: minLat - Math.max(dLat, minExpansion),
    west: minLng - Math.max(dLng, minExpansion),
    north: maxLat + Math.max(dLat, minExpansion),
    east: maxLng + Math.max(dLng, minExpansion),
  };
}

/** Create a bounding box from a center point and radius in meters */
export function radiusBBox(center: LngLat, radiusM: number): BBox {
  // Approximate: 1 degree lat ≈ 111,320m
  const latDelta = radiusM / 111320;
  const lngDelta = radiusM / (111320 * Math.cos((center[1] * Math.PI) / 180));

  return {
    south: center[1] - latDelta,
    west: center[0] - lngDelta,
    north: center[1] + latDelta,
    east: center[0] + lngDelta,
  };
}

/** Format bbox for Overpass API (south,west,north,east) */
export function bboxToOverpass(bbox: BBox): string {
  return `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
}
