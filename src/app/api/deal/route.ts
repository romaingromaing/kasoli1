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
      transporterAddress,
      farmerAmount,
      freightAmount,
      platformFee,
      totalLocked,
      signatureTimeoutHours = 24,
    } = body;

    // Convert addresses to lowercase
    const buyerWallet = buyerAddress.toLowerCase();
    const transporterWallet = transporterAddress.toLowerCase();

    // Find buyer and transporter
    const [buyer, transporter] = await Promise.all([
      prisma.buyer.findUnique({ where: { walletAddress: buyerWallet } }),
      prisma.transporter.findUnique({ where: { walletAddress: transporterWallet } }),
    ]);

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 400 });
    }

    if (!transporter) {
      return NextResponse.json({ error: 'Transporter not found' }, { status: 400 });
    }

    // Calculate timeout date
    const timeoutAt = new Date();
    timeoutAt.setHours(timeoutAt.getHours() + signatureTimeoutHours);

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        batchId,
        buyerId: buyer.id,
        transporterId: transporter.id,
        farmerAmount,
        freightAmount,
        platformFee,
        totalLocked,
        signatureTimeoutHours,
        timeoutAt,
        sigMask: 0, // No signatures yet
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
