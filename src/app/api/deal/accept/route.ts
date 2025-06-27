import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const {
      dealId,
      transporterAddress,
      freightAmount,
      platformFee,
      totalLocked,
    } = await req.json();

    const transporterWallet = transporterAddress.toLowerCase();

    const transporter = await prisma.transporter.findUnique({
      where: { walletAddress: transporterWallet },
    });
    if (!transporter) {
      return NextResponse.json({ error: 'Transporter not found' }, { status: 400 });
    }

    const deal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        transporterId: transporter.id,
        freightAmount,
        platformFee,
        totalLocked,
        status: 'AWAITING_ESCROW',
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        signatures: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Driver accept failed:', error);
    return NextResponse.json({ error: 'Driver accept failed' }, { status: 500 });
  }
}
