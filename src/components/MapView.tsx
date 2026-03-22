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
      setPlacingMarker(mode === "point-to-point" ? "end" : null);
    } catch {
      // Error state handled in hook
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

      {/* TOP: Stats bar (only when route exists) */}
      {routeStats && !isGenerating && <RouteStats />}

      {/* TOP: Instruction banner (only when placing markers, no route yet) */}
      {instruction && !routeStats && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10" role="status">
          <div className="bg-white/95 backdrop-blur-md rounded-full px-6 py-3 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-600 tracking-wide">
            {instruction}
          </div>
        </div>
      )}

      {/* TOP RIGHT: Reset button */}
      {(startPoint || endPoint) && (
        <div className="absolute top-5 right-5 z-10">
          <button
            onClick={handleReset}
            aria-label="Reset markers and clear route"
            className="bg-white/95 backdrop-blur-md rounded-full px-5 py-3 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* TOP LEFT: My location (only before start is set) */}
      {!startPoint && (
        <div className="absolute top-5 left-5 z-10">
          <button
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            aria-label="Use my current location as start point"
            className="bg-white/95 backdrop-blur-md rounded-full px-5 py-3 shadow-lg shadow-black/5 border border-zinc-200/50 text-sm font-medium text-zinc-600 hover:bg-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {geoLoading ? "Locating..." : "My location"}
          </button>
        </div>
      )}

      {/* CENTER: Progress overlay */}
      {isGenerating && <ProgressIndicator />}

      {/* BOTTOM: Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-8 md:p-8 md:pb-10">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-red-200/50"
            >
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Control card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-black/8 border border-zinc-200/50">
            <div className="px-7 py-6 space-y-5">
              {/* Mode + Units */}
              <div className="flex items-center justify-between gap-4">
                <ModeSelector />
                <button
                  onClick={() => setUnits(units === "mi" ? "km" : "mi")}
                  aria-label={`Switch to ${units === "mi" ? "kilometers" : "miles"}`}
                  className="text-sm text-zinc-500 hover:text-zinc-700 font-medium px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  {units}
                </button>
              </div>

              {/* Distance slider (loop) */}
              {mode === "loop" && <DistanceSlider />}

              {/* Pace */}
              <PaceInput />
            </div>

            {/* Generate button */}
            {canGenerate && (
              <div className="px-7 pb-7 pt-1">
                <button
                  onClick={generateRoute}
                  disabled={isGenerating}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-semibold rounded-2xl px-6 py-4 active:scale-[0.98] transition-all text-base tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {routeStats ? "Regenerate" : "Generate Route"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
