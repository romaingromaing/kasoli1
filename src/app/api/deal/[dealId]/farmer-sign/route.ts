import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Farmer bit is 0x2
const FARMER_BIT = 0x2;

export async function POST(request: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const { dealId } = params;
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

    // If all required signatures are present, update status and batch
    // (Assume next status is PENDING_SIGS, and batch goes IN_TRANSIT)
    if (newSigMask & 0x2) {
      newStatus = 'PENDING_SIGS';
      batchStatus = 'IN_TRANSIT';
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