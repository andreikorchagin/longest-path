import { NextRequest, NextResponse } from "next/server";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function POST(req: NextRequest) {
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox token not configured" },
      { status: 500 }
    );
  }

  const { coordinates, walkwayBias = 1 } = await req.json();

  if (!coordinates) {
    return NextResponse.json(
      { error: "coordinates required" },
      { status: 400 }
    );
  }

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}`
  );
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("walkway_bias", String(walkwayBias));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Mapbox API error: ${res.status}`, details: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
