import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerAddr = searchParams.get('farmer');
    const status = searchParams.get('status');

    if (farmerAddr) {
      // Convert address to lowercase for consistency
      const walletAddress = farmerAddr.toLowerCase();
      
      const farmer = await prisma.farmer.findUnique({
        where: { walletAddress }
      });

      if (!farmer) {
        return NextResponse.json({ error: 'Farmer not found' }, { status: 400 });
      }

      const batches = await prisma.batch.findMany({
        where: {
          farmerId: farmer.id,
          ...(status ? { status: status as any } : {})
        },
        orderBy: { createdAt: 'desc' },
        include: { farmer: true, deal: true }
      });

      return NextResponse.json(batches);
    }

    const where = status ? { status: status as any } : {};
    const batches = await prisma.batch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { farmer: true, deal: true }
    });
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Batch fetch failed', error);
    return NextResponse.json({ error: 'Batch fetch failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Convert address to lowercase for consistency
    const walletAddress = (body.farmerAddress as string).toLowerCase();

    // Find or create farmer
    let farmer = await prisma.farmer.findUnique({
      where: { walletAddress },
    });

    if (!farmer) {
      // Create new farmer if not found
      farmer = await prisma.farmer.create({
        data: {
          walletAddress,
        },
      });
    }

    const batch = await prisma.batch.create({
      data: {
        receiptTokenId: body.receiptTokenId,
        metaCid: body.metaCid,
        photoCid: body.photoCid,
        origin: body.origin,
        locationLat: body.locationLat,
        locationLng: body.locationLng,
        grade: body.grade,
        weightKg: body.weightKg,
        pricePerKg: body.pricePerKg,
        farmerId: farmer.id,
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Batch creation failed:', error);
    return NextResponse.json({ error: 'Batch creation failed' }, { status: 500 });
  }
}
