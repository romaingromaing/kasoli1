import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const wallet = address.toLowerCase();
  const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS?.toLowerCase();

  // First check the new User model for the current role
  const user = await prisma.user.findUnique({ 
    where: { walletAddress: wallet } 
  });

  if (user) {
    return NextResponse.json({ role: user.currentRole });
  }

  // If this is the platform address and no specific role is set, default to PLATFORM
  if (platformAddress && wallet === platformAddress) {
    return NextResponse.json({ role: 'PLATFORM' });
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
