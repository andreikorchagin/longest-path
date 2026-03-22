import { Marker } from "react-map-gl/mapbox";
import type { ScoredWaypoint } from "@/lib/algorithm/types";

interface Props {
  waypoints: ScoredWaypoint[];
}

export default function FeatureMarkers({ waypoints }: Props) {
  // Only show pier waypoints — they're the interesting detours
  // Regular path waypoints don't need markers (the route line shows them)
  const piers = waypoints.filter((wp) => wp.isDeadEnd);

  return (
    <>
      {piers.map((wp) => (
        <Marker
          key={wp.id}
          longitude={wp.lngLat[0]}
          latitude={wp.lngLat[1]}
          anchor="center"
        >
          <div
            className="w-3 h-3 rounded-full bg-sky-400 border-2 border-white shadow-md"
            title={wp.name || "Pier"}
          />
        </Marker>
      ))}
    </>
  );
}
