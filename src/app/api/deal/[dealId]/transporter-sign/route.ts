import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Transporter bit is 0x4, Farmer bit is 0x2, Buyer bit is 0x1
const TRANSPORTER_BIT = 0x4;
const FARMER_BIT = 0x2;
const BUYER_BIT = 0x1;

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  try {
    const { dealId } = await params;
    const body = await req.json();
    const { transporterAddress, txHash } = body;

    if (!transporterAddress) {
      return NextResponse.json({ error: 'Transporter address is required' }, { status: 400 });
    }

    // Get the deal with all related data
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

    // Find the transporter by wallet address
    const transporter = await prisma.transporter.findUnique({
      where: { walletAddress: transporterAddress.toLowerCase() },
    });

    if (!transporter) {
      return NextResponse.json({ error: 'Transporter not found' }, { status: 404 });
    }

    // Update the deal to include the transporter and update signature mask
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        transporterId: transporter.id,
        status: 'AWAITING_ESCROW', // Update status when transporter accepts
        sigMask: deal.sigMask | TRANSPORTER_BIT, // Add transporter signature bit
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
          role: 'TRANSPORTER',
          txHash: txHash,
        },
      });
    }

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Failed to assign transporter to deal:', error);
    return NextResponse.json({ error: 'Failed to assign transporter to deal' }, { status: 500 });
  }
} 