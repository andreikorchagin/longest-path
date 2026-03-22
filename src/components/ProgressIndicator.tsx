import { useStore } from "@/store";

const STEP_LABELS: Record<string, string> = {
  discovering: "Searching for running paths",
  analyzing: "Analyzing path network",
  selecting: "Selecting best route",
  routing: "Calculating route",
};

export default function ProgressIndicator() {
  const step = useStore((s) => s.progressStep);
  const detail = useStore((s) => s.progressDetail);

  const label = step ? STEP_LABELS[step] || step : "Preparing...";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl shadow-black/10 border border-zinc-200/50 text-center pointer-events-auto min-w-[240px]">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        {detail && (
          <p className="text-xs text-zinc-400 mt-1">{detail}</p>
        )}
      </div>
    </div>
  );
}
