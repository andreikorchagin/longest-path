import { useStore } from "@/store";

export default function DistanceSlider() {
  const targetDistanceKm = useStore((s) => s.targetDistanceKm);
  const setTargetDistance = useStore((s) => s.setTargetDistance);
  const units = useStore((s) => s.units);

  const displayDistance =
    units === "mi"
      ? (targetDistanceKm * 0.621371).toFixed(1)
      : targetDistanceKm.toFixed(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // Slider is always in km internally
    setTargetDistance(value);
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-xs text-zinc-500">Target distance</label>
        <span className="text-sm font-semibold text-zinc-800">
          {displayDistance} {units}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={30}
        step={0.5}
        value={targetDistanceKm}
        onChange={handleChange}
        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>{units === "mi" ? "0.6 mi" : "1 km"}</span>
        <span>{units === "mi" ? "18.6 mi" : "30 km"}</span>
      </div>
    </div>
  );
}
