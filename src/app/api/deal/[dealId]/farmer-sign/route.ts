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
    const body = await req.json();
    const { farmerAddress, txHash } = body;

    if (!farmerAddress) {
      return NextResponse.json({ error: 'Farmer address is required' }, { status: 400 });
    }

    // Find the deal with farmer information
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { 
        batch: {
          include: {
            farmer: true,
          },
        },
      },
    });
    
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Verify the farmer address matches the deal's farmer
    const dealFarmerAddress = deal.batch?.farmer?.walletAddress;
    if (!dealFarmerAddress) {
      return NextResponse.json({ error: 'Deal farmer not found' }, { status: 404 });
    }

    if (dealFarmerAddress.toLowerCase() !== farmerAddress.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Unauthorized farmer. Only the deal farmer can sign this batch.',
        expectedFarmer: dealFarmerAddress,
        providedFarmer: farmerAddress
      }, { status: 403 });
    }

    // Check if farmer has already signed
    if (deal.sigMask & FARMER_BIT) {
      return NextResponse.json({ error: 'Farmer has already signed this deal' }, { status: 400 });
    }

    // Update sigMask to set the farmer bit
    const newSigMask = deal.sigMask | FARMER_BIT;
    let newStatus = deal.status;
    let batchStatus = deal.batch.status;

    // If both farmer and transporter have signed (sigMask = 6), update status to READY_TO_FINAL
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
      include: { 
        batch: {
          include: {
            farmer: true,
          },
        },
      },
    });

    // Update batch status if needed
    let updatedBatch = deal.batch;
    if (batchStatus !== deal.batch.status) {
      updatedBatch = await prisma.batch.update({
        where: { id: deal.batch.id },
        data: { status: batchStatus },
        include: {
          farmer: true,
        },
      });
    }

    // Create signature record if txHash is provided
    if (txHash) {
      await prisma.signature.create({
        data: {
          dealId: dealId,
          role: 'FARMER',
          txHash: txHash,
        },
      });
    }

    return NextResponse.json({ deal: updatedDeal, batch: updatedBatch });
  } catch (error) {
    console.error('Farmer sign failed:', error);
    return NextResponse.json({ error: 'Farmer sign failed' }, { status: 500 });
  }
} 