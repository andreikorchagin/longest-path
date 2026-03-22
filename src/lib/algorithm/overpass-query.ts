import type { BBox } from "@/types/geo";
import type { FeatureType, OverpassElement } from "@/types/overpass";
import type { LngLat } from "@/types/geo";
import type { ScoredWaypoint } from "./types";
import { bboxToOverpass } from "@/lib/geo/bbox";
import { FEATURE_SCORES, DEAD_END_BONUS, DEAD_END_FEATURES } from "@/lib/constants";

/** Build an Overpass QL query for interesting features in a bounding box */
export function buildOverpassQuery(bbox: BBox): string {
  const b = bboxToOverpass(bbox);

  return `
[out:json][timeout:25];
(
  way["man_made"="pier"](${b});
  way["man_made"="breakwater"](${b});
  node["tourism"="viewpoint"](${b});
  way["leisure"="marina"](${b});
  way["leisure"="park"](${b});
  relation["leisure"="park"](${b});
  way["highway"="footway"]["name"](${b});
  way["highway"="cycleway"]["name"](${b});
  way["highway"="path"]["name"](${b});
  way["natural"="coastline"](${b});
);
out geom;
`.trim();
}

/** Determine the feature type from OSM tags */
function classifyElement(el: OverpassElement): FeatureType | null {
  const tags = el.tags || {};

  if (tags["man_made"] === "pier" || tags["man_made"] === "breakwater")
    return "pier";
  if (tags["leisure"] === "marina") return "marina";
  if (tags["tourism"] === "viewpoint") return "viewpoint";
  if (tags["natural"] === "coastline") return "waterfront";
  if (tags["leisure"] === "park") return "park";
  if (tags["highway"] === "footway") return "footway";
  if (tags["highway"] === "cycleway") return "cycleway";
  if (tags["highway"] === "path") return "path";

  return null;
}

/** Extract the best waypoint coordinate from an element */
function extractWaypoint(el: OverpassElement): LngLat | null {
  // Node: use its coordinates
  if (el.type === "node" && el.lat !== undefined && el.lon !== undefined) {
    return [el.lon, el.lat];
  }

  // Way: use the endpoint farthest from the start (for piers, this is the tip)
  if (el.type === "way" && el.geometry && el.geometry.length > 0) {
    const featureType = classifyElement(el);

    if (featureType === "pier") {
      // For piers, use the endpoint (tip)
      const last = el.geometry[el.geometry.length - 1];
      return [last.lon, last.lat];
    }

    // For parks and other areas, use centroid
    if (featureType === "park") {
      const lats = el.geometry.map((g) => g.lat);
      const lons = el.geometry.map((g) => g.lon);
      return [
        lons.reduce((a, b) => a + b, 0) / lons.length,
        lats.reduce((a, b) => a + b, 0) / lats.length,
      ];
    }

    // For linear features (paths, waterfront), use midpoint
    const mid = Math.floor(el.geometry.length / 2);
    return [el.geometry[mid].lon, el.geometry[mid].lat];
  }

  // Relations (e.g., park relations): use bounds centroid
  if (el.type === "relation" && el.bounds) {
    return [
      (el.bounds.minlon + el.bounds.maxlon) / 2,
      (el.bounds.minlat + el.bounds.maxlat) / 2,
    ];
  }

  return null;
}

/** Convert Overpass elements to scored waypoints */
export function elementsToWaypoints(
  elements: OverpassElement[]
): ScoredWaypoint[] {
  const waypoints: ScoredWaypoint[] = [];

  for (const el of elements) {
    const featureType = classifyElement(el);
    if (!featureType) continue;

    const lngLat = extractWaypoint(el);
    if (!lngLat) continue;

    const isDeadEnd = DEAD_END_FEATURES.includes(featureType);
    const baseScore = FEATURE_SCORES[featureType];
    const score = isDeadEnd ? baseScore + DEAD_END_BONUS : baseScore;

    waypoints.push({
      id: `${el.type}-${el.id}`,
      lngLat,
      featureType,
      score,
      isDeadEnd,
      name: el.tags?.name,
    });
  }

  return waypoints;
}
