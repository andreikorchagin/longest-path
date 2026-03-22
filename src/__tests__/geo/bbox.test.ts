import { describe, it, expect } from "vitest";
import { corridorBBox, radiusBBox, bboxToOverpass } from "@/lib/geo/bbox";
import type { LngLat } from "@/types/geo";

describe("corridorBBox", () => {
  it("creates a bbox that contains both points", () => {
    const start: LngLat = [-74.01, 40.72];
    const end: LngLat = [-73.95, 40.78];
    const bbox = corridorBBox(start, end, 0.5);

    expect(bbox.south).toBeLessThan(40.72);
    expect(bbox.north).toBeGreaterThan(40.78);
    expect(bbox.west).toBeLessThan(-74.01);
    expect(bbox.east).toBeGreaterThan(-73.95);
  });

  it("expands by the specified factor", () => {
    const start: LngLat = [-74.0, 40.0];
    const end: LngLat = [-73.0, 41.0];
    const bbox0 = corridorBBox(start, end, 0);
    const bbox50 = corridorBBox(start, end, 0.5);

    // Expanded bbox should be larger
    expect(bbox50.south).toBeLessThan(bbox0.south);
    expect(bbox50.north).toBeGreaterThan(bbox0.north);
  });

  it("has minimum expansion for very close points", () => {
    const p: LngLat = [-74.0, 40.0];
    const bbox = corridorBBox(p, p, 0.5);

    // Should still have some area even for same point
    expect(bbox.north - bbox.south).toBeGreaterThan(0.005);
    expect(bbox.east - bbox.west).toBeGreaterThan(0.005);
  });
});

describe("radiusBBox", () => {
  it("creates a bbox centered on the point", () => {
    const center: LngLat = [-74.0, 40.0];
    const bbox = radiusBBox(center, 1000);

    const latMid = (bbox.south + bbox.north) / 2;
    const lngMid = (bbox.west + bbox.east) / 2;

    expect(latMid).toBeCloseTo(40.0, 3);
    expect(lngMid).toBeCloseTo(-74.0, 3);
  });

  it("has correct approximate size", () => {
    const center: LngLat = [-74.0, 40.0];
    const bbox = radiusBBox(center, 1000); // 1km radius

    // 1km ≈ 0.009 degrees latitude
    const latSpan = bbox.north - bbox.south;
    expect(latSpan).toBeCloseTo(0.018, 2); // diameter ≈ 2km
  });
});

describe("bboxToOverpass", () => {
  it("formats bbox as south,west,north,east", () => {
    const result = bboxToOverpass({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });
    expect(result).toBe("40.7,-74.02,40.75,-73.95");
  });
});
