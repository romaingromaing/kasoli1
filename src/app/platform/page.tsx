'use client';

import { BottomNav } from '@/components/ui/bottom-nav';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function PlatformDashboard() {
  useRequireRole('PLATFORM');
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-ocean-navy mb-2">Platform Dashboard</h1>
        <p className="text-dusk-gray">Manage deals and platform settings</p>
      </div>
      <BottomNav />
    </div>
  );
}
