import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Buyer bit is 0x1, Farmer bit is 0x2, Transporter bit is 0x4
const BUYER_BIT = 0x1;
const FARMER_BIT = 0x2;
const TRANSPORTER_BIT = 0x4;

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { dealId } = await params;
    const body = await req.json();
    const { buyerAddress, txHash } = body;

    if (!buyerAddress) {
      return NextResponse.json({ error: 'Buyer address is required' }, { status: 400 });
    }

    // Find the deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        platform: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify the buyer address matches
    if (deal.buyer.walletAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized buyer' }, { status: 403 });
    }

    // Update sigMask to set the buyer bit
    const newSigMask = deal.sigMask | BUYER_BIT;
    let newStatus = deal.status;

    // If all three parties have signed, update status to PAID_OUT
    if ((newSigMask & BUYER_BIT) && (newSigMask & FARMER_BIT) && (newSigMask & TRANSPORTER_BIT)) {
      newStatus = 'PAID_OUT';
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        sigMask: newSigMask,
        status: newStatus,
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        platform: true,
      },
    });

    // Create signature record if txHash is provided
    if (txHash) {
      await prisma.signature.create({
        data: {
          dealId: dealId,
          role: 'BUYER',
          txHash: txHash,
        },
      });
    }

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Buyer sign failed:', error);
    return NextResponse.json({ error: 'Buyer sign failed' }, { status: 500 });
  }
} 