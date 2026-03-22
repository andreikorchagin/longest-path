import { useCallback } from "react";
import { Marker } from "react-map-gl/mapbox";
import { useStore } from "@/store";
import type { MarkerDragEvent } from "react-map-gl/mapbox";

export default function WaypointMarkers() {
  const startPoint = useStore((s) => s.startPoint);
  const endPoint = useStore((s) => s.endPoint);
  const setStartPoint = useStore((s) => s.setStartPoint);
  const setEndPoint = useStore((s) => s.setEndPoint);

  const handleStartDragEnd = useCallback(
    (e: MarkerDragEvent) => {
      setStartPoint([e.lngLat.lng, e.lngLat.lat]);
    },
    [setStartPoint]
  );

  const handleEndDragEnd = useCallback(
    (e: MarkerDragEvent) => {
      setEndPoint([e.lngLat.lng, e.lngLat.lat]);
    },
    [setEndPoint]
  );

  return (
    <>
      {startPoint && (
        <Marker
          longitude={startPoint[0]}
          latitude={startPoint[1]}
          anchor="center"
          draggable
          onDragEnd={handleStartDragEnd}
        >
          <div
            role="img"
            aria-label="Start point (draggable)"
            className="w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg shadow-emerald-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </Marker>
      )}
      {endPoint && (
        <Marker
          longitude={endPoint[0]}
          latitude={endPoint[1]}
          anchor="center"
          draggable
          onDragEnd={handleEndDragEnd}
        >
          <div
            role="img"
            aria-label="End point (draggable)"
            className="w-7 h-7 rounded-full bg-red-500 border-[3px] border-white shadow-lg shadow-red-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </Marker>
      )}
    </>
  );
}
