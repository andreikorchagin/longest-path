import { useStore } from "@/store";

const STEPS = [
  { key: "discovering", label: "Finding running paths", detail: "Querying OpenStreetMap for footways, cycleways, and waterfront paths in the area" },
  { key: "analyzing", label: "Analyzing paths", detail: "Scoring paths by length, water proximity, and alignment with your route" },
  { key: "selecting", label: "Selecting route", detail: "Picking the best continuous path with minimal turns" },
  { key: "routing", label: "Calculating route", detail: "Sending waypoints to Mapbox for turn-by-turn directions" },
];

export default function ProgressIndicator() {
  const step = useStore((s) => s.progressStep);

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const current = currentIdx >= 0 ? STEPS[currentIdx] : null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        aria-label={current?.label || "Preparing..."}
        className="bg-white/95 backdrop-blur-md rounded-3xl px-8 py-7 shadow-xl shadow-black/10 border border-zinc-200/50 pointer-events-auto w-[340px]"
      >
        {/* Step indicators */}
        <div className="flex gap-2 mb-5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentIdx ? "bg-blue-500" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {/* Current step */}
        <div className="flex items-start gap-4">
          <div
            className="w-6 h-6 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-semibold text-zinc-800">
              {current?.label || "Preparing..."}
            </p>
            <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
              {current?.detail || "Setting up route generation..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
