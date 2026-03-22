import { describe, it, expect } from "vitest";
import {
  buildOverpassQuery,
  elementsToWaypoints,
} from "@/lib/algorithm/overpass-query";
import type { OverpassElement } from "@/types/overpass";

describe("buildOverpassQuery", () => {
  it("includes pier, park, footway, and viewpoint queries", () => {
    const query = buildOverpassQuery({
      south: 40.7,
      west: -74.02,
      north: 40.75,
      east: -73.95,
    });

    expect(query).toContain("man_made");
    expect(query).toContain("pier");
    expect(query).toContain("leisure");
    expect(query).toContain("park");
    expect(query).toContain("footway");
    expect(query).toContain("viewpoint");
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

describe("elementsToWaypoints", () => {
  it("converts a pier element to a scored waypoint", () => {
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

    const waypoints = elementsToWaypoints(elements);

    expect(waypoints).toHaveLength(1);
    expect(waypoints[0].featureType).toBe("pier");
    expect(waypoints[0].isDeadEnd).toBe(true);
    expect(waypoints[0].score).toBe(100); // 90 base + 10 dead-end bonus
    expect(waypoints[0].name).toBe("Pier 40");
    // Pier should use the last point (tip)
    expect(waypoints[0].lngLat[0]).toBeCloseTo(-74.013, 3);
    expect(waypoints[0].lngLat[1]).toBeCloseTo(40.725, 3);
  });

  it("converts a park element using centroid", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 456,
        tags: { leisure: "park", name: "Battery Park" },
        geometry: [
          { lat: 40.70, lon: -74.02 },
          { lat: 40.70, lon: -74.01 },
          { lat: 40.71, lon: -74.01 },
          { lat: 40.71, lon: -74.02 },
        ],
      },
    ];

    const waypoints = elementsToWaypoints(elements);

    expect(waypoints).toHaveLength(1);
    expect(waypoints[0].featureType).toBe("park");
    expect(waypoints[0].isDeadEnd).toBe(false);
    // Centroid
    expect(waypoints[0].lngLat[0]).toBeCloseTo(-74.015, 3);
    expect(waypoints[0].lngLat[1]).toBeCloseTo(40.705, 3);
  });

  it("converts a viewpoint node", () => {
    const elements: OverpassElement[] = [
      {
        type: "node",
        id: 789,
        tags: { tourism: "viewpoint" },
        lat: 40.73,
        lon: -74.005,
      },
    ];

    const waypoints = elementsToWaypoints(elements);

    expect(waypoints).toHaveLength(1);
    expect(waypoints[0].featureType).toBe("viewpoint");
    expect(waypoints[0].score).toBe(70);
  });

  it("skips elements with no recognized tags", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 999,
        tags: { building: "yes" },
        geometry: [{ lat: 40.73, lon: -74.005 }],
      },
    ];

    const waypoints = elementsToWaypoints(elements);
    expect(waypoints).toHaveLength(0);
  });

  it("handles elements with no geometry", () => {
    const elements: OverpassElement[] = [
      {
        type: "way",
        id: 111,
        tags: { man_made: "pier" },
      },
    ];

    const waypoints = elementsToWaypoints(elements);
    expect(waypoints).toHaveLength(0);
  });
});
