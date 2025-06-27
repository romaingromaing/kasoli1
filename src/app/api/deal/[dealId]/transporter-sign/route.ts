import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Transporter bit is 0x4, Farmer bit is 0x2, Buyer bit is 0x1
const TRANSPORTER_BIT = 0x4;
const FARMER_BIT = 0x2;
const BUYER_BIT = 0x1;

export async function POST(request: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const { dealId } = params;
    // Optionally, you could check the transporter's address from the request body or session

    // Find the deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { batch: true },
    });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Update sigMask to set the transporter bit
    const newSigMask = deal.sigMask | TRANSPORTER_BIT;
    let newStatus = deal.status;
    let batchStatus = deal.batch.status;

    // If both farmer and transporter have signed, update status and batch
    if ((newSigMask & FARMER_BIT) && (newSigMask & TRANSPORTER_BIT)) {
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
    console.error('Transporter sign failed:', error);
    return NextResponse.json({ error: 'Transporter sign failed' }, { status: 500 });
  }
} 