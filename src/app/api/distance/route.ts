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

async function getGoogleMapsDistance(origins: string, destinations: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key not found in environment variables');
    throw new Error('Google Maps API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=metric&key=${apiKey}`;
  
  console.log('Google Maps API URL:', url.replace(apiKey, '***API_KEY***'));
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error('Google Maps API HTTP error:', response.status, response.statusText);
    throw new Error(`Failed to fetch from Google Maps API: ${response.status}`);
  }

  const data = await response.json();
  console.log('Google Maps API response:', JSON.stringify(data, null, 2));

  if (data.status !== 'OK') {
    console.error('Google Maps API status error:', data.status, data.error_message);
    throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  const element = data.rows[0]?.elements[0];
  if (!element) {
    console.error('No distance element found in response');
    throw new Error('No distance data found in response');
  }
  
  if (element.status !== 'OK') {
    console.error('Distance element status error:', element.status);
    throw new Error(`Distance calculation failed: ${element.status}`);
  }

  const result = {
    distanceInMeters: element.distance.value,
    distanceInKm: element.distance.value / 1000,
    distanceText: element.distance.text,
    duration: element.duration.text,
    durationInSeconds: element.duration.value
  };
  
  console.log('Successfully calculated distance:', result);
  return result;
}

export async function GET(req: NextRequest) {
  try {
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

    const batch = await prisma.batch.findUnique({ 
      where: { id: batchId },
      select: { locationLat: true, locationLng: true }
    });
    
    if (!batch || batch.locationLat === null || batch.locationLng === null) {
      return NextResponse.json({ error: 'Batch location not found' }, { status: 404 });
    }

    try {
      // Try Google Maps Distance Matrix API first for road distance
      const origins = `${batch.locationLat},${batch.locationLng}`;
      const destinations = `${lat},${lng}`;
      
      console.log(`Calculating distance from batch location (${origins}) to user location (${destinations})`);
      
      const googleMapsResult = await getGoogleMapsDistance(origins, destinations);
      
      console.log('Google Maps distance calculation successful');
      
      return NextResponse.json({
        distance: googleMapsResult.distanceInKm,
        distanceText: googleMapsResult.distanceText,
        duration: googleMapsResult.duration,
        durationInSeconds: googleMapsResult.durationInSeconds,
        method: 'google_maps'
      });
      
    } catch (googleError) {
      console.error('Google Maps API failed, falling back to Haversine:', googleError);
      
      // Fallback to Haversine formula for straight-line distance
      const distance = haversine(lat, lng, batch.locationLat, batch.locationLng);
      
      console.log(`Haversine fallback distance: ${distance.toFixed(2)} km`);
      
      return NextResponse.json({ 
        distance,
        distanceText: `${distance.toFixed(1)} km`,
        duration: 'N/A',
        method: 'haversine_fallback',
        error: googleError instanceof Error ? googleError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Distance calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
