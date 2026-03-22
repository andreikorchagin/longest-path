import { Source, Layer } from "react-map-gl/mapbox";
import { useStore } from "@/store";

export default function RouteLayer() {
  const routeGeoJSON = useStore((s) => s.routeGeoJSON);

  if (!routeGeoJSON) return null;

  return (
    <Source id="route" type="geojson" data={routeGeoJSON}>
      <Layer
        id="route-outline"
        type="line"
        paint={{
          "line-color": "#1e3a5f",
          "line-width": 6,
          "line-opacity": 0.4,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
      />
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.9,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
      />
    </Source>
  );
}
