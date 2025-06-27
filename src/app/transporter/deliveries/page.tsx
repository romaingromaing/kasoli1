'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function TransporterDeliveriesPage() {
  useRequireRole('TRANSPORTER');
  const { address } = useAccount();
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const res = await fetch(`/api/deal?transporter=${address}`);
        if (!res.ok) return;
        const data = await res.json();
        const pending = data.filter(
          (deal: any) => deal.status !== 'PAID_OUT' && deal.status !== 'DISPUTED'
        );
        setDeliveries(pending);
      } catch (err) {
        console.error('Failed loading deliveries', err);
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
          <h1 className="text-3xl font-bold text-ocean-navy mb-6">Pending Deliveries</h1>
          <div className="space-y-4">
            {deliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-ocean-navy">
                        Batch #{delivery.batch?.receiptTokenId}
                      </div>
                      <div className="text-sm text-dusk-gray">
                        {delivery.batch?.farmer?.name} → {delivery.buyer?.organisation || delivery.buyer?.contactName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ocean-navy">{delivery.freightAmount ?? ''}</div>
                      <div className="text-sm text-dusk-gray">-</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-teal-deep" />
                      <span className="text-dusk-gray">Pickup:</span>
                      <span className="text-ocean-navy">{delivery.batch?.origin}</span>
                      {delivery.batch?.locationLat && (
                        <span className="text-xs text-dusk-gray"> ({delivery.batch.locationLat.toFixed(5)}, {delivery.batch.locationLng.toFixed(5)})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-aqua-mint" />
                      <span className="text-dusk-gray">Delivery:</span>
                      <span className="text-ocean-navy">{delivery.batch?.destination}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        delivery.status === 'PENDING_SIGS'
                          ? 'bg-lime-lush/20 text-lime-700'
                          : delivery.status === 'AWAITING_ESCROW'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-aqua-mint/20 text-aqua-mint'
                      }`}
                    >
                      {delivery.status}
                    </span>
                    <Button size="sm" variant="outline">
                      {delivery.status === 'PENDING_SIGS'
                        ? 'Sign Pickup'
                        : delivery.status === 'AWAITING_ESCROW'
                        ? 'Awaiting Buyer'
                        : 'Track'}
                    </Button>
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
