import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!batchId || !latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.locationLat === null || batch.locationLng === null) {
    return NextResponse.json({ error: 'Batch location not found' }, { status: 404 });
  }

  const distance = haversine(lat, lng, batch.locationLat, batch.locationLng);
  return NextResponse.json({ distance });
}
