import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { address, role, profile } = await request.json();
    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role required' }, { status: 400 });
    }
    const wallet = (address as string).toLowerCase();

    const existing = await prisma.user.findUnique({ where: { walletAddress: wallet } });

    if (existing) {
      if (existing.currentRole !== role) {
        return NextResponse.json({ error: 'Role already assigned' }, { status: 400 });
      }
      // Update profile details if provided
      switch (role) {
        case 'FARMER':
          await prisma.farmer.update({
            where: { walletAddress: wallet },
            data: { name: profile?.name, phone: profile?.phone },
          }).catch(() => {});
          break;
        case 'BUYER':
          await prisma.buyer.update({
            where: { walletAddress: wallet },
            data: { organisation: profile?.organisation, contactName: profile?.contactName, phone: profile?.phone },
          }).catch(() => {});
          break;
        case 'TRANSPORTER':
          await prisma.transporter.update({
            where: { walletAddress: wallet },
            data: { name: profile?.name, vehicleReg: profile?.vehicleReg, phone: profile?.phone },
          }).catch(() => {});
          break;
        case 'PLATFORM':
          await prisma.platform.update({
            where: { id: 1 },
            data: { walletAddress: wallet, name: profile?.name, url: profile?.url },
          }).catch(() => {});
          break;
      }
      return NextResponse.json({ success: true });
    }

    await prisma.user.create({
      data: { walletAddress: wallet, currentRole: role },
    });

    switch (role) {
      case 'FARMER':
        await prisma.farmer.create({
          data: { walletAddress: wallet, name: profile?.name ?? null, phone: profile?.phone ?? null },
        });
        break;
      case 'BUYER':
        await prisma.buyer.create({
          data: { walletAddress: wallet, organisation: profile?.organisation ?? null, contactName: profile?.contactName ?? null, phone: profile?.phone ?? null },
        });
        break;
      case 'TRANSPORTER':
        await prisma.transporter.create({
          data: { walletAddress: wallet, name: profile?.name ?? null, vehicleReg: profile?.vehicleReg ?? null, phone: profile?.phone ?? null },
        });
        break;
      case 'PLATFORM':
        await prisma.platform.create({
          data: { id: 1, walletAddress: wallet, name: profile?.name ?? null, url: profile?.url ?? null },
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
