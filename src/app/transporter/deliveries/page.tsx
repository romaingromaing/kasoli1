'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, XCircle, User, Truck, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

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

  async function handleTransporterSign(delivery: any) {
    try {
      console.log('Sign Pickup button clicked for delivery:', delivery);
      const res = await fetch(`/api/deal/${delivery.id}/transporter-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporterAddress: address,
        }),
      });
      const data = await res.json();
      console.log('Sign pickup API response:', res.status, data);
      if (!res.ok) {
        toast.error('Failed to sign pickup');
        return;
      }
      toast.success('Pickup signed!');
      // Refresh deliveries
      if (address) {
        const res = await fetch(`/api/deal?transporter=${address}`);
        if (res.ok) {
          const data = await res.json();
          const pending = data.filter(
            (deal: any) => deal.status !== 'PAID_OUT' && deal.status !== 'DISPUTED'
          );
          setDeliveries(pending);
        }
      }
    } catch (err) {
      toast.error('Failed to sign pickup');
      console.error('Error in handleTransporterSign:', err);
    }
  }

  function renderSigStatus(delivery: any) {
    const sigMask = delivery.sigMask || 0;
    return (
      <div className="flex gap-2 mt-2">
        <span className="flex items-center gap-1 text-xs">
          <User size={14} className={sigMask & 0x2 ? 'text-green-600' : 'text-gray-400'} />
          Farmer
          {sigMask & 0x2 ? <CheckCircle size={12} className="text-green-600" /> : <XCircle size={12} className="text-gray-400" />}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <Truck size={14} className={sigMask & 0x4 ? 'text-green-600' : 'text-gray-400'} />
          Transporter
          {sigMask & 0x4 ? <CheckCircle size={12} className="text-green-600" /> : <XCircle size={12} className="text-gray-400" />}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <ShoppingCart size={14} className={sigMask & 0x1 ? 'text-green-600' : 'text-gray-400'} />
          Buyer
          {sigMask & 0x1 ? <CheckCircle size={12} className="text-green-600" /> : <XCircle size={12} className="text-gray-400" />}
        </span>
      </div>
    );
  }

  console.log('Deliveries for transporter:', deliveries);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <Button onClick={() => alert('Button works!')} className="mb-4">Test Button</Button>
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
                    {renderSigStatus(delivery)}
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
                    {delivery.status === 'PENDING_SIGS' && (delivery.sigMask & 0x2) && !(delivery.sigMask & 0x4) ? (
                      <Button size="sm" variant="outline" onClick={() => { console.log('Button onClick for delivery:', delivery); handleTransporterSign(delivery); }}>
                        Sign Pickup
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {delivery.status === 'AWAITING_ESCROW'
                          ? 'Awaiting Buyer'
                          : delivery.status === 'PENDING_SIGS' && !(delivery.sigMask & 0x2)
                          ? 'Waiting for Farmer'
                          : 'Track'}
                      </Button>
                    )}
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
