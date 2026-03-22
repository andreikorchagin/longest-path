import { useStore } from "@/store";
import type { RoutingMode } from "@/lib/algorithm/types";

export default function ModeSelector() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const clearRoute = useStore((s) => s.clearRoute);
  const setEndPoint = useStore((s) => s.setEndPoint);
  const setPlacingMarker = useStore((s) => s.setPlacingMarker);
  const startPoint = useStore((s) => s.startPoint);

  const handleModeChange = (newMode: RoutingMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    clearRoute();

    if (newMode === "loop") {
      setEndPoint(null);
      setPlacingMarker(startPoint ? null : "start");
    } else {
      setPlacingMarker(startPoint ? "end" : "start");
    }
  };

  return (
    <div role="group" aria-label="Route mode" className="flex rounded-xl bg-zinc-100 p-1">
      <button
        onClick={() => handleModeChange("point-to-point")}
        aria-pressed={mode === "point-to-point"}
        aria-label="Point to point route"
        className={`flex-1 rounded-lg px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
          mode === "point-to-point"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        A to B
      </button>
      <button
        onClick={() => handleModeChange("loop")}
        aria-pressed={mode === "loop"}
        aria-label="Loop route back to start"
        className={`flex-1 rounded-lg px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
          mode === "loop"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-700"
        }`}
      >
        Loop
      </button>
    </div>
  );
}
