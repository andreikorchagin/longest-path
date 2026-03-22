import { NextRequest, NextResponse } from "next/server";
import {
  OVERPASS_API_URL,
  OVERPASS_FALLBACK_URL,
} from "@/lib/constants";

// Simple in-memory cache for Overpass queries
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  // Check cache
  const cacheKey = query;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Try primary, then fallback
  for (const url of [OVERPASS_API_URL, OVERPASS_FALLBACK_URL]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (res.ok) {
        const data = await res.json();
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data);
      }
    } catch {
      // Try next URL
    }
  }

  return NextResponse.json(
    { error: "Overpass API unavailable" },
    { status: 502 }
  );
}
