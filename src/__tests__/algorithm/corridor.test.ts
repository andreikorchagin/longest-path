import { describe, it, expect } from "vitest";
import { createCorridor } from "@/lib/algorithm/corridor";
import type { LngLat } from "@/types/geo";

describe("createCorridor", () => {
  it("creates a corridor that contains both points", () => {
    const start: LngLat = [-74.01, 40.72];
    const end: LngLat = [-73.95, 40.78];

    const bbox = createCorridor(start, end);

    expect(bbox.south).toBeLessThan(40.72);
    expect(bbox.north).toBeGreaterThan(40.78);
    expect(bbox.west).toBeLessThan(-74.01);
    expect(bbox.east).toBeGreaterThan(-73.95);
  });

  it("is wider than the straight-line distance", () => {
    const start: LngLat = [-74.01, 40.72];
    const end: LngLat = [-73.95, 40.78];

    const bbox = createCorridor(start, end);

    const corridorWidth = bbox.east - bbox.west;
    const straightWidth = Math.abs(end[0] - start[0]);

    expect(corridorWidth).toBeGreaterThan(straightWidth);
  });
});
