import { Marker } from "react-map-gl/mapbox";
import { useStore } from "@/store";

export default function WaypointMarkers() {
  const startPoint = useStore((s) => s.startPoint);
  const endPoint = useStore((s) => s.endPoint);

  return (
    <>
      {startPoint && (
        <Marker
          longitude={startPoint[0]}
          latitude={startPoint[1]}
          anchor="center"
          draggable
          onDragEnd={(e) => {
            useStore
              .getState()
              .setStartPoint([e.lngLat.lng, e.lngLat.lat]);
          }}
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-white shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        </Marker>
      )}
      {endPoint && (
        <Marker
          longitude={endPoint[0]}
          latitude={endPoint[1]}
          anchor="center"
          draggable
          onDragEnd={(e) => {
            useStore
              .getState()
              .setEndPoint([e.lngLat.lng, e.lngLat.lat]);
          }}
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-red-500 border-[3px] border-white shadow-lg shadow-red-500/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        </Marker>
      )}
    </>
  );
}
