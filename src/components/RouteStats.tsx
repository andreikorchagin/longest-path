import { useStore } from "@/store";

export default function RouteStats() {
  const routeStats = useStore((s) => s.routeStats);
  const units = useStore((s) => s.units);

  if (!routeStats) return null;

  const distance =
    units === "mi"
      ? `${routeStats.distanceMi.toFixed(1)} mi`
      : `${routeStats.distanceKm.toFixed(1)} km`;

  const altDistance =
    units === "mi"
      ? `${routeStats.distanceKm.toFixed(1)} km`
      : `${routeStats.distanceMi.toFixed(1)} mi`;

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg shadow-black/8 border border-zinc-200/50 px-8 py-4 flex items-center gap-8">
        <dl className="flex items-baseline gap-2">
          <dd className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
            {distance}
          </dd>
          <dt className="text-sm text-zinc-400">{altDistance}</dt>
        </dl>
        <div className="h-6 w-px bg-zinc-200" aria-hidden="true" />
        <dl className="flex items-baseline gap-2">
          <dd className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
            {Math.round(routeStats.durationMin)}
          </dd>
          <dt className="text-sm text-zinc-400">min</dt>
        </dl>
      </div>
    </div>
  );
}
