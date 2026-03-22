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
          anchor="bottom"
          draggable
          onDragEnd={(e) => {
            useStore
              .getState()
              .setStartPoint([e.lngLat.lng, e.lngLat.lat]);
          }}
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-emerald-500 -mt-0.5" />
          </div>
        </Marker>
      )}
      {endPoint && (
        <Marker
          longitude={endPoint[0]}
          latitude={endPoint[1]}
          anchor="bottom"
          draggable
          onDragEnd={(e) => {
            useStore
              .getState()
              .setEndPoint([e.lngLat.lng, e.lngLat.lat]);
          }}
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              E
            </div>
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 -mt-0.5" />
          </div>
        </Marker>
      )}
    </>
  );
}
