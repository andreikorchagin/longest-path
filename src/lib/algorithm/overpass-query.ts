import type { BBox } from "@/types/geo";
import type { OverpassElement } from "@/types/overpass";
import type { LngLat } from "@/types/geo";
import { bboxToOverpass } from "@/lib/geo/bbox";

/**
 * Build Overpass query focused on continuous path geometries
 * and water features for proximity scoring.
 */
export function buildOverpassQuery(bbox: BBox): string {
  const b = bboxToOverpass(bbox);

  return `
[out:json][timeout:30];
(
  way["highway"="footway"](${b});
  way["highway"="cycleway"](${b});
  way["highway"="path"](${b});
  way["highway"="pedestrian"](${b});
  way["man_made"="pier"](${b});
  way["man_made"="breakwater"](${b});
  way["natural"="coastline"](${b});
  way["waterway"="riverbank"](${b});
  way["leisure"="park"](${b});
);
out geom;
`.trim();
}

export interface PathGeometry {
  id: string;
  type: "running_path" | "pier" | "waterfront" | "park";
  name?: string;
  coordinates: LngLat[]; // Full path geometry as [lng, lat] pairs
  tags: Record<string, string>;
}

/**
 * Parse Overpass elements into typed path geometries.
 */
export function parsePathGeometries(
  elements: OverpassElement[]
): PathGeometry[] {
  const paths: PathGeometry[] = [];

  for (const el of elements) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;

    const tags = el.tags || {};
    const coords: LngLat[] = el.geometry.map((g) => [g.lon, g.lat]);

    // Classify the element
    if (tags["man_made"] === "pier" || tags["man_made"] === "breakwater") {
      paths.push({
        id: `way-${el.id}`,
        type: "pier",
        name: tags.name,
        coordinates: coords,
        tags,
      });
    } else if (
      tags["natural"] === "coastline" ||
      tags["waterway"] === "riverbank"
    ) {
      paths.push({
        id: `way-${el.id}`,
        type: "waterfront",
        name: tags.name,
        coordinates: coords,
        tags,
      });
    } else if (tags["leisure"] === "park") {
      paths.push({
        id: `way-${el.id}`,
        type: "park",
        name: tags.name,
        coordinates: coords,
        tags,
      });
    } else if (
      tags["highway"] === "footway" ||
      tags["highway"] === "cycleway" ||
      tags["highway"] === "path" ||
      tags["highway"] === "pedestrian"
    ) {
      paths.push({
        id: `way-${el.id}`,
        type: "running_path",
        name: tags.name,
        coordinates: coords,
        tags,
      });
    }
  }

  return paths;
}
