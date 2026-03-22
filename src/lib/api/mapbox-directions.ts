import type { LngLat } from "@/types/geo";

interface DirectionsResponse {
  routes: Array<{
    geometry: GeoJSON.LineString;
    distance: number; // meters
    duration: number; // seconds
  }>;
}

export async function getDirections(
  coordinates: LngLat[],
  walkwayBias: number = 1
): Promise<DirectionsResponse> {
  const coordString = coordinates
    .map(([lng, lat]) => `${lng},${lat}`)
    .join(";");

  const res = await fetch("/api/directions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coordinates: coordString, walkwayBias }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directions API error: ${res.status} ${text}`);
  }

  return res.json();
}
