import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const role = searchParams.get('role');

    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role are required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();

    let userData;
    switch (role) {
      case 'FARMER':
        userData = await prisma.farmer.findUnique({
          where: { walletAddress }
        });
        break;
      case 'BUYER':
        userData = await prisma.buyer.findUnique({
          where: { walletAddress }
        });
        break;
      case 'TRANSPORTER':
        userData = await prisma.transporter.findUnique({
          where: { walletAddress }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Profile fetch failed:', error);
    return NextResponse.json({ error: 'Profile fetch failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, role, name, organisation, contactName, vehicleReg, phone, email } = body;

    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role are required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();

    let userData;
    switch (role) {
      case 'FARMER':
        userData = await prisma.farmer.update({
          where: { walletAddress },
          data: {
            name,
            phone,
            email,
          }
        });
        break;
      case 'BUYER':
        userData = await prisma.buyer.update({
          where: { walletAddress },
          data: {
            organisation,
            contactName,
            phone,
            email,
          }
        });
        break;
      case 'TRANSPORTER':
        userData = await prisma.transporter.update({
          where: { walletAddress },
          data: {
            name: contactName,
            vehicleReg,
            phone,
            email,
          }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Profile update failed:', error);
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
} 