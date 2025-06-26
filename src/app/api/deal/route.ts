import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transporterAddr = searchParams.get('transporter');

    if (transporterAddr) {
      const transporter = await prisma.transporter.findUnique({
        where: { walletAddress: transporterAddr },
      });
      if (!transporter) {
        return NextResponse.json(
          { error: 'Transporter not found' },
          { status: 400 }
        );
      }
      const deals = await prisma.deal.findMany({
        where: { transporterId: transporter.id },
        include: {
          batch: true,
          buyer: true,
          transporter: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(deals);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Deal fetch failed', error);
    return NextResponse.json({ error: 'Deal fetch failed' }, { status: 500 });
  }
}
