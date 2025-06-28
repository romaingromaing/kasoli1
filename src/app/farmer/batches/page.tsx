'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, Package, CheckCircle, XCircle, User, Truck, ShoppingCart } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS, ESCROW_ABI } from '@/lib/contracts';

export default function FarmerBatchesPage() {
  useRequireRole('FARMER');
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [batches, setBatches] = useState<any[]>([]);
  const [signingBatchId, setSigningBatchId] = useState<string | null>(null);

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

  async function handleFarmerSign(batch: any) {
    if (!batch.deal) {
      toast.error('No deal associated with this batch');
      return;
    }
    
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    setSigningBatchId(batch.id);
    try {
      // First, call the smart contract
      const contractAddress = CONTRACTS.ESCROW as `0x${string}`;
      const batchIdBytes32 = keccak256(toBytes(batch.id));
      
      console.log('Calling farmer sign smart contract with:', {
        contractAddress,
        batchIdBytes32,
        batchId: batch.id,
        dealId: batch.deal.id,
      });

      // Validate contract address
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address');
      }

      // Check if the deal has been funded in the contract
      if (!batch.deal.escrowTxHash) {
        toast.error('Deal has not been funded in escrow yet');
        return;
      }

      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'farmerSign',
        args: [batchIdBytes32],
      });

      console.log('Farmer sign smart contract transaction hash:', txHash);
      toast.loading('Waiting for transaction confirmation...');

      // Then update the backend
      const res = await fetch(`/api/deal/${batch.deal.id}/farmer-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerAddress: address,
          txHash: txHash,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Failed to sign batch: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      toast.success('Batch signed successfully!');
      
      // Refresh batches
      if (address) {
        const res = await fetch(`/api/batch?farmer=${address}`);
        if (res.ok) {
          const data = await res.json();
          setBatches(data);
        }
      }
    } catch (err: any) {
      console.error('Error in handleFarmerSign:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign batch';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('Invalid contract address')) {
        errorMessage = 'Contract configuration error';
      } else if (err.message?.includes('execution reverted')) {
        errorMessage = 'Contract execution failed - check deal status';
      } else if (err.message?.includes('Deal has not been funded')) {
        errorMessage = 'Deal has not been funded in escrow yet';
      }
      
      toast.error(errorMessage);
    } finally {
      setSigningBatchId(null);
    }
  }

  function renderSigStatus(batch: any) {
    // Assume batch.deal.sigMask is available
    const sigMask = batch.deal?.sigMask || 0;
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
                    {/* Signature status visualization */}
                    {batch.deal && renderSigStatus(batch)}
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
                    {/* Show sign button if batch has a deal, is LOCKED, and farmer has not signed */}
                    {batch.deal && batch.status === 'LOCKED' && !(batch.deal.sigMask & 0x2) && (
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        disabled={signingBatchId === batch.id}
                        onClick={() => handleFarmerSign(batch)}
                      >
                        {signingBatchId === batch.id ? 'Signing...' : 'Sign Batch'}
                      </Button>
                    )}
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
