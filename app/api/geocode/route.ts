import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({ suggestions: [] });

  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&key=${apiKey}&limit=5&no_annotations=1`;
    const res = await fetch(url);
    const data = await res.json();

    const suggestions = (data.results || []).map((r: {
      formatted: string;
      geometry: { lat: number; lng: number };
    }) => ({
      formatted: r.formatted,
      lat: r.geometry.lat,
      lng: r.geometry.lng,
    }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}