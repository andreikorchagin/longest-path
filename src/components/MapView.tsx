"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store";
import RouteStats from "./RouteStats";
import ModeSelector from "./ModeSelector";
import DistanceSlider from "./DistanceSlider";
import { useGeolocation } from "@/hooks/useGeolocation";

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
  const mode = useStore((s) => s.mode);
  const units = useStore((s) => s.units);
  const setPlacingMarker = useStore((s) => s.setPlacingMarker);
  const setStartPoint = useStore((s) => s.setStartPoint);
  const setEndPoint = useStore((s) => s.setEndPoint);
  const setViewState = useStore((s) => s.setViewState);
  const generateRoute = useStore((s) => s.generateRoute);
  const clearRoute = useStore((s) => s.clearRoute);
  const setUnits = useStore((s) => s.setUnits);

  const { loading: geoLoading, getCurrentPosition } = useGeolocation();

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setPlacingMarker("start");
    clearRoute();
  };

  const handleUseMyLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      setStartPoint(pos);
      setViewState({ longitude: pos[0], latitude: pos[1], zoom: 15 });
      if (mode === "point-to-point") {
        setPlacingMarker("end");
      } else {
        setPlacingMarker(null);
      }
    } catch {
      // Error is in the hook state
    }
  };

  const canGenerate =
    startPoint && (mode === "loop" || endPoint) && !isGenerating;

  const instructionText = () => {
    if (placingMarker === "start") return "Tap to set start point";
    if (placingMarker === "end" && mode === "point-to-point")
      return "Tap to set end point";
    return null;
  };

  return (
    <div className="relative w-full h-dvh">
      <MapContainer />

      {/* Instruction banner */}
      {instructionText() && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 z-10">
          {instructionText()}
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {!startPoint && (
          <button
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 hover:bg-white transition-colors"
          >
            {geoLoading ? "Locating..." : "Use my location"}
          </button>
        )}
        {(startPoint || endPoint) && (
          <button
            onClick={handleReset}
            className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm font-medium text-zinc-700 hover:bg-white transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-5 py-4 min-w-[300px] max-w-[90vw] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <ModeSelector />
          <button
            onClick={() => setUnits(units === "mi" ? "km" : "mi")}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-medium px-2 py-1 rounded transition-colors"
          >
            {units === "mi" ? "mi" : "km"}
          </button>
        </div>

        {mode === "loop" && <DistanceSlider />}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {routeStats && <RouteStats />}

        {canGenerate && (
          <button
            onClick={generateRoute}
            disabled={isGenerating}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 text-white font-medium rounded-xl px-4 py-3 transition-colors text-sm"
          >
            {isGenerating
              ? "Generating..."
              : routeStats
              ? "Regenerate"
              : "Generate Route"}
          </button>
        )}
      </div>
    </div>
  );
}
