import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/travel-time
// Body: { locations: [{lat, lng, address}] }
// Returns: travel times between consecutive locations
export async function POST(request: NextRequest) {
  try {
    const { locations } = await request.json();

    if (!locations || locations.length < 2) {
      return NextResponse.json({ travelTimes: [] });
    }

    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey || apiKey === "your_openrouteservice_api_key") {
      // Return mock data if no API key set yet
      const mock = locations.slice(1).map(() => ({ duration: null, distance: null }));
      return NextResponse.json({ travelTimes: mock, source: "no_api_key" });
    }

    // Keep every location's original index, but only locations with real
    // coordinates can be sent to ORS. This preserves alignment between
    // `travelTimes[i]` and the (i+1)-th visit even when some patients are
    // missing lat/lng, instead of silently shifting every pair after a gap.
    const hasCoords = (l: { lat?: number | null; lng?: number | null }) =>
      typeof l.lat === "number" && typeof l.lng === "number";

    const validIndices = locations
      .map((l: { lat?: number | null; lng?: number | null }, i: number) => (hasCoords(l) ? i : -1))
      .filter((i: number) => i !== -1);

    if (validIndices.length < 2) {
      const empty = locations.slice(1).map(() => ({ duration: null, distance: null }));
      return NextResponse.json({ travelTimes: empty, source: "no_coords" });
    }

    const coords = validIndices.map((i: number) => [locations[i].lng, locations[i].lat]);

    // Call ORS Matrix API
    const orsRes = await fetch(
      "https://api.openrouteservice.org/v2/matrix/driving-car",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          locations: coords,
          metrics: ["duration", "distance"],
          resolve_locations: false,
        }),
      }
    );

    if (!orsRes.ok) {
      const err = await orsRes.text();
      console.error("ORS API Error:", err);
      const fallback = locations.slice(1).map(() => ({ duration: null, distance: null }));
      return NextResponse.json({ travelTimes: fallback, source: "ors_error" });
    }

    const data = await orsRes.json();
    const durations = data.durations; // matrix, indexed over `coords`/`validIndices`
    const distances = data.distances;

    // Map ORS's matrix (indexed over the filtered `validIndices`) back onto
    // every consecutive pair of the ORIGINAL `locations` array, so the
    // result always has length `locations.length - 1` and `travelTimes[i]`
    // really is the leg from visit i to visit i+1.
    const travelTimes = locations.slice(1).map((_: unknown, i: number) => {
      const fromPos = validIndices.indexOf(i);
      const toPos = validIndices.indexOf(i + 1);
      if (fromPos === -1 || toPos === -1) {
        return { duration: null, distance: null };
      }
      return {
        duration: Math.round((durations[fromPos][toPos] ?? 0) / 60), // seconds → minutes
        distance: Math.round(((distances[fromPos][toPos] ?? 0) / 1000) * 10) / 10, // m → km
      };
    });

    return NextResponse.json({ travelTimes, source: "ors" });
  } catch (error) {
    console.error("Travel time error:", error);
    return NextResponse.json(
      { error: "Failed to calculate travel time" },
      { status: 500 }
    );
  }
}
