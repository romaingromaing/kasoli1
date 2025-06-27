import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  try {
    const { dealId } = params;
    const body = await request.json();
    const { transporterAddress } = body;

    if (!transporterAddress) {
      return NextResponse.json(
        { error: 'Transporter address is required' },
        { status: 400 }
      );
    }

    // Find the transporter
    const transporter = await prisma.transporter.findUnique({
      where: { walletAddress: transporterAddress.toLowerCase() },
    });

    if (!transporter) {
      return NextResponse.json(
        { error: 'Transporter not found' },
        { status: 404 }
      );
    }

    // Find the deal and ensure it's still available
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { batch: true },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    if (deal.status !== 'PENDING_DRIVER' || deal.transporterId) {
      return NextResponse.json(
        { error: 'Deal is no longer available' },
        { status: 400 }
      );
    }

    // Accept the deal
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        transporterId: transporter.id,
        status: 'AWAITING_ESCROW',
      },
      include: {
        batch: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
        transporter: true,
      },
    });

    // Assign transporter to the batch as well
    await prisma.batch.update({
      where: { id: updatedDeal.batchId },
      data: { transporterId: transporter.id },
    });

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error accepting deal:', error);
    return NextResponse.json(
      { error: 'Failed to accept deal' },
      { status: 500 }
    );
  }
}
