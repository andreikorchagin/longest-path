import type { LngLat } from "@/types/geo";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Haversine distance between two points in meters */
export function haversineDistance(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Bearing from point a to point b in degrees (0-360) */
export function bearing(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLng = toRad(lng2 - lng1);
  const lat1R = toRad(lat1);
  const lat2R = toRad(lat2);
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x =
    Math.cos(lat1R) * Math.sin(lat2R) -
    Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/** Midpoint between two coordinates */
export function midpoint(a: LngLat, b: LngLat): LngLat {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** Project point onto the line from `from` to `to`, return scalar (0 = at from, 1 = at to) */
export function projectOntoLine(
  point: LngLat,
  from: LngLat,
  to: LngLat
): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (dx === 0 && dy === 0) return 0;
  return (
    ((point[0] - from[0]) * dx + (point[1] - from[1]) * dy) /
    (dx * dx + dy * dy)
  );
}

/** Angular difference between two bearings (0-180) */
export function angleBetween(bearing1: number, bearing2: number): number {
  let diff = Math.abs(bearing1 - bearing2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** Move a point by a distance (meters) in a bearing (degrees) */
export function movePoint(
  origin: LngLat,
  distanceM: number,
  bearingDeg: number
): LngLat {
  const lat1 = toRad(origin[1]);
  const lng1 = toRad(origin[0]);
  const brng = toRad(bearingDeg);
  const d = distanceM / EARTH_RADIUS_M;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lng2), toDeg(lat2)];
}
