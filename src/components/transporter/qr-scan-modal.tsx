'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanModal({ isOpen, onClose }: QRScanModalProps) {
  const [batchId, setBatchId] = useState('');
  const [step, setStep] = useState<'scan' | 'confirm' | 'success'>('scan');
  const [batchDetails, setBatchDetails] = useState<any>(null);

  const handleScan = () => {
    if (!batchId) {
      toast.error('Please enter batch ID');
      return;
    }

    // Mock batch lookup
    setBatchDetails({
      id: batchId,
      farmer: 'John Mukasa',
      weight: '2,500 kg',
      grade: 'Grade A',
      pickup: 'Kampala Warehouse',
      delivery: 'Entebbe Processing',
    });
    setStep('confirm');
  };

  const handleConfirmPickup = () => {
    setStep('success');
    toast.success('Pickup confirmed successfully!');
    
    setTimeout(() => {
      onClose();
      setStep('scan');
      setBatchId('');
      setBatchDetails(null);
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Batch QR Code">
      {step === 'scan' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-32 h-32 border-4 border-dashed border-dusk-gray/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-12 h-12 text-dusk-gray" />
            </div>
            <p className="text-dusk-gray">
              Position the QR code within the frame or enter batch ID manually
            </p>
          </div>

          <Input
            label="Batch ID (Manual Entry)"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Enter batch ID"
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleScan} className="flex-1">
              Lookup Batch
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && batchDetails && (
        <div className="space-y-6">
          <div className="bg-lime-lush/10 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-3">Batch Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray">Batch ID:</span>
                <span className="text-ocean-navy font-mono">#{batchDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Farmer:</span>
                <span className="text-ocean-navy">{batchDetails.farmer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Weight:</span>
                <span className="text-ocean-navy">{batchDetails.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Grade:</span>
                <span className="text-ocean-navy">{batchDetails.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Pickup:</span>
                <span className="text-ocean-navy">{batchDetails.pickup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Delivery:</span>
                <span className="text-ocean-navy">{batchDetails.delivery}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Confirm:</strong> I have picked up this batch and it matches the description above.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('scan')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleConfirmPickup} className="flex-1">
              Confirm Pickup
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-16 h-16 bg-aqua-mint/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-aqua-mint" />
          </motion.div>
          <h3 className="text-lg font-semibold text-ocean-navy mb-2">
            Pickup Confirmed!
          </h3>
          <p className="text-dusk-gray">
            Batch is now in transit. Safe travels!
          </p>
        </div>
      )}
    </Modal>
  );
}