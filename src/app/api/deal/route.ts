import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transporterAddr = searchParams.get('transporter');
    const buyerAddr = searchParams.get('buyer');
    const farmerAddr = searchParams.get('farmer');
    const pending = searchParams.get('pending'); // New parameter for pending driver deals

    if (transporterAddr) {
      const transporter = await prisma.transporter.findUnique({
        where: { walletAddress: transporterAddr.toLowerCase() },
      });
      if (!transporter) {
        return NextResponse.json(
          { error: 'Transporter not found' },
          { status: 400 }
        );
      }
      const deals = await prisma.deal.findMany({
        where: { transporterId: transporter.id },
        include: {
          batch: {
            include: {
              farmer: true,
            },
          },
          buyer: true,
          transporter: true,
          platform: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      // Marshal deals into deliveries for the frontend
      const deliveries = deals.map((deal: any) => ({
        id: deal.id,
        status: deal.status,
        freightAmount: deal.freightAmount,
        batch: deal.batch,
        buyer: deal.buyer,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        sigMask: deal.sigMask,
        escrowTxHash: deal.escrowTxHash,
        // Add any other fields needed by the frontend here
      }));
      return NextResponse.json(deliveries);
    }

    if (farmerAddr) {
      const farmer = await prisma.farmer.findUnique({
        where: { walletAddress: farmerAddr.toLowerCase() },
      });
      if (!farmer) {
        return NextResponse.json({ error: 'Farmer not found' }, { status: 400 });
      }
      const deals = await prisma.deal.findMany({
        where: { farmerId: farmer.id },
        include: {
          batch: {
            include: {
              farmer: true,
            },
          },
          buyer: true,
          transporter: true,
          platform: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Ensure all necessary fields are included
      const farmerDeals = deals.map((deal: any) => ({
        ...deal,
        escrowTxHash: deal.escrowTxHash,
        sigMask: deal.sigMask,
        farmerAmount: deal.farmerAmount,
        platformFee: deal.platformFee,
        freightAmount: deal.freightAmount,
        totalLocked: deal.totalLocked,
      }));
      
      return NextResponse.json(farmerDeals);
    }

    // Get pending driver deals (no transporter assigned yet)
    if (pending === 'true') {
      const deals = await prisma.deal.findMany({
        where: {
          status: 'PENDING_DRIVER',
          transporterId: null,
        },
        include: {
          batch: {
            include: {
              farmer: true,
            },
          },
          buyer: true,
          transporter: true,
          platform: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(deals);
    }

    if (buyerAddr) {
      const buyer = await prisma.buyer.findUnique({
        where: { walletAddress: buyerAddr.toLowerCase() },
      });
      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 400 });
      }
      const deals = await prisma.deal.findMany({
        where: { buyerId: buyer.id },
        include: {
          batch: {
            include: {
              farmer: true,
            },
          },
          buyer: true,
          transporter: true,
          platform: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Ensure all necessary fields are included
      const buyerDeals = deals.map((deal: any) => ({
        ...deal,
        escrowTxHash: deal.escrowTxHash,
        sigMask: deal.sigMask,
        farmerAmount: deal.farmerAmount,
        platformFee: deal.platformFee,
        freightAmount: deal.freightAmount,
        totalLocked: deal.totalLocked,
      }));
      
      return NextResponse.json(buyerDeals);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Deal fetch failed', error);
    return NextResponse.json({ error: 'Deal fetch failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      batchId,
      buyerAddress,
      farmerAmount,
      platformFee,
      freightAmount,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      origin,
      destination,
      distanceKm,
      weightKg,
      signatureTimeoutHours = 24,
    } = body;

    const buyerWallet = buyerAddress.toLowerCase();

    const buyer = await prisma.buyer.findUnique({ where: { walletAddress: buyerWallet } });
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 400 });
    }

    const timeoutAt = new Date();
    timeoutAt.setHours(timeoutAt.getHours() + signatureTimeoutHours);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 400 });
    }

    // Calculate total locked amount
    const farmerAmountNum = parseFloat(farmerAmount);
    const platformFeeNum = parseFloat(platformFee || '0');
    const freightAmountNum = parseFloat(freightAmount || '0');
    const totalLocked = farmerAmountNum + platformFeeNum + freightAmountNum;

    const deal = await prisma.deal.create({
      data: {
        batchId,
        buyerId: buyer.id,
        farmerId: batch?.farmerId ?? '',
        originLat: originLat ?? batch?.locationLat ?? null,
        originLng: originLng ?? batch?.locationLng ?? null,
        origin: origin ?? batch?.origin ?? null,
        destination: destination ?? batch?.destination ?? null,
        destinationLat: destinationLat ?? null,
        destinationLng: destinationLng ?? null,
        distanceKm: distanceKm ?? null,
        weightKg: weightKg ?? batch?.weightKg ?? null,
        farmerAmount,
        platformFee: platformFee || null,
        freightAmount: freightAmount || null,
        totalLocked: totalLocked.toString(),
        signatureTimeoutHours,
        timeoutAt,
        sigMask: 0,
      },
      include: {
        batch: true,
        buyer: true,
        transporter: true,
        signatures: true,
      },
    });

    // Mark the batch as locked once a buyer commits
    await prisma.batch.update({
      where: { id: batchId },
      data: { status: 'LOCKED' },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Deal creation failed:', error);
    return NextResponse.json({ error: 'Deal creation failed' }, { status: 500 });
  }
}
