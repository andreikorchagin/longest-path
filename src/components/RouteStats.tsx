import { useStore } from "@/store";

export default function RouteStats() {
  const routeStats = useStore((s) => s.routeStats);
  const units = useStore((s) => s.units);
  const selectedWaypoints = useStore((s) => s.selectedWaypoints);

  if (!routeStats) return null;

  const distance =
    units === "mi"
      ? `${routeStats.distanceMi.toFixed(1)} mi`
      : `${routeStats.distanceKm.toFixed(1)} km`;

  const altDistance =
    units === "mi"
      ? `${routeStats.distanceKm.toFixed(1)} km`
      : `${routeStats.distanceMi.toFixed(1)} mi`;

  const piers = selectedWaypoints.filter((w) => w.isDeadEnd).length;

  return (
    <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
      <div>
        <dd className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
          {distance}
        </dd>
        <dt className="text-sm text-zinc-500 mt-0.5">{altDistance}</dt>
      </div>
      <div className="h-10 w-px bg-zinc-200" aria-hidden="true" />
      <div>
        <dd className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
          {Math.round(routeStats.durationMin)} min
        </dd>
        <dt className="text-sm text-zinc-500 mt-0.5">est. time</dt>
      </div>
      {piers > 0 && (
        <>
          <div className="h-10 w-px bg-zinc-200" aria-hidden="true" />
          <div>
            <dd className="text-2xl font-bold text-zinc-900 tabular-nums tracking-tight">
              {piers}
            </dd>
            <dt className="text-sm text-zinc-500 mt-0.5">
              {piers === 1 ? "pier" : "piers"}
            </dt>
          </div>
        </>
      )}
    </dl>
  );
}
