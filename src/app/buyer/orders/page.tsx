'use client';

import { motion } from 'framer-motion';
import { MapPin, Package, Clock, Truck, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useAccount, useWriteContract } from 'wagmi';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/constants';
import { ESCROW_ABI } from '@/lib/contracts';
import toast from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { FundEscrowModal } from '@/components/buyer/fund-escrow-modal';

export default function BuyerOrdersPage() {
  useRequireRole('BUYER');
  const { address } = useAccount();
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [historyDeals, setHistoryDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const getStatusInfo = (status: string) => {
    switch (status) {
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
          label: status,
          color: 'text-dusk-gray',
          bgColor: 'bg-gray-100',
          description: 'Unknown status'
        };
    }
  };

  // Refactored load function
  const load = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/deal?buyer=${address}`);
      if (!res.ok) {
        console.error('Failed to fetch deals:', res.statusText);
        return;
      }
      const data = await res.json();
      setOrders(data);
      // Separate pending and completed deals
      const pending = data.filter(
        (d: any) => d.status !== 'PAID_OUT' && d.status !== 'DISPUTED'
      );
      setPendingDeals(pending);
      const history = data.filter(
        (d: any) => d.status === 'PAID_OUT' || d.status === 'DISPUTED'
      );
      setHistoryDeals(history);
    } catch (err) {
      console.error('Failed loading orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [address]);

  const handleFundEscrow = (deal: any) => {
    setSelectedDeal(deal);
    setShowFundModal(true);
  };

  const handleFundModalClose = () => {
    setShowFundModal(false);
    setSelectedDeal(null);
    // Refresh the data after funding
    load();
  };

  async function handleCompleteDeal(order: any) {
    if (!order || !address) return;
    try {
      const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS! as `0x${string}`;
      const batchIdBytes32 = keccak256(toBytes(order.batch?.id));
      
      // Defensive check
      if (!address) {
        toast.error('Missing buyer address');
        return;
      }

      toast.loading('Signing delivery...', { id: 'buyer-sign' });

      // Call buyerSign on the contract
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'buyerSign',
        args: [batchIdBytes32],
      });

      console.log('Buyer sign transaction hash:', txHash);
      toast.dismiss('buyer-sign');
      toast.loading('Waiting for transaction confirmation...', { id: 'sign-confirm' });

      // Wait a bit for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('sign-confirm');

      // Update backend with signature
      const signResponse = await fetch(`/api/deal/${order.id}/buyer-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerAddress: address,
          txHash: txHash,
        }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        throw new Error(errorData.error || 'Failed to update signature in backend');
      }

      toast.success('Deal finalized and payout triggered!');
      await load();
      // Add a small delay then refresh the page for complete UI update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error in handleCompleteDeal:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Finalization failed or cancelled';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.message?.includes('execution reverted')) {
        errorMessage = 'Contract execution failed - check deal status';
      } else if (err.message?.includes('Failed to update signature')) {
        errorMessage = 'Failed to update signature in backend';
      }
      
      toast.error(errorMessage);
    }
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
            <h1 className="text-3xl font-bold text-ocean-navy">My Orders</h1>
            <div className="text-sm text-dusk-gray">
              {orders.length} total order{orders.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <div className="text-2xl font-bold text-ocean-navy">{pendingDeals.length}</div>
              <div className="text-sm text-dusk-gray">Active</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-ocean-navy">{historyDeals.filter(d => d.status === 'PAID_OUT').length}</div>
              <div className="text-sm text-dusk-gray">Completed</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-ocean-navy">{historyDeals.filter(d => d.status === 'DISPUTED').length}</div>
              <div className="text-sm text-dusk-gray">Disputed</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-ocean-navy">
                {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.farmerAmount || '0'), 0))}
              </div>
              <div className="text-sm text-dusk-gray">Total Value</div>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-lime-lush border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dusk-gray">Loading your orders...</p>
            </div>
          ) : (
            <>
              {/* Pending Deals */}
              <h2 className="text-xl font-semibold text-ocean-navy mb-4 flex items-center gap-2">
                <Clock size={20} className="text-teal-deep" />
                Active Orders ({pendingDeals.length})
              </h2>
              <div className="space-y-4 mb-8">
                {pendingDeals.length === 0 ? (
                  <Card className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-dusk-gray opacity-50" />
                    <p className="text-dusk-gray">No active orders</p>
                    <p className="text-sm text-dusk-gray mt-2">New orders will appear here</p>
                  </Card>
                ) : (
                  pendingDeals.map((order, index) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={order.id}
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
                                    {order.batch?.grade || 'Grain Batch'} #{order.batch?.receiptTokenId}
                                  </div>
                                  <div className="text-sm text-dusk-gray">
                                    From: {order.batch?.farmer?.name || 'Unknown Farmer'}
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor} flex items-center gap-2`}>
                                  <StatusIcon size={14} className={statusInfo.color} />
                                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Weight</div>
                                  <div className="font-medium text-ocean-navy">{order.batch?.weightKg || order.weightKg} kg</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Price</div>
                                  <div className="font-medium text-ocean-navy">{formatCurrency(parseFloat(order.farmerAmount || '0'))}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Platform Fee</div>
                                  <div className="font-medium text-ocean-navy">{formatCurrency(parseFloat(order.platformFee || '0'))}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Total</div>
                                  <div className="font-medium text-ocean-navy">
                                    {formatCurrency(
                                      parseFloat(order.farmerAmount || '0') + 
                                      parseFloat(order.platformFee || '0') + 
                                      parseFloat(order.freightAmount || '0')
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-dusk-gray">
                                    <MapPin size={14} />
                                    <span>{order.origin || order.batch?.origin || 'Origin'}</span>
                                  </div>
                                  {order.destination && (
                                    <>
                                      <span className="text-dusk-gray">→</span>
                                      <div className="flex items-center gap-1 text-dusk-gray">
                                        <MapPin size={14} />
                                        <span>{order.destination}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="text-xs text-dusk-gray">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="mt-2 p-2 bg-gray-50 rounded-lg flex flex-col gap-2">
                                <p className="text-xs text-dusk-gray">{statusInfo.description}</p>
                                {order.status === 'AWAITING_ESCROW' && (
                                  <button
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                    onClick={() => handleFundEscrow(order)}
                                  >
                                    Pay & Initiate Escrow
                                  </button>
                                )}
                                {/* Complete button for READY_TO_FINAL or when both farmer and transporter have signed (sigMask = 6) */}
                                {(order.status === 'READY_TO_FINAL' || (order.sigMask === 6 && order.escrowTxHash)) && (
                                  <button
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
                                    onClick={() => handleCompleteDeal(order)}
                                  >
                                    Complete Transaction
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Order History */}
              <h2 className="text-xl font-semibold text-ocean-navy mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Order History ({historyDeals.length})
              </h2>
              <div className="space-y-4">
                {historyDeals.length === 0 ? (
                  <Card className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-dusk-gray opacity-50" />
                    <p className="text-dusk-gray">No completed orders</p>
                    <p className="text-sm text-dusk-gray mt-2">Completed orders will appear here</p>
                  </Card>
                ) : (
                  historyDeals.map((order, index) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Card className="p-6 opacity-75">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="font-semibold text-ocean-navy text-lg">
                                    {order.batch?.grade || 'Grain Batch'} #{order.batch?.receiptTokenId}
                                  </div>
                                  <div className="text-sm text-dusk-gray">
                                    From: {order.batch?.farmer?.name || 'Unknown Farmer'}
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor} flex items-center gap-2`}>
                                  <StatusIcon size={14} className={statusInfo.color} />
                                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Weight</div>
                                  <div className="font-medium text-ocean-navy">{order.batch?.weightKg || order.weightKg} kg</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Price</div>
                                  <div className="font-medium text-ocean-navy">{formatCurrency(parseFloat(order.farmerAmount || '0'))}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Platform Fee</div>
                                  <div className="font-medium text-ocean-navy">{formatCurrency(parseFloat(order.platformFee || '0'))}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Total</div>
                                  <div className="font-medium text-ocean-navy">
                                    {formatCurrency(
                                      parseFloat(order.farmerAmount || '0') + 
                                      parseFloat(order.platformFee || '0') + 
                                      parseFloat(order.freightAmount || '0')
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-dusk-gray">
                                    <MapPin size={14} />
                                    <span>{order.origin || order.batch?.origin || 'Origin'}</span>
                                  </div>
                                  {order.destination && (
                                    <>
                                      <span className="text-dusk-gray">→</span>
                                      <div className="flex items-center gap-1 text-dusk-gray">
                                        <MapPin size={14} />
                                        <span>{order.destination}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="text-xs text-dusk-gray">
                                  Completed: {new Date(order.updatedAt).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Complete button for READY_TO_FINAL or when both farmer and transporter have signed (sigMask = 6) */}
                              {(order.status === 'READY_TO_FINAL' || (order.sigMask === 6 && order.escrowTxHash)) && (
                                <button
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
                                  onClick={() => handleCompleteDeal(order)}
                                >
                                  Complete Transaction
                                </button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
      <BottomNav />
      {showFundModal && selectedDeal && (
        <FundEscrowModal
          isOpen={showFundModal}
          deal={selectedDeal}
          onClose={handleFundModalClose}
        />
      )}
    </div>
  );
}
