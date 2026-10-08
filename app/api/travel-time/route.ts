import { NextRequest, NextResponse } from "next/server";

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

    // Build coordinate pairs [lng, lat] for ORS
    const coords = locations
      .filter((l: { lat?: number; lng?: number }) => l.lat && l.lng)
      .map((l: { lat: number; lng: number }) => [l.lng, l.lat]);

    if (coords.length < 2) {
      const empty = locations.slice(1).map(() => ({ duration: null, distance: null }));
      return NextResponse.json({ travelTimes: empty, source: "no_coords" });
    }

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
    const durations = data.durations; // matrix
    const distances = data.distances;

    // Extract consecutive pairs (0→1, 1→2, 2→3 ...)
    const travelTimes = coords.slice(1).map((_: unknown, i: number) => ({
      duration: Math.round((durations[i][i + 1] ?? 0) / 60), // seconds → minutes
      distance: Math.round(((distances[i][i + 1] ?? 0) / 1000) * 10) / 10, // m → km
    }));

    return NextResponse.json({ travelTimes, source: "ors" });
  } catch (error) {
    console.error("Travel time error:", error);
    return NextResponse.json(
      { error: "Failed to calculate travel time" },
      { status: 500 }
    );
  }
}
