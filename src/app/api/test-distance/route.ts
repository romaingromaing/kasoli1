import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Test with simple coordinates (London to Paris)
    const origins = '51.5074,-0.1278';
    const destinations = '48.8566,2.3522';
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`;
    
    console.log('Testing Google Maps API...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      status: response.status,
      data: data,
      url: url.replace(apiKey, '***API_KEY***')
    });
    
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 });
  }
}
