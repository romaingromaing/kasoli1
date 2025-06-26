import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { address, role } = await request.json();
    if (!address || !role) {
      return NextResponse.json({ error: 'Address and role required' }, { status: 400 });
    }
    const wallet = (address as string).toLowerCase();
    
    // For role switching, we need to remove old roles and set the new one
    // Use a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Remove from all role tables first
      await Promise.all([
        tx.farmer.deleteMany({ where: { walletAddress: wallet } }),
        tx.buyer.deleteMany({ where: { walletAddress: wallet } }),
        tx.transporter.deleteMany({ where: { walletAddress: wallet } }),
      ]);
      
      // Then add to the new role table
      switch (role) {
        case 'FARMER':
          await tx.farmer.create({ data: { walletAddress: wallet } });
          break;
        case 'BUYER':
          await tx.buyer.create({ data: { walletAddress: wallet } });
          break;
        case 'TRANSPORTER':
          await tx.transporter.create({ data: { walletAddress: wallet } });
          break;
        default:
          throw new Error('Invalid role');
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to connect user', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
