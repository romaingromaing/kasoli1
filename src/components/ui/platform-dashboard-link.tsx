import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Settings } from 'lucide-react';

export function PlatformDashboardLink() {
  const { address } = useAccount();
  const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || '';

  if (!address || !platformAddress) return null;

  if (address.toLowerCase() !== platformAddress.toLowerCase()) return null;

  return (
    <Link 
      href="/platform" 
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ocean-navy to-teal-deep text-warm-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
    >
      <Settings className="w-4 h-4" />
      <span className="font-medium">Platform Dashboard</span>
    </Link>
  );
} 