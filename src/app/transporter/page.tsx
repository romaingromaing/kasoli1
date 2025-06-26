'use client';

import { motion } from 'framer-motion';
import { QrCode, Truck, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useState } from 'react';
import { QRScanModal } from '@/components/transporter/qr-scan-modal';

export default function TransporterDashboard() {
  const [showScanModal, setShowScanModal] = useState(false);

  const activeDeliveries = [
    {
      id: '1',
      batchId: 'B001',
      farmer: 'John Mukasa',
      buyer: 'Grain Corp Ltd',
      pickup: 'Kampala Warehouse',
      delivery: 'Entebbe Processing',
      distance: '25 km',
      status: 'Ready for Pickup',
      freight: '$45',
    },
    {
      id: '2',
      batchId: 'B002',
      farmer: 'Sarah Nakato',
      buyer: 'Export Foods',
      pickup: 'Jinja Silo',
      delivery: 'Port Bell',
      distance: '35 km',
      status: 'In Transit',
      freight: '$62',
    },
  ];

  const stats = [
    { label: 'Active Deliveries', value: '2', icon: Truck, color: 'text-teal-deep' },
    { label: 'This Month', value: '$1,240', icon: Clock, color: 'text-aqua-mint' },
    { label: 'Completed', value: '18', icon: MapPin, color: 'text-lime-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-ocean-navy">Deliveries</h1>
              <p className="text-dusk-gray mt-1">Manage your transport jobs</p>
            </div>
            <Button
              onClick={() => setShowScanModal(true)}
              className="flex items-center gap-2"
            >
              <QrCode size={20} />
              Scan QR
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card className="text-center">
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl font-bold text-ocean-navy mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-dusk-gray">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-ocean-navy mb-6">Active Deliveries</h2>
            <div className="space-y-4">
              {activeDeliveries.map((delivery, index) => (
                <motion.div
                  key={delivery.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="border border-dusk-gray/20 rounded-xl p-4 hover:bg-lime-lush/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-ocean-navy">
                        Batch #{delivery.batchId}
                      </div>
                      <div className="text-sm text-dusk-gray">
                        {delivery.farmer} → {delivery.buyer}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ocean-navy">{delivery.freight}</div>
                      <div className="text-sm text-dusk-gray">{delivery.distance}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-teal-deep" />
                      <span className="text-dusk-gray">Pickup:</span>
                      <span className="text-ocean-navy">{delivery.pickup}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-aqua-mint" />
                      <span className="text-dusk-gray">Delivery:</span>
                      <span className="text-ocean-navy">{delivery.delivery}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      delivery.status === 'Ready for Pickup' 
                        ? 'bg-lime-lush/20 text-lime-700'
                        : 'bg-aqua-mint/20 text-aqua-mint'
                    }`}>
                      {delivery.status}
                    </span>
                    <Button size="sm" variant="outline">
                      {delivery.status === 'Ready for Pickup' ? 'Sign Pickup' : 'Track'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <QRScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
      />
      <BottomNav />
    </div>
  );
}