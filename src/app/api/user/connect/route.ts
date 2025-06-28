import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { address, role, profile } = await request.json();
    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role required' }, { status: 400 });
    }

    // Validate email is provided for all user types
    if (!profile?.email || !profile.email.trim()) {
      return NextResponse.json({ error: 'Email address is required for all user types' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const wallet = (address as string).toLowerCase();
    const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS?.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { walletAddress: wallet } });

    if (existing) {
      // Allow platform address to switch roles freely
      if (existing.currentRole !== role && platformAddress && wallet === platformAddress) {
        // Update the user's current role
        await prisma.user.update({
          where: { walletAddress: wallet },
          data: { currentRole: role as any },
        });
      } else if (existing.currentRole !== role) {
        return NextResponse.json({ error: 'Role already assigned' }, { status: 400 });
      }
      
      // Update profile details if provided
      switch (role) {
        case 'FARMER':
          await prisma.farmer.update({
            where: { walletAddress: wallet },
            data: { 
              name: profile?.name, 
              phone: profile?.phone,
              email: profile?.email 
            },
          }).catch(() => {});
          break;
        case 'BUYER':
          await prisma.buyer.update({
            where: { walletAddress: wallet },
            data: { 
              organisation: profile?.organisation, 
              contactName: profile?.contactName, 
              phone: profile?.phone,
              email: profile?.email 
            },
          }).catch(() => {});
          break;
        case 'TRANSPORTER':
          await prisma.transporter.update({
            where: { walletAddress: wallet },
            data: { 
              name: profile?.name, 
              vehicleReg: profile?.vehicleReg, 
              phone: profile?.phone,
              email: profile?.email 
            },
          }).catch(() => {});
          break;
        case 'PLATFORM':
          await prisma.platform.update({
            where: { id: 1 },
            data: { 
              walletAddress: wallet, 
              name: profile?.name, 
              url: profile?.url,
              email: profile?.email 
            },
          }).catch(() => {});
          break;
      }
      return NextResponse.json({ success: true });
    }

    await prisma.user.create({
      data: { 
        walletAddress: wallet, 
        currentRole: role,
        email: profile?.email 
      },
    });

    switch (role) {
      case 'FARMER':
        await prisma.farmer.create({
          data: { 
            walletAddress: wallet, 
            name: profile?.name ?? null, 
            phone: profile?.phone ?? null,
            email: profile?.email ?? null 
          },
        });
        break;
      case 'BUYER':
        await prisma.buyer.create({
          data: { 
            walletAddress: wallet, 
            organisation: profile?.organisation ?? null, 
            contactName: profile?.contactName ?? null, 
            phone: profile?.phone ?? null,
            email: profile?.email ?? null 
          },
        });
        break;
      case 'TRANSPORTER':
        await prisma.transporter.create({
          data: { 
            walletAddress: wallet, 
            name: profile?.name ?? null, 
            vehicleReg: profile?.vehicleReg ?? null, 
            phone: profile?.phone ?? null,
            email: profile?.email ?? null 
          },
        });
        break;
      case 'PLATFORM':
        await prisma.platform.create({
          data: { 
            id: 1, 
            walletAddress: wallet, 
            name: profile?.name ?? null, 
            url: profile?.url ?? null,
            email: profile?.email ?? null 
          },
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
