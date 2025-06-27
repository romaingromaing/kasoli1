'use client';

import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useAccount, useDisconnect } from 'wagmi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlatformDashboardLink } from '@/components/ui/platform-dashboard-link';

export default function BuyerProfilePage() {
  useRequireRole('BUYER');
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const handleLogout = () => {
    disconnect();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold text-ocean-navy">Profile</h1>
        <p className="text-dusk-gray break-all">Address: {address}</p>
        <PlatformDashboardLink />
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
      <BottomNav />
    </div>
  );
}
