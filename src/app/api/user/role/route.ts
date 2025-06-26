import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const wallet = address.toLowerCase();

  const [farmer, buyer, transporter, platform] = await Promise.all([
    prisma.farmer.findUnique({ where: { walletAddress: wallet } }),
    prisma.buyer.findUnique({ where: { walletAddress: wallet } }),
    prisma.transporter.findUnique({ where: { walletAddress: wallet } }),
    prisma.platform.findFirst({ where: { walletAddress: wallet } }),
  ]);

  let role: string | null = null;
  if (farmer) role = 'FARMER';
  else if (buyer) role = 'BUYER';
  else if (transporter) role = 'TRANSPORTER';
  else if (platform) role = 'PLATFORM';

  return NextResponse.json({ role });
}
