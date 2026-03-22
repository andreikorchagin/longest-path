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
    <div className="flex rounded-lg bg-zinc-100 p-0.5">
      <button
        onClick={() => handleModeChange("point-to-point")}
        className={`flex-1 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
          mode === "point-to-point"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-400 hover:text-zinc-600"
        }`}
      >
        A to B
      </button>
      <button
        onClick={() => handleModeChange("loop")}
        className={`flex-1 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
          mode === "loop"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-400 hover:text-zinc-600"
        }`}
      >
        Loop
      </button>
    </div>
  );
}
