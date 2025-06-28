import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  console.log('=== DEAL ACCEPT GET CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  const { dealId } = await params;
  return NextResponse.json({ 
    message: 'Route is working', 
    dealId,
    method: 'GET',
    note: 'This route only accepts POST requests for accepting deals'
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  console.log('=== DEAL ACCEPT API CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  try {
    const { dealId } = await params;
    console.log('Deal ID from params:', dealId);
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { transporterAddress } = body;

    if (!transporterAddress) {
      console.log('Missing transporter address');
      return NextResponse.json(
        { error: 'Transporter address is required' },
        { status: 400 }
      );
    }

    console.log('Transporter address:', transporterAddress);

    // Find or create the transporter
    let transporter = await prisma.transporter.findUnique({
      where: { walletAddress: transporterAddress.toLowerCase() },
    });

    if (!transporter) {
      console.log('Creating new transporter');
      // Create transporter if not found (first time accepting a deal)
      transporter = await prisma.transporter.create({
        data: { walletAddress: transporterAddress.toLowerCase() },
      });
    }

    console.log('Transporter found/created:', transporter.id);

    // Find the deal and ensure it's still available
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { batch: true },
    });

    if (!deal) {
      console.log('Deal not found:', dealId);
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    console.log('Deal found:', deal.id, 'Status:', deal.status);

    if (deal.status !== 'PENDING_DRIVER' || deal.transporterId) {
      console.log('Deal not available - Status:', deal.status, 'TransporterId:', deal.transporterId);
      return NextResponse.json(
        { error: 'Deal is no longer available' },
        { status: 400 }
      );
    }

    // Accept the deal
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        transporterId: transporter.id,
        status: 'AWAITING_ESCROW',
      },
      include: {
        batch: {
          include: {
            farmer: true,
          },
        },
        buyer: true,
        transporter: true,
      },
    });

    console.log('Deal updated successfully:', updatedDeal.id);

    // Assign transporter to the batch as well
    await prisma.batch.update({
      where: { id: updatedDeal.batchId },
      data: { transporterId: transporter.id },
    });

    console.log('Batch updated successfully');
    console.log('=== DEAL ACCEPT SUCCESS ===');

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('=== DEAL ACCEPT ERROR ===');
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Failed to accept deal' },
      { status: 500 }
    );
  }
}
