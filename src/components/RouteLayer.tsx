import { Source, Layer } from "react-map-gl/mapbox";
import { useStore } from "@/store";

export default function RouteLayer() {
  const routeGeoJSON = useStore((s) => s.routeGeoJSON);

  if (!routeGeoJSON) return null;

  return (
    <Source id="route" type="geojson" data={routeGeoJSON}>
      {/* Outer glow */}
      <Layer
        id="route-glow"
        type="line"
        paint={{
          "line-color": "#3b82f6",
          "line-width": 10,
          "line-opacity": 0.15,
          "line-blur": 4,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
      />
      {/* Main line */}
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#2563eb",
          "line-width": 4,
          "line-opacity": 0.85,
        }}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
      />
    </Source>
  );
}
