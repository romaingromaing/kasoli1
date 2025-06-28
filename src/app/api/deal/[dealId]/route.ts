import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { dealId } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        batch: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
        transporter: true,
        platform: true,
        signatures: true,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Failed to get deal:', error);
    return NextResponse.json({ error: 'Failed to get deal' }, { status: 500 });
  }
} 