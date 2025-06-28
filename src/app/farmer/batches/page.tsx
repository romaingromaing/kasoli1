'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, Package, CheckCircle, XCircle, User, Truck, ShoppingCart, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS, ESCROW_ABI } from '@/lib/contracts';
import { formatCurrency } from '@/lib/constants';

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

  // Calculate statistics
  const stats = [
    {
      label: 'Total Batches',
      value: batches.length,
      icon: Package,
      color: 'text-teal-deep'
    },
    {
      label: 'Active Deals',
      value: batches.filter(b => b.deal && b.deal.status !== 'PAID_OUT' && b.deal.status !== 'DISPUTED').length,
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      label: 'Ready to Sign',
      value: batches.filter(b => b.deal && b.deal.escrowTxHash && !(b.deal.sigMask & 0x2)).length,
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(
        batches
          .filter(b => b.deal && b.deal.farmerAmount)
          .reduce((sum, b) => sum + parseFloat(b.deal.farmerAmount || '0'), 0)
      ),
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

  const getDealStatusInfo = (deal: any) => {
    if (!deal) return null;
    
    switch (deal.status) {
      case 'PENDING_DRIVER':
        return {
          icon: Clock,
          label: 'Awaiting Transporter',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          description: 'Looking for a transporter to accept this job'
        };
      case 'AWAITING_ESCROW':
        return {
          icon: DollarSign,
          label: 'Awaiting Payment',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          description: 'Transporter accepted, waiting for escrow payment'
        };
      case 'PENDING_SIGS':
        return {
          icon: Truck,
          label: 'In Transit',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Goods are being transported'
        };
      case 'READY_TO_FINAL':
        return {
          icon: CheckCircle,
          label: 'Ready to Complete',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'All signatures received, awaiting final payment'
        };
      case 'PAID_OUT':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-700',
          bgColor: 'bg-green-200',
          description: 'Deal completed successfully'
        };
      case 'DISPUTED':
        return {
          icon: AlertCircle,
          label: 'Disputed',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Deal is under dispute'
        };
      default:
        return {
          icon: Package,
          label: deal.status || 'Unknown',
          color: 'text-dusk-gray',
          bgColor: 'bg-gray-100',
          description: 'Unknown status'
        };
    }
  };

  async function handleFarmerSign(batch: any) {
    if (!batch.deal) {
      toast.error('No deal associated with this batch');
      return;
    }
    
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }
    
    console.log('Farmer sign attempt:', {
      batchId: batch.id,
      dealId: batch.deal.id,
      farmerAddress: address,
      batchFarmer: batch.farmer?.walletAddress,
      dealFarmer: batch.deal.batch?.farmer?.walletAddress,
      escrowTxHash: batch.deal.escrowTxHash,
      sigMask: batch.deal.sigMask,
    });
    
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
      
      console.log('Farmer sign API response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Farmer sign API error:', errorData);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to sign batch';
        if (errorData.error?.includes('Unauthorized farmer')) {
          errorMessage = 'You are not the authorized farmer for this deal';
        } else if (errorData.error?.includes('already signed')) {
          errorMessage = 'You have already signed this deal';
        } else if (errorData.error?.includes('Deal not found')) {
          errorMessage = 'Deal not found in database';
        } else if (errorData.error?.includes('Deal farmer not found')) {
          errorMessage = 'Farmer information missing from deal';
        } else {
          errorMessage = errorData.error || 'Unknown error';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      const responseData = await res.json();
      console.log('Farmer sign API success:', responseData);
      
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
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-ocean-navy">My Batches</h1>
            <div className="text-sm text-dusk-gray">
              {batches.length} total batch{batches.length !== 1 ? 'es' : ''}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

          <div className="space-y-4">
            {batches.map((batch, index) => {
              const dealStatusInfo = getDealStatusInfo(batch.deal);
              const StatusIcon = dealStatusInfo?.icon || Package;
              
              return (
                <motion.div
                  key={batch.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-deep/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-teal-deep" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold text-ocean-navy text-lg">
                              {batch.grade} #{batch.receiptTokenId}
                            </div>
                            <div className="text-sm text-dusk-gray">
                              {batch.weightKg} kg • {batch.origin}
                            </div>
                          </div>
                          {batch.deal && dealStatusInfo && (
                            <div className={`px-3 py-1 rounded-full ${dealStatusInfo.bgColor} flex items-center gap-2`}>
                              <StatusIcon size={14} className={dealStatusInfo.color} />
                              <span className={`text-sm font-medium ${dealStatusInfo.color}`}>
                                {dealStatusInfo.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {batch.deal && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-dusk-gray mb-1">Payment</div>
                              <div className="font-medium text-ocean-navy">
                                {formatCurrency(parseFloat(batch.deal.farmerAmount || '0'))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dusk-gray mb-1">Buyer</div>
                              <div className="font-medium text-ocean-navy">
                                {batch.deal.buyer?.organisation || batch.deal.buyer?.contactName || 'Unknown'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dusk-gray mb-1">Transporter</div>
                              <div className="font-medium text-ocean-navy">
                                {batch.deal.transporter?.name || 'Not assigned'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dusk-gray mb-1">Created</div>
                              <div className="font-medium text-ocean-navy">
                                {new Date(batch.deal.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-dusk-gray">
                              <MapPin size={14} />
                              <span>{batch.origin}</span>
                            </div>
                            {batch.deal?.destination && (
                              <>
                                <span className="text-dusk-gray">→</span>
                                <div className="flex items-center gap-1 text-dusk-gray">
                                  <MapPin size={14} />
                                  <span>{batch.deal.destination}</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-dusk-gray">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Deal status description */}
                        {batch.deal && dealStatusInfo && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-dusk-gray">{dealStatusInfo.description}</p>
                          </div>
                        )}

                        {/* Signature status visualization */}
                        {batch.deal && renderSigStatus(batch)}

                        {/* Show sign button if batch has a deal, escrow is funded, and farmer has not signed */}
                        {batch.deal && batch.deal.escrowTxHash && !(batch.deal.sigMask & 0x2) && (
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              className="w-full"
                              disabled={signingBatchId === batch.id}
                              onClick={() => handleFarmerSign(batch)}
                            >
                              {signingBatchId === batch.id ? 'Signing...' : 'Sign Batch'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
