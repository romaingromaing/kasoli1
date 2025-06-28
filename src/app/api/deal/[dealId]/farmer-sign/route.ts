import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Farmer bit is 0x2, Transporter bit is 0x4, Buyer bit is 0x1
const FARMER_BIT = 0x2;

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { dealId } = await params;
    // Optionally, you could check the farmer's address from the request body or session

    // Find the deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { batch: true },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Update sigMask to set the farmer bit
    const newSigMask = deal.sigMask | FARMER_BIT;
    let newStatus = deal.status;
    let batchStatus = deal.batch.status;

    // If both farmer and transporter have signed, update status and batch
    if ((newSigMask & FARMER_BIT) && (newSigMask & 0x4)) {
      newStatus = 'READY_TO_FINAL';
      batchStatus = 'DELIVERED';
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        sigMask: newSigMask,
        status: newStatus,
      },
      include: { batch: true },
    });

    // Update batch status if needed
    let updatedBatch = deal.batch;
    if (batchStatus !== deal.batch.status) {
      updatedBatch = await prisma.batch.update({
        where: { id: deal.batch.id },
        data: { status: batchStatus },
      });
    }

    return NextResponse.json({ deal: updatedDeal, batch: updatedBatch });
  } catch (error) {
    console.error('Farmer sign failed:', error);
    return NextResponse.json({ error: 'Farmer sign failed' }, { status: 500 });
  }
} 