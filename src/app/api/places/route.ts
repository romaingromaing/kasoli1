import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input');
  const placeId = searchParams.get('placeId');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Google Maps API key' }, { status: 500 });
  }

  try {
    if (placeId) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (input) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${apiKey}`
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ predictions: [] });
  } catch (err) {
    console.error('Places API error', err);
    return NextResponse.json({ error: 'Places API error' }, { status: 500 });
  }
}
