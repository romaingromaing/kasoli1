'use client';

import { motion } from 'framer-motion';
import { MapPin, Package } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function TransporterDealsPage() {
  useRequireRole('TRANSPORTER');
  const { address } = useAccount();
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [historyDeals, setHistoryDeals] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const res = await fetch(`/api/deal?transporter=${address}`);
        if (!res.ok) return;
        const data = await res.json();
        const pending = data.filter(
          (deal: any) =>
            deal.status !== 'PAID_OUT' &&
            deal.status !== 'DISPUTED'
        );
        setPendingDeals(pending);
        const history = data.filter(
          (deal: any) => deal.status === 'PAID_OUT' || deal.status === 'DISPUTED'
        );
        setHistoryDeals(history);
      } catch (err) {
        console.error('Failed loading deals', err);
      }
    }
    load();
  }, [address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <h1 className="text-3xl font-bold text-ocean-navy mb-6">Deals</h1>

          <h2 className="text-xl font-semibold text-ocean-navy mb-4">Pending Deliveries</h2>
          <div className="space-y-4 mb-8">
            {pendingDeals.length === 0 ? (
              <p className="text-dusk-gray">No pending deliveries</p>
            ) : (
              pendingDeals.map((deal, index) => (
                <motion.div
                  key={deal.id}
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
                        <div className="font-medium text-ocean-navy">
                          {deal.batch?.grade || 'Batch'}
                        </div>
                        <div className="text-sm text-dusk-gray">{deal.batch?.weightKg} kg</div>
                        <div className="flex items-center gap-1 text-sm text-dusk-gray mt-1">
                          <MapPin size={14} />
                          {deal.batch?.origin}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-teal-deep">{deal.status}</div>
                        <div className="text-xs text-dusk-gray">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <h2 className="text-xl font-semibold text-ocean-navy mb-4">History</h2>
          <div className="space-y-4">
            {historyDeals.map((deal, index) => (
              <motion.div
                key={deal.id}
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
                      <div className="font-medium text-ocean-navy">
                        {deal.batch?.grade || 'Batch'}
                      </div>
                      <div className="text-sm text-dusk-gray">{deal.batch?.weightKg} kg</div>
                      <div className="flex items-center gap-1 text-sm text-dusk-gray mt-1">
                        <MapPin size={14} />
                        {deal.batch?.origin}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          deal.status === 'PAID_OUT' ? 'text-aqua-mint' : 'text-dusk-gray'
                        }`}
                      >
                        {deal.status}
                      </div>
                      <div className="text-xs text-dusk-gray">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
