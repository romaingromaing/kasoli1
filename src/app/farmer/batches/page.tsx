'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, Package } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function FarmerBatchesPage() {
  useRequireRole('FARMER');
  const { address } = useAccount();
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const res = await fetch(`/api/batch?farmer=${address}`);
        if (!res.ok) return;
        const data = await res.json();
        setBatches(data);
      } catch (err) {
        console.error('Failed loading batches', err);
      }
    }
    load();
  }, [address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-ocean-navy mb-6">Batches</h1>
        <div className="space-y-4">
          {batches.map((batch, index) => (
            <motion.div
              key={batch.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-deep/10 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-teal-deep" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-ocean-navy">{batch.grade}</div>
                    <div className="text-sm text-dusk-gray">{batch.weightKg} kg</div>
                    <div className="flex items-center gap-1 text-sm text-dusk-gray mt-1">
                      <MapPin size={14} />
                      {batch.origin}
                    </div>
                    {batch.locationLat && (
                      <div className="text-xs text-dusk-gray mt-1">
                        {batch.locationLat.toFixed(5)}, {batch.locationLng.toFixed(5)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        batch.status === 'LISTED'
                          ? 'text-teal-deep'
                          : batch.status === 'IN_TRANSIT'
                          ? 'text-orange-500'
                          : 'text-aqua-mint'
                      }`}
                    >
                      {batch.status}
                    </div>
                    <div className="text-xs text-dusk-gray">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
