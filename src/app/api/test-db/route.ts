import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const batchCount = await prisma.batch.count();
    const farmerCount = await prisma.farmer.count();
    const buyerCount = await prisma.buyer.count();
    
    // Get some sample data
    const recentBatches = await prisma.batch.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { farmer: true }
    });
    
    return NextResponse.json({
      success: true,
      counts: {
        batches: batchCount,
        farmers: farmerCount,
        buyers: buyerCount
      },
      recentBatches
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error 
    }, { status: 500 });
  }
}
