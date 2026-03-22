import type { OverpassResponse } from "@/types/overpass";

export async function queryOverpass(
  query: string
): Promise<OverpassResponse> {
  const res = await fetch("/api/overpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Overpass API error: ${res.status} ${text}`);
  }

  return res.json();
}
