"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store";

const MapContainer = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
      <p className="text-zinc-400">Loading map...</p>
    </div>
  ),
});

export default function MapView() {
  const placingMarker = useStore((s) => s.placingMarker);
  const startPoint = useStore((s) => s.startPoint);
  const endPoint = useStore((s) => s.endPoint);
  const setPlacingMarker = useStore((s) => s.setPlacingMarker);
  const setStartPoint = useStore((s) => s.setStartPoint);
  const setEndPoint = useStore((s) => s.setEndPoint);

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setPlacingMarker("start");
  };

  return (
    <div className="relative w-full h-dvh">
      <MapContainer />

      {/* Instruction banner */}
      {placingMarker && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 z-10">
          {placingMarker === "start"
            ? "Tap to set start point"
            : "Tap to set end point"}
        </div>
      )}

      {/* Reset button */}
      {(startPoint || endPoint) && !placingMarker && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleReset}
            className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 hover:bg-white transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
