import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const contractAddresses = {
      ESCROW: process.env.NEXT_PUBLIC_ESCROW,
      RECEIPT: process.env.NEXT_PUBLIC_RECEIPT,
      ORACLE: process.env.NEXT_PUBLIC_ORACLE,
      USDC: process.env.NEXT_PUBLIC_USDC,
      PLATFORM: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS,
    };

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

    return NextResponse.json({
      success: true,
      contractAddresses,
      rpcUrl,
      walletConnectProjectId,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Contract test failed:', error);
    return NextResponse.json({ error: 'Contract test failed' }, { status: 500 });
  }
} 