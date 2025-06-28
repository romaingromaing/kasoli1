import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { escrowTxHash } = await req.json();
    const { dealId } = await params;

    if (!escrowTxHash) {
      return NextResponse.json({ error: 'escrowTxHash is required' }, { status: 400 });
    }

    // Update the deal status and store the escrow transaction hash
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'PENDING_SIGS',
        escrowTxHash,
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        signatures: true,
      },
    });

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Failed to update deal with escrow payment:', error);
    return NextResponse.json({ error: 'Failed to update deal with escrow payment' }, { status: 500 });
  }
} 