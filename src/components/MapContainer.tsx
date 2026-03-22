"use client";

import { useCallback } from "react";
import Map, { type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useStore } from "@/store";
import WaypointMarkers from "./WaypointMarkers";
import RouteLayer from "./RouteLayer";
import FeatureMarkers from "./FeatureMarkers";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapContainer() {
  const viewState = useStore((s) => s.viewState);
  const setViewState = useStore((s) => s.setViewState);
  const placingMarker = useStore((s) => s.placingMarker);
  const setStartPoint = useStore((s) => s.setStartPoint);
  const setEndPoint = useStore((s) => s.setEndPoint);
  const setPlacingMarker = useStore((s) => s.setPlacingMarker);
  const selectedWaypoints = useStore((s) => s.selectedWaypoints);
  const mode = useStore((s) => s.mode);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (placingMarker === "start") {
        setStartPoint(lngLat);
        if (mode === "point-to-point") {
          setPlacingMarker("end");
        } else {
          setPlacingMarker(null);
        }
      } else if (placingMarker === "end") {
        setEndPoint(lngLat);
        setPlacingMarker(null);
      }
    },
    [placingMarker, mode, setStartPoint, setEndPoint, setPlacingMarker]
  );

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      onClick={handleClick}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      style={{ width: "100%", height: "100%" }}
      cursor={placingMarker ? "crosshair" : "grab"}
    >
      <RouteLayer />
      {selectedWaypoints.length > 0 && (
        <FeatureMarkers waypoints={selectedWaypoints} />
      )}
      <WaypointMarkers />
    </Map>
  );
}
