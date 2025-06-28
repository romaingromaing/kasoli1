import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { dealId } = await params;

    // Find the deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { batch: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Update deal status to PAID_OUT
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'PAID_OUT',
      },
      include: { batch: true },
    });

    // Update batch status to FINALISED
    const updatedBatch = await prisma.batch.update({
      where: { id: deal.batch.id },
      data: {
        status: 'FINALISED',
      },
    });

    return NextResponse.json({ deal: updatedDeal, batch: updatedBatch });
  } catch (error) {
    console.error('Finalize failed:', error);
    return NextResponse.json({ error: 'Finalize failed' }, { status: 500 });
  }
} 