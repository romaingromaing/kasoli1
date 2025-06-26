'use client';

import { BottomNav } from '@/components/ui/bottom-nav';

export default function FarmerRevenuePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-ocean-navy mb-4">Revenue</h1>
        <p className="text-dusk-gray">Your revenue summary will appear here.</p>
      </div>
      <BottomNav />
    </div>
  );
}
