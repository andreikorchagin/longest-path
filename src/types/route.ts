export interface RouteStats {
  distanceKm: number;
  distanceMi: number;
  durationMin: number; // Calculated from pace, not Mapbox walking time
}

export interface Route {
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
  stats: RouteStats;
}
