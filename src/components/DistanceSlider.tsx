import { useStore } from "@/store";

export default function DistanceSlider() {
  const targetDistanceKm = useStore((s) => s.targetDistanceKm);
  const setTargetDistance = useStore((s) => s.setTargetDistance);
  const units = useStore((s) => s.units);

  const KM_TO_MI = 0.621371;
  const displayDistance =
    units === "mi"
      ? (targetDistanceKm * KM_TO_MI).toFixed(1)
      : targetDistanceKm.toFixed(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetDistance(parseFloat(e.target.value));
  };

  const sliderId = "distance-slider";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label htmlFor={sliderId} className="text-xs text-zinc-500">
          Target distance
        </label>
        <span className="text-sm font-semibold text-zinc-800" aria-live="polite">
          {displayDistance} {units}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        min={1}
        max={30}
        step={0.5}
        value={targetDistanceKm}
        onChange={handleChange}
        aria-label={`Target distance: ${displayDistance} ${units}`}
        aria-valuemin={1}
        aria-valuemax={30}
        aria-valuenow={targetDistanceKm}
        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      />
      <div className="flex justify-between text-[11px] text-zinc-400" aria-hidden="true">
        <span>{units === "mi" ? "0.6 mi" : "1 km"}</span>
        <span>{units === "mi" ? "18.6 mi" : "30 km"}</span>
      </div>
    </div>
  );
}
