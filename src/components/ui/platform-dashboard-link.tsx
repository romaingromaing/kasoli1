import Link from 'next/link';
import { useAccount } from 'wagmi';

export function PlatformDashboardLink() {
  const { address } = useAccount();
  const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || '';

  if (!address || !platformAddress) return null;

  if (address.toLowerCase() !== platformAddress.toLowerCase()) return null;

  return (
    <Link href="/platform" className="text-teal-deep underline">
      Platform Dashboard
    </Link>
  );
} 