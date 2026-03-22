import { useStore } from "@/store";

export default function PaceInput() {
  const pace = useStore((s) => s.paceMinPerMile);
  const setPace = useStore((s) => s.setPace);
  const units = useStore((s) => s.units);

  const displayPace = units === "mi" ? pace : pace / 1.60934;
  const paceLabel = units === "mi" ? "min/mi" : "min/km";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (units === "km") {
      value = value * 1.60934; // Convert min/km to min/mi for storage
    }
    setPace(value);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400 whitespace-nowrap">Pace</label>
      <input
        type="number"
        min={4}
        max={20}
        step={0.5}
        value={parseFloat(displayPace.toFixed(1))}
        onChange={handleChange}
        className="w-16 text-sm font-medium text-zinc-800 bg-zinc-100 rounded-md px-2 py-1 text-center border-0 focus:ring-1 focus:ring-zinc-300 outline-none"
      />
      <span className="text-xs text-zinc-400">{paceLabel}</span>
    </div>
  );
}
