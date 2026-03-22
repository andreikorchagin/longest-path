import { describe, it, expect } from "vitest";
import {
  buildOverpassQuery,
  parsePathGeometries,
} from "@/lib/algorithm/overpass-query";
import type { OverpassElement } from "@/types/overpass";

describe("buildOverpassQuery", () => {
  it("includes path, pier, and park queries", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    expect(query).toContain("footway");
    expect(query).toContain("cycleway");
    expect(query).toContain("pier");
    expect(query).toContain("park");
    expect(query).toContain("out geom");
  });

  it("includes the bounding box coordinates", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    expect(query).toContain("40.7,-74.02,40.75,-73.95");
  });
});

describe("parsePathGeometries", () => {
  it("converts a pier element to a pier path geometry", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 123,
        tags: { man_made: "pier", name: "Pier 40" },
        geometry: [
          { lat: 40.727, lon: -74.011 },
          { lat: 40.725, lon: -74.013 },
        ],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(1);
    expect(paths[0].type).toBe("pier");
    expect(paths[0].name).toBe("Pier 40");
    expect(paths[0].coordinates).toHaveLength(2);
    expect(paths[0].coordinates[0]).toEqual([-74.011, 40.727]);
  });

  it("converts a footway element to a running_path", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 456,
        tags: { highway: "footway", name: "Hudson River Greenway" },
        geometry: [
          { lat: 40.72, lon: -74.01 },
          { lat: 40.73, lon: -74.01 },
          { lat: 40.74, lon: -74.01 },
        ],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(1);
    expect(paths[0].type).toBe("running_path");
    expect(paths[0].name).toBe("Hudson River Greenway");
    expect(paths[0].coordinates).toHaveLength(3);
  });

  it("converts a park boundary", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 789,
        tags: { leisure: "park", name: "Battery Park" },
        geometry: [
          { lat: 40.70, lon: -74.02 },
          { lat: 40.71, lon: -74.01 },
        ],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(1);
    expect(paths[0].type).toBe("park");
  });

  it("skips elements without geometry", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 111,
        tags: { man_made: "pier" },
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(0);
  });

  it("skips elements with only one geometry point", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 222,
        tags: { highway: "footway" },
        geometry: [{ lat: 40.72, lon: -74.01 }],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(0);
  });

  it("skips non-way elements", () => {
    const elements: OverpassElement[] = [
      {
        type: "node",
        id: 333,
        tags: { tourism: "viewpoint" },
        lat: 40.73,
        lon: -74.005,
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(0);
  });
});
