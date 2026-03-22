import { useStore } from "@/store";

const MI_TO_KM = 1.60934;

export default function PaceInput() {
  const pace = useStore((s) => s.paceMinPerMile);
  const setPace = useStore((s) => s.setPace);
  const units = useStore((s) => s.units);

  const displayPace = units === "mi" ? pace : pace / MI_TO_KM;
  const paceLabel = units === "mi" ? "min/mi" : "min/km";
  const paceId = "pace-input";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) return;
    if (units === "km") {
      value = value * MI_TO_KM;
    }
    setPace(value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={paceId} className="text-xs text-zinc-500 whitespace-nowrap">
        Pace
      </label>
      <input
        id={paceId}
        type="number"
        min={5}
        max={15}
        step={0.5}
        value={parseFloat(displayPace.toFixed(1))}
        onChange={handleChange}
        aria-label={`Running pace in ${paceLabel}`}
        className="w-16 text-sm font-medium text-zinc-800 bg-zinc-100 rounded-md px-2 py-2 text-center border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      />
      <span className="text-xs text-zinc-500" aria-hidden="true">{paceLabel}</span>
    </div>
  );
}
