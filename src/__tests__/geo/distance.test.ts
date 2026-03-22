import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  bearing,
  midpoint,
  projectOntoLine,
  angleBetween,
  movePoint,
} from "@/lib/geo/distance";
import type { LngLat } from "@/types/geo";

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    const p: LngLat = [-74.01, 40.725];
    expect(haversineDistance(p, p)).toBe(0);
  });

  it("calculates distance between NYC and Brooklyn (~5-10km)", () => {
    const manhattan: LngLat = [-74.006, 40.7128];
    const brooklyn: LngLat = [-73.9442, 40.6782];
    const dist = haversineDistance(manhattan, brooklyn);
    expect(dist).toBeGreaterThan(4000);
    expect(dist).toBeLessThan(10000);
  });

  it("is symmetric", () => {
    const a: LngLat = [-74.01, 40.725];
    const b: LngLat = [-73.95, 40.78];
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 5);
  });
});

describe("bearing", () => {
  it("returns ~0 for due north", () => {
    const a: LngLat = [-74.0, 40.0];
    const b: LngLat = [-74.0, 41.0];
    const brng = bearing(a, b);
    expect(brng).toBeCloseTo(0, 0);
  });

  it("returns ~90 for due east", () => {
    const a: LngLat = [-74.0, 40.0];
    const b: LngLat = [-73.0, 40.0];
    const brng = bearing(a, b);
    expect(brng).toBeCloseTo(90, -1); // approximate
  });

  it("returns ~180 for due south", () => {
    const a: LngLat = [-74.0, 41.0];
    const b: LngLat = [-74.0, 40.0];
    const brng = bearing(a, b);
    expect(brng).toBeCloseTo(180, 0);
  });
});

describe("midpoint", () => {
  it("returns the midpoint of two coordinates", () => {
    const a: LngLat = [-74.0, 40.0];
    const b: LngLat = [-73.0, 41.0];
    const mid = midpoint(a, b);
    expect(mid[0]).toBeCloseTo(-73.5, 5);
    expect(mid[1]).toBeCloseTo(40.5, 5);
  });
});

describe("projectOntoLine", () => {
  it("returns 0 for the start point", () => {
    const from: LngLat = [-74.0, 40.0];
    const to: LngLat = [-73.0, 41.0];
    expect(projectOntoLine(from, from, to)).toBeCloseTo(0, 5);
  });

  it("returns 1 for the end point", () => {
    const from: LngLat = [-74.0, 40.0];
    const to: LngLat = [-73.0, 41.0];
    expect(projectOntoLine(to, from, to)).toBeCloseTo(1, 5);
  });

  it("returns ~0.5 for the midpoint", () => {
    const from: LngLat = [-74.0, 40.0];
    const to: LngLat = [-73.0, 41.0];
    const mid: LngLat = [-73.5, 40.5];
    expect(projectOntoLine(mid, from, to)).toBeCloseTo(0.5, 5);
  });
});

describe("angleBetween", () => {
  it("returns 0 for same bearing", () => {
    expect(angleBetween(45, 45)).toBe(0);
  });

  it("returns 90 for perpendicular bearings", () => {
    expect(angleBetween(0, 90)).toBe(90);
  });

  it("returns 180 for opposite bearings", () => {
    expect(angleBetween(0, 180)).toBe(180);
  });

  it("handles wrap-around", () => {
    expect(angleBetween(10, 350)).toBe(20);
  });
});

describe("movePoint", () => {
  it("moves a point north", () => {
    const origin: LngLat = [-74.0, 40.0];
    const moved = movePoint(origin, 1000, 0); // 1km north
    expect(moved[0]).toBeCloseTo(-74.0, 2); // longitude unchanged
    expect(moved[1]).toBeGreaterThan(40.0); // latitude increased
  });

  it("moves a point east", () => {
    const origin: LngLat = [-74.0, 40.0];
    const moved = movePoint(origin, 1000, 90); // 1km east
    expect(moved[0]).toBeGreaterThan(-74.0); // longitude increased
    expect(moved[1]).toBeCloseTo(40.0, 2); // latitude roughly unchanged
  });

  it("distance of moved point matches input distance", () => {
    const origin: LngLat = [-74.0, 40.0];
    const moved = movePoint(origin, 5000, 45);
    const dist = haversineDistance(origin, moved);
    expect(dist).toBeCloseTo(5000, -1); // within ~10m
  });
});
