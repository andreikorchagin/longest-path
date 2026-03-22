export type LngLat = [number, number]; // [longitude, latitude]

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}
