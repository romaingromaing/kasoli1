'use client';

import { motion } from 'framer-motion';
import { Plus, Package, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/bottom-nav';
import Link from 'next/link';
import { useState } from 'react';
import { CreateBatchModal } from '@/components/farmer/create-batch-modal';

export default function FarmerDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = [
    {
      label: 'Active Batches',
      value: '12',
      icon: Package,
      color: 'text-teal-deep',
      href: '/farmer/batches',
    },
    {
      label: 'Total Revenue',
      value: '$24,500',
      icon: TrendingUp,
      color: 'text-aqua-mint',
      href: '/farmer/revenue',
    },
    {
      label: 'Pending Deals',
      value: '3',
      icon: Clock,
      color: 'text-orange-500',
      href: '/farmer/deals',
    },
  ];

  const recentBatches = [
    { id: '1', grade: 'Grade A', weight: '2,500 kg', status: 'Listed', date: '2 days ago' },
    { id: '2', grade: 'Grade B', weight: '1,800 kg', status: 'In Transit', date: '5 days ago' },
    { id: '3', grade: 'Grade A', weight: '3,200 kg', status: 'Delivered', date: '1 week ago' },
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
              <h1 className="text-3xl font-bold text-ocean-navy">Dashboard</h1>
              <p className="text-dusk-gray mt-1">Manage your grain batches</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              New Batch
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Link key={stat.label} href={stat.href} passHref>
                <motion.div
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
              </Link>
            ))}
          </div>

          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-ocean-navy">Recent Batches</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentBatches.map((batch, index) => (
                <motion.div
                  key={batch.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-center justify-between p-4 bg-lime-lush/5 rounded-xl hover:bg-lime-lush/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-deep/10 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-teal-deep" />
                    </div>
                    <div>
                      <div className="font-medium text-ocean-navy">{batch.grade}</div>
                      <div className="text-sm text-dusk-gray">{batch.weight}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      batch.status === 'Listed' ? 'text-teal-deep' :
                      batch.status === 'In Transit' ? 'text-orange-500' :
                      'text-aqua-mint'
                    }`}>
                      {batch.status}
                    </div>
                    <div className="text-xs text-dusk-gray">{batch.date}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <CreateBatchModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <BottomNav />
    </div>
  );
}