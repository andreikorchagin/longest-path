import { Marker } from "react-map-gl/mapbox";
import type { ScoredWaypoint } from "@/lib/algorithm/types";
import type { FeatureType } from "@/types/overpass";

const FEATURE_COLORS: Record<FeatureType, string> = {
  pier: "#0ea5e9",      // sky-500
  marina: "#06b6d4",    // cyan-500
  viewpoint: "#f59e0b", // amber-500
  waterfront: "#3b82f6", // blue-500
  park: "#22c55e",      // green-500
  footway: "#a855f7",   // purple-500
  cycleway: "#ec4899",  // pink-500
  path: "#8b5cf6",      // violet-500
};

interface Props {
  waypoints: ScoredWaypoint[];
  selected?: Set<string>;
}

export default function FeatureMarkers({ waypoints, selected }: Props) {
  return (
    <>
      {waypoints.map((wp) => {
        const isSelected = selected?.has(wp.id);
        const color = FEATURE_COLORS[wp.featureType];

        return (
          <Marker
            key={wp.id}
            longitude={wp.lngLat[0]}
            latitude={wp.lngLat[1]}
            anchor="center"
          >
            <div
              className="rounded-full border-2 border-white shadow-md transition-transform"
              style={{
                backgroundColor: color,
                width: isSelected ? 14 : 8,
                height: isSelected ? 14 : 8,
                opacity: isSelected ? 1 : 0.6,
                transform: isSelected ? "scale(1.2)" : "scale(1)",
              }}
              title={wp.name || wp.featureType}
            />
          </Marker>
        );
      })}
    </>
  );
}
