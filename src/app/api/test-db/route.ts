import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        farmer: true,
        platform: true,
      },
    });

    const buyers = await prisma.buyer.findMany();
    const farmers = await prisma.farmer.findMany();
    const transporters = await prisma.transporter.findMany();
    const batches = await prisma.batch.findMany({
      include: {
        farmer: true,
      },
    });

    return NextResponse.json({
      deals: deals.length,
      buyers: buyers.length,
      farmers: farmers.length,
      transporters: transporters.length,
      batches: batches.length,
      dealDetails: deals,
      batchDetails: batches,
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ error: 'Database test failed' }, { status: 500 });
  }
}
