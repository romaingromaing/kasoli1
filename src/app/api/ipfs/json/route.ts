import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Pinata JSON upload failed', text);
    return NextResponse.json({ error: 'Pinata upload failed' }, { status: 500 });
  }

  const json = await res.json();
  return NextResponse.json({ cid: json.IpfsHash });
}
