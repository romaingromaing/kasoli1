import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const { dealId } = params;
    const { payoutTxHash } = await request.json();

    // Update the deal status to PAID_OUT and store the payout transaction hash
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'PAID_OUT',
        payoutTxHash,
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        signatures: true,
      },
    });

    // Optionally, update the batch status to FINALISED
    await prisma.batch.update({
      where: { id: updatedDeal.batchId },
      data: { status: 'FINALISED' },
    });

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Failed to finalize deal:', error);
    return NextResponse.json({ error: 'Failed to finalize deal' }, { status: 500 });
  }
} 