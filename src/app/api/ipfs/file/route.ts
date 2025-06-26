import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File missing' }, { status: 400 });
  }

  const pinataData = new FormData();
  pinataData.set('file', file);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: pinataData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Pinata file upload failed', text);
    return NextResponse.json({ error: 'Pinata upload failed' }, { status: 500 });
  }

  const json = await res.json();
  return NextResponse.json({ cid: json.IpfsHash });
}
