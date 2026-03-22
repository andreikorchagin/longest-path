export interface RouteStats {
  distanceKm: number;
  distanceMi: number;
  durationMin: number;
}

export interface Route {
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
  stats: RouteStats;
}
