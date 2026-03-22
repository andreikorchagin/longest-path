"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store";
import RouteStats from "./RouteStats";
import ModeSelector from "./ModeSelector";
import DistanceSlider from "./DistanceSlider";
import ProgressIndicator from "./ProgressIndicator";
import PaceInput from "./PaceInput";
import { useGeolocation } from "@/hooks/useGeolocation";

const MapContainer = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
      <div className="text-center" role="status" aria-label="Loading map">
        <div
          className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="text-zinc-500 text-sm">Loading map...</p>
      </div>
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

  const instruction =
    placingMarker === "start"
      ? "Tap or click to set start point"
      : placingMarker === "end" && mode === "point-to-point"
      ? "Tap or click to set end point"
      : null;

  return (
    <div className="relative w-full h-dvh h-screen">
      <MapContainer />

      {/* Instruction banner */}
      {instruction && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10" role="status">
          <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-700">
            {instruction}
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {!startPoint && (
          <button
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            aria-label="Use my current location as start point"
            className="bg-white/95 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-700 hover:bg-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {geoLoading ? "Locating..." : "My location"}
          </button>
        )}
        {(startPoint || endPoint) && (
          <button
            onClick={handleReset}
            aria-label="Reset markers and clear route"
            className="bg-white/95 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress overlay */}
      {isGenerating && <ProgressIndicator />}

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/10 border border-zinc-200/50 overflow-hidden">
          {/* Controls */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <ModeSelector />
              <button
                onClick={() => setUnits(units === "mi" ? "km" : "mi")}
                aria-label={`Switch to ${units === "mi" ? "kilometers" : "miles"}`}
                className="text-xs text-zinc-500 hover:text-zinc-700 font-medium px-3 py-2 rounded-md hover:bg-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                {units}
              </button>
            </div>

            {mode === "loop" && <DistanceSlider />}

            <div className="flex items-center justify-between">
              <PaceInput />
            </div>
          </div>

          {/* Route stats */}
          {routeStats && (
            <div className="px-4 py-3 border-t border-zinc-100">
              <RouteStats />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="px-4 py-2 bg-red-50 border-t border-red-100"
            >
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Generate button */}
          {canGenerate && (
            <div className="px-4 pb-4 pt-1">
              <button
                onClick={generateRoute}
                disabled={isGenerating}
                className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-medium rounded-xl px-4 py-3 active:scale-[0.98] transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {routeStats ? "Regenerate" : "Generate Route"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
