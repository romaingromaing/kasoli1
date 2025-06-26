import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const farmer = await prisma.farmer.findUnique({
      where: { walletAddress: body.farmerAddress },
    });

    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 400 });
    }

    const batch = await prisma.batch.create({
      data: {
        receiptTokenId: body.receiptTokenId,
        metaCid: body.metaCid,
        photoCid: body.photoCid,
        grade: body.grade,
        weightKg: body.weightKg,
        farmerId: farmer.id,
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Batch creation failed', error);
    return NextResponse.json({ error: 'Batch creation failed' }, { status: 500 });
  }
}
