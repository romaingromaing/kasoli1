import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { dealId, timeout } = await req.json();
    
    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID required' }, { status: 400 });
    }

    const timeoutHours = timeout || 24; // Default 24 hours
    const timeoutAt = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

    const deal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        signatureTimeoutHours: timeoutHours,
        timeoutAt: timeoutAt,
      },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Failed to set signature timeout:', error);
    return NextResponse.json({ error: 'Failed to set timeout' }, { status: 500 });
  }
}

// Check for expired deals
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    
    // Find deals that have timed out
    const expiredDeals = await prisma.deal.findMany({
      where: {
        timeoutAt: {
          lt: now,
        },
        status: 'PENDING_SIGS',
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
      },
    });

    // Update expired deals to DISPUTED status
    if (expiredDeals.length > 0) {
      await prisma.deal.updateMany({
        where: {
          id: {
            in: expiredDeals.map(deal => deal.id),
          },
        },
        data: {
          status: 'DISPUTED',
        },
      });
    }

    return NextResponse.json({ 
      expiredDeals: expiredDeals.length,
      deals: expiredDeals,
    });
  } catch (error) {
    console.error('Failed to check expired deals:', error);
    return NextResponse.json({ error: 'Failed to check expired deals' }, { status: 500 });
  }
}
