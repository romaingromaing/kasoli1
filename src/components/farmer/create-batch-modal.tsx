'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, RECEIPT_ABI } from '@/lib/contracts';
import toast from 'react-hot-toast';
import { QRGenerator } from '@/components/qr-generator';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBatchModal({ isOpen, onClose }: CreateBatchModalProps) {
  const [formData, setFormData] = useState({
    weight: '',
    grade: '1',
    photo: null as File | null,
  });
  const [step, setStep] = useState<'form' | 'minting' | 'success'>('form');
  const [tokenId, setTokenId] = useState<string>('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.weight || !formData.photo) {
      toast.error('Please fill all fields and upload a photo');
      return;
    }

    setStep('minting');

    try {
      // Upload photo to IPFS via Next.js route
      const photoData = new FormData();
      photoData.set('file', formData.photo);
      const photoRes = await fetch('/api/ipfs/file', {
        method: 'POST',
        body: photoData,
      });
      const photoJson = await photoRes.json();
      const photoCID = photoJson.cid as string;

      // Upload metadata JSON referencing the photo
      const meta = {
        weightKg: parseFloat(formData.weight),
        grade: parseInt(formData.grade),
        image: `ipfs://${photoCID}`,
      };
      const metaRes = await fetch('/api/ipfs/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      });
      const metaJson = await metaRes.json();
      const metaCID = metaJson.cid as string;

      writeContract({
        address: CONTRACTS.RECEIPT as `0x${string}`,
        abi: RECEIPT_ABI,
        functionName: 'mint',
        args: [
          '0x1234567890123456789012345678901234567890' as `0x${string}`, // farmer address
          BigInt(Math.floor(parseFloat(formData.weight) * 1000)), // weight in grams
          parseInt(formData.grade) as 1 | 2 | 3 | 4 | 5,
          metaCID,
          photoCID,
        ],
      });

      // Mock success for demo
      setTimeout(() => {
        setTokenId('12345');
        setStep('success');
        toast.success('Batch created successfully!');
      }, 2000);

    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
      setStep('form');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ weight: '', grade: '1', photo: null });
    setTokenId('');
    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Batch">
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            placeholder="Enter weight in kg"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ocean-navy">
              Grade
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent"
            >
              <option value="1">Grade 1 (Premium)</option>
              <option value="2">Grade 2 (Good)</option>
              <option value="3">Grade 3 (Standard)</option>
              <option value="4">Grade 4 (Fair)</option>
              <option value="5">Grade 5 (Poor)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ocean-navy">
              Batch Photo
            </label>
            <div className="border-2 border-dashed border-dusk-gray/30 rounded-xl p-6 text-center">
              {formData.photo ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-aqua-mint/20 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-aqua-mint" />
                  </div>
                  <p className="text-sm text-ocean-navy font-medium">{formData.photo.name}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, photo: null }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="w-16 h-16 bg-lime-lush/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-8 h-8 text-teal-deep" />
                  </div>
                  <p className="text-sm text-dusk-gray">Click to upload photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending || isConfirming}
              className="flex-1"
            >
              Create Batch
            </Button>
          </div>
        </form>
      )}

      {step === 'minting' && (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-lime-lush border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-ocean-navy mb-2">
            Creating Batch Receipt
          </h3>
          <p className="text-dusk-gray">
            Minting your digital receipt on the blockchain...
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="mb-6"
          >
            <QRGenerator 
              data={`batch:${tokenId}`}
              size={200}
              className="mx-auto"
            />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-ocean-navy mb-2">
            Batch Created Successfully!
          </h3>
          <p className="text-dusk-gray mb-6">
            Token ID: #{tokenId}
          </p>
          
          <div className="space-y-3">
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
            <Button variant="outline" className="w-full">
              Share QR Code
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}