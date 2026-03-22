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

  const label = step && step in STEP_LABELS ? STEP_LABELS[step] : "Preparing...";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl shadow-black/10 border border-zinc-200/50 text-center pointer-events-auto min-w-[240px]"
      >
        <div
          className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        {detail && (
          <p className="text-xs text-zinc-500 mt-1">{detail}</p>
        )}
      </div>
    </div>
  );
}
