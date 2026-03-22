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
    <div className="flex items-baseline gap-4">
      <div>
        <p className="text-lg font-semibold text-zinc-900 tabular-nums">
          {distance}
        </p>
        <p className="text-xs text-zinc-400">{altDistance}</p>
      </div>
      <div className="h-8 w-px bg-zinc-200" />
      <div>
        <p className="text-lg font-semibold text-zinc-900 tabular-nums">
          {Math.round(routeStats.durationMin)} min
        </p>
        <p className="text-xs text-zinc-400">est. time</p>
      </div>
      {piers > 0 && (
        <>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <p className="text-lg font-semibold text-zinc-900 tabular-nums">
              {piers}
            </p>
            <p className="text-xs text-zinc-400">
              {piers === 1 ? "pier" : "piers"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
