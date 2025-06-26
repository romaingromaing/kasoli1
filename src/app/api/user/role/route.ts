import { NextRequest, NextResponse } from 'next/server';

// Mock user roles for demo
const mockUsers: Record<string, string> = {
  '0x1234567890123456789012345678901234567890': 'FARMER',
  '0x2345678901234567890123456789012345678901': 'BUYER',
  '0x3456789012345678901234567890123456789012': 'TRANSPORTER',
  '0x4567890123456789012345678901234567890123': 'PLATFORM',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  // In a real app, you'd query your database here
  const role = mockUsers[address] || 'FARMER'; // Default to FARMER for demo

  return NextResponse.json({ role });
}