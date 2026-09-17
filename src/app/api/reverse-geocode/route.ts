import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          message: "Latitude and longitude are required",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          message: "Google Maps API key is not configured",
        },
        { status: 500 }
      );
    }

    const googleUrl = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"
    );

    googleUrl.searchParams.set("latlng", `${lat},${lon}`);
    googleUrl.searchParams.set("key", apiKey);
    googleUrl.searchParams.set("language", "en");
    googleUrl.searchParams.set("region", "in");

    const response = await fetch(googleUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Google Geocoding API request failed",
          google_status: data?.status,
        },
        { status: response.status }
      );
    }

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        {
          message: "Address not found",
          google_status: data.status,
        },
        { status: 404 }
      );
    }

    const address = data.results[0].formatted_address;

    return NextResponse.json(
      {
        address,
        results: data.results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}