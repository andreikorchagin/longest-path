import { Marker } from "react-map-gl/mapbox";
import type { ScoredWaypoint } from "@/lib/algorithm/types";

interface Props {
  waypoints: ScoredWaypoint[];
}

export default function FeatureMarkers({ waypoints }: Props) {
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
            role="img"
            aria-label={wp.name || "Pier waypoint"}
            className="w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md"
          />
        </Marker>
      ))}
    </>
  );
}
