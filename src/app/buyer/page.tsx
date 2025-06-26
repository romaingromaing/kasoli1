'use client';

import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useState, useEffect } from 'react';
import { CommitModal } from '@/components/buyer/commit-modal';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function BuyerDashboard() {
  useRequireRole('BUYER');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/batch?status=LISTED');
        if (!res.ok) return;
        const data = await res.json();
        setAvailableBatches(data);
      } catch (err) {
        console.error('Failed loading batches', err);
      }
    }
    load();
  }, []);

  const handleCommit = (batch: any) => {
    setSelectedBatch(batch);
    setShowCommitModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ocean-navy mb-2">Grain Market</h1>
            <p className="text-dusk-gray">Find and purchase quality grain batches</p>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by location, farmer, or grade..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dusk-gray" />
            </div>
            <Button variant="outline" className="px-4">
              <Filter size={20} />
            </Button>
          </div>

          <div className="space-y-4">
            {availableBatches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-dusk-gray/10 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={batch.photoCid ? `https://ipfs.io/ipfs/${batch.photoCid}` : ''}
                        alt="Grain batch"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-ocean-navy">{batch.farmer?.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-dusk-gray">
                            <MapPin size={14} />
                            {batch.origin}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{batch.rating ?? 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-4 text-sm">
                          <span className="bg-teal-deep/10 text-teal-deep px-2 py-1 rounded-full">
                            {batch.grade}
                          </span>
                          <span className="text-dusk-gray">{batch.weightKg} kg</span>
                        </div>
                        <div className="text-lg font-bold text-ocean-navy">
                          {batch.price ?? '-'}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleCommit(batch)}
                        size="sm"
                        className="w-full"
                      >
                        Commit & Pay
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <CommitModal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        batch={selectedBatch}
      />
      <BottomNav />
    </div>
  );
}