'use client';

import { BottomNav } from '@/components/ui/bottom-nav';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/components/ui/profile-card';

export default function FarmerProfilePage() {
  useRequireRole('FARMER');
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const handleLogout = () => {
    disconnect();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <ProfileCard userType="FARMER" onLogout={handleLogout} />
      </div>
      <BottomNav />
    </div>
  );
}
