"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store";
import RouteStats from "./RouteStats";

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
  const isGenerating = useStore((s) => s.isGenerating);
  const routeStats = useStore((s) => s.routeStats);
  const error = useStore((s) => s.error);
  const setPlacingMarker = useStore((s) => s.setPlacingMarker);
  const setStartPoint = useStore((s) => s.setStartPoint);
  const setEndPoint = useStore((s) => s.setEndPoint);
  const generateRoute = useStore((s) => s.generateRoute);
  const clearRoute = useStore((s) => s.clearRoute);

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setPlacingMarker("start");
    clearRoute();
  };

  const canGenerate = startPoint && endPoint && !isGenerating;

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

      {/* Top-right controls */}
      {(startPoint || endPoint) && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleReset}
            className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 hover:bg-white transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Bottom panel */}
      {startPoint && endPoint && !placingMarker && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-5 py-4 min-w-[280px] max-w-[90vw]">
          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}

          {routeStats && <RouteStats />}

          {!routeStats && (
            <button
              onClick={generateRoute}
              disabled={!canGenerate}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 text-white font-medium rounded-xl px-4 py-3 transition-colors text-sm"
            >
              {isGenerating ? "Generating..." : "Generate Route"}
            </button>
          )}

          {routeStats && (
            <button
              onClick={generateRoute}
              disabled={isGenerating}
              className="w-full mt-3 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-50 text-zinc-700 font-medium rounded-xl px-4 py-2.5 transition-colors text-sm"
            >
              {isGenerating ? "Generating..." : "Regenerate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
