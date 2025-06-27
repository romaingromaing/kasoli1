import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transporterAddr = searchParams.get('transporter');
    const buyerAddr = searchParams.get('buyer');

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

    if (buyerAddr) {
      const buyer = await prisma.buyer.findUnique({
        where: { walletAddress: buyerAddr },
      });
      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 400 });
      }
      const deals = await prisma.deal.findMany({
        where: { buyerId: buyer.id },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      batchId,
      buyerAddress,
      farmerAmount,
      signatureTimeoutHours = 24,
    } = body;

    const buyerWallet = buyerAddress.toLowerCase();

    const buyer = await prisma.buyer.findUnique({ where: { walletAddress: buyerWallet } });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 400 });
    }

    const timeoutAt = new Date();
    timeoutAt.setHours(timeoutAt.getHours() + signatureTimeoutHours);

    const deal = await prisma.deal.create({
      data: {
        batchId,
        buyerId: buyer.id,
        farmerAmount,
        signatureTimeoutHours,
        timeoutAt,
        sigMask: 0,
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
    console.error('Deal creation failed:', error);
    return NextResponse.json({ error: 'Deal creation failed' }, { status: 500 });
  }
}
