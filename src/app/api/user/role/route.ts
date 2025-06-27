import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const wallet = address.toLowerCase();

  // First check the new User model for the current role
  const user = await prisma.user.findUnique({ 
    where: { walletAddress: wallet } 
  });

  if (user) {
    return NextResponse.json({ role: user.currentRole });
  }

  // Fallback to the old method for backwards compatibility
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

  // If we found a role using the old method, create a User record for future use
  if (role) {
    await prisma.user.create({
      data: {
        walletAddress: wallet,
        currentRole: role as any,
      },
    }).catch(() => {}); // Ignore errors if user already exists
  }

  return NextResponse.json({ role });
}
