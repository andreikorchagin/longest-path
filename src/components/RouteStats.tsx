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
    <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <div>
        <dd className="text-lg font-semibold text-zinc-900 tabular-nums">
          {distance}
        </dd>
        <dt className="text-xs text-zinc-500">{altDistance}</dt>
      </div>
      <div className="h-8 w-px bg-zinc-200" aria-hidden="true" />
      <div>
        <dd className="text-lg font-semibold text-zinc-900 tabular-nums">
          {Math.round(routeStats.durationMin)} min
        </dd>
        <dt className="text-xs text-zinc-500">est. time</dt>
      </div>
      {piers > 0 && (
        <>
          <div className="h-8 w-px bg-zinc-200" aria-hidden="true" />
          <div>
            <dd className="text-lg font-semibold text-zinc-900 tabular-nums">
              {piers}
            </dd>
            <dt className="text-xs text-zinc-500">
              {piers === 1 ? "pier" : "piers"}
            </dt>
          </div>
        </>
      )}
    </dl>
  );
}
