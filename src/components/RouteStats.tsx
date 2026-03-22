import { useStore } from "@/store";

export default function RouteStats() {
  const routeStats = useStore((s) => s.routeStats);

  if (!routeStats) return null;

  return (
    <div className="flex gap-4 text-sm">
      <div>
        <span className="text-zinc-400">Distance</span>
        <p className="font-semibold text-zinc-800">
          {routeStats.distanceMi.toFixed(2)} mi
          <span className="text-zinc-400 font-normal ml-1">
            ({routeStats.distanceKm.toFixed(2)} km)
          </span>
        </p>
      </div>
      <div>
        <span className="text-zinc-400">Est. time</span>
        <p className="font-semibold text-zinc-800">
          {Math.round(routeStats.durationMin)} min
        </p>
      </div>
    </div>
  );
}
