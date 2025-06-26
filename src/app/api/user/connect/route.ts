import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { address, role } = await request.json();
    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role required' }, { status: 400 });
    }
    const wallet = (address as string).toLowerCase();
    switch (role) {
      case 'FARMER':
        await prisma.farmer.upsert({
          where: { walletAddress: wallet },
          update: {},
          create: { walletAddress: wallet },
        });
        break;
      case 'BUYER':
        await prisma.buyer.upsert({
          where: { walletAddress: wallet },
          update: {},
          create: { walletAddress: wallet },
        });
        break;
      case 'TRANSPORTER':
        await prisma.transporter.upsert({
          where: { walletAddress: wallet },
          update: {},
          create: { walletAddress: wallet },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to connect user', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
