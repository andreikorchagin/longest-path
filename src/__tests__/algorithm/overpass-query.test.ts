import { describe, it, expect } from "vitest";
import {
  buildOverpassQuery,
  parsePathGeometries,
  mergeConnectedWays,
} from "@/lib/algorithm/overpass-query";
import type { OverpassElement } from "@/types/overpass";
import type { PathGeometry } from "@/lib/algorithm/overpass-query";

describe("buildOverpassQuery", () => {
  it("includes named footway, cycleway, and path queries", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    expect(query).toContain('"highway"="footway"');
    expect(query).toContain('"highway"="cycleway"');
    expect(query).toContain('"name"');
    expect(query).toContain("out geom");
  });

  it("includes designated path queries", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    expect(query).toContain('"foot"="designated"');
    expect(query).toContain('"bicycle"="designated"');
  });

  it("does NOT include unnamed generic footways", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    // Every footway/cycleway/path query should have a name or designated filter
    const lines = query.split("\n").filter((l) => l.includes("highway"));
    for (const line of lines) {
      expect(
        line.includes('"name"') || line.includes('"designated"')
      ).toBe(true);
    }
  });
});

describe("parsePathGeometries", () => {
  it("parses a named footway as running_path", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 123,
        tags: { highway: "footway", name: "Hudson River Greenway" },
        geometry: [
          { lat: 40.727, lon: -74.011 },
          { lat: 40.725, lon: -74.013 },
        ],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(1);
    expect(paths[0].type).toBe("running_path");
    expect(paths[0].name).toBe("Hudson River Greenway");
  });

  it("parses coastline as waterfront", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 456,
        tags: { natural: "coastline" },
        geometry: [
          { lat: 40.72, lon: -74.015 },
          { lat: 40.73, lon: -74.015 },
        ],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(1);
    expect(paths[0].type).toBe("waterfront");
  });

  it("skips elements with insufficient geometry", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 789,
        tags: { highway: "footway", name: "Short" },
        geometry: [{ lat: 40.72, lon: -74.01 }],
      },
    ];

    const paths = parsePathGeometries(elements);
    expect(paths).toHaveLength(0);
  });
});

describe("mergeConnectedWays", () => {
  it("merges same-named segments that share endpoints", () => {
    const paths: PathGeometry[] = [
      {
        id: "way-1",
        type: "running_path",
        name: "Greenway",
        coordinates: [[-74.01, 40.72], [-74.01, 40.725]],
        tags: { highway: "footway" },
      },
      {
        id: "way-2",
        type: "running_path",
        name: "Greenway",
        coordinates: [[-74.01, 40.725], [-74.01, 40.73]],
        tags: { highway: "footway" },
      },
    ];

    const merged = mergeConnectedWays(paths);
    const greenway = merged.filter((p) => p.name === "Greenway");
    expect(greenway).toHaveLength(1);
    expect(greenway[0].coordinates.length).toBeGreaterThan(2);
  });

  it("keeps separate chains for disconnected segments with same name", () => {
    const paths: PathGeometry[] = [
      {
        id: "way-1",
        type: "running_path",
        name: "Trail",
        coordinates: [[-74.01, 40.72], [-74.01, 40.725]],
        tags: { highway: "footway" },
      },
      {
        id: "way-2",
        type: "running_path",
        name: "Trail",
        // Far away — won't merge
        coordinates: [[-73.95, 40.80], [-73.95, 40.805]],
        tags: { highway: "footway" },
      },
    ];

    const merged = mergeConnectedWays(paths);
    const trails = merged.filter((p) => p.name === "Trail");
    expect(trails).toHaveLength(2);
  });

  it("filters out short unnamed paths", () => {
    const paths: PathGeometry[] = [
      {
        id: "way-1",
        type: "running_path",
        coordinates: [[-74.01, 40.72], [-74.01, 40.72005]], // ~5m
        tags: { highway: "footway" },
      },
    ];

    const merged = mergeConnectedWays(paths);
    expect(merged).toHaveLength(0);
  });

  it("keeps long unnamed paths", () => {
    const coords: [number, number][] = [];
    for (let i = 0; i < 20; i++) {
      coords.push([-74.01, 40.72 + i * 0.0003]); // ~600m total
    }

    const paths: PathGeometry[] = [
      {
        id: "way-1",
        type: "running_path",
        coordinates: coords,
        tags: { highway: "footway" },
      },
    ];

    const merged = mergeConnectedWays(paths);
    expect(merged).toHaveLength(1);
  });
});
