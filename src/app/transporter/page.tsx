'use client';

import { motion } from 'framer-motion';
import { QrCode, Truck, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { QRScanModal } from '@/components/transporter/qr-scan-modal';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { formatCurrency } from '@/lib/constants';
import toast from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS, ESCROW_ABI } from '@/lib/contracts';

export default function TransporterDashboard() {
  useRequireRole('TRANSPORTER');
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [showScanModal, setShowScanModal] = useState(false);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    label: string;
    value: string;
    icon: any;
    color: string;
  }[]>([]);
  const [signingDealId, setSigningDealId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        // Load assigned deliveries
        const assignedRes = await fetch(`/api/deal?transporter=${address}`);
        if (assignedRes.ok) {
          const assignedDeals = await assignedRes.json();
          setActiveDeliveries(assignedDeals);
        }

        // Load pending driver deals (available for pickup)
        const pendingRes = await fetch(`/api/deal?pending=true`);
        if (pendingRes.ok) {
          const pendingDealsData = await pendingRes.json();
          setPendingDeals(pendingDealsData);
        }

        // Update stats
        const totalActive = activeDeliveries.length;
        const totalPending = pendingDeals.length;
        setStats([
          { label: 'Active Deliveries', value: String(totalActive), icon: Truck, color: 'text-teal-deep' },
          { label: 'Available Jobs', value: String(totalPending), icon: Clock, color: 'text-lime-600' },
          { label: 'This Month', value: '$0', icon: MapPin, color: 'text-aqua-mint' },
        ]);
      } catch (err) {
        console.error('Failed loading deliveries', err);
      }
    }
    load();
  }, [address, activeDeliveries.length, pendingDeals.length]);

  const acceptDeal = async (dealId: string) => {
    if (!address) return;
    try {
      // First, get the deal details to find the batch ID
      const dealRes = await fetch(`/api/deal/${dealId}`);
      if (!dealRes.ok) {
        toast.error('Failed to get deal details');
        return;
      }
      const deal = await dealRes.json();
      
      // Update transporter address in smart contract
      const contractAddress = CONTRACTS.ESCROW as `0x${string}`;
      const batchIdBytes32 = keccak256(toBytes(deal.batch?.id));
      
      console.log('Updating transporter in smart contract:', {
        contractAddress,
        batchIdBytes32,
        batchId: deal.batch?.id,
        transporterAddress: address,
      });

      // Validate contract address
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address');
      }

      // Check if the deal has been funded in the contract
      if (!deal.escrowTxHash) {
        toast.error('Deal has not been funded in escrow yet');
        return;
      }

      toast.loading('Updating transporter in smart contract...', { id: 'update-transporter' });

      const updateTxHash = await writeContractAsync({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'updateTransporter',
        args: [batchIdBytes32, address as `0x${string}`],
      });

      console.log('Update transporter transaction hash:', updateTxHash);
      toast.dismiss('update-transporter');
      toast.loading('Waiting for transaction confirmation...', { id: 'update-confirm' });

      // Wait a bit for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('update-confirm');

      // Then accept the deal in the backend
      const res = await fetch(`/api/deal/${dealId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transporterAddress: address }),
      });
      
      if (res.ok) {
        toast.success('Deal accepted successfully!');
        // Refresh data
        window.location.reload();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to accept deal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Failed to accept deal', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to accept deal';
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
    }
  };

  // Add handler for transporter sign
  const handleTransporterSign = async (delivery: any) => {
    if (!delivery || !address) return;
    
    setSigningDealId(delivery.id);
    try {
      // First, call the smart contract
      const contractAddress = CONTRACTS.ESCROW as `0x${string}`;
      const batchIdBytes32 = keccak256(toBytes(delivery.batch?.id));
      
      console.log('Calling smart contract with:', {
        contractAddress,
        batchIdBytes32,
        batchId: delivery.batch?.id,
        delivery,
      });

      // Validate contract address
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address');
      }

      // Check if the deal has been funded in the contract
      if (!delivery.escrowTxHash) {
        toast.error('Deal has not been funded in escrow yet');
        return;
      }

      // First, try to update transporter address if it's not set
      try {
        toast.loading('Checking transporter assignment...', { id: 'check-transporter' });
        
        const updateTxHash = await writeContractAsync({
          address: contractAddress,
          abi: ESCROW_ABI,
          functionName: 'updateTransporter',
          args: [batchIdBytes32, address as `0x${string}`],
        });

        console.log('Update transporter transaction hash:', updateTxHash);
        toast.dismiss('check-transporter');
        toast.loading('Waiting for transporter update confirmation...', { id: 'update-confirm' });

        // Wait a bit for transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 5000));
        toast.dismiss('update-confirm');
      } catch (updateError: any) {
        // If update fails, it might mean transporter is already set or other conditions not met
        // This is expected if transporter is already set correctly
        console.log('Transporter update not needed or failed:', updateError.message);
        toast.dismiss('check-transporter');
      }

      // Now try to sign
      toast.loading('Signing pickup...', { id: 'sign-pickup' });

      const txHash = await writeContractAsync({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'transporterSign',
        args: [batchIdBytes32],
      });

      console.log('Smart contract transaction hash:', txHash);
      toast.dismiss('sign-pickup');
      toast.loading('Waiting for transaction confirmation...', { id: 'sign-confirm' });

      // Wait a bit for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('sign-confirm');

      // Then update the backend
      const res = await fetch(`/api/deal/${delivery.id}/transporter-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporterAddress: address,
          txHash: txHash,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(`Failed to sign pickup: ${data.error || 'Unknown error'}`);
        return;
      }
      
      toast.success('Pickup signed successfully!');
      
      // Refresh deliveries
      if (address) {
        const assignedRes = await fetch(`/api/deal?transporter=${address}`);
        if (assignedRes.ok) {
          const assignedDeals = await assignedRes.json();
          setActiveDeliveries(assignedDeals);
        }
      }
    } catch (err: any) {
      console.error('Error in handleTransporterSign:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign pickup';
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
      } else if (err.message?.includes('!transporter')) {
        errorMessage = 'You are not the assigned transporter for this deal';
      } else if (err.message?.includes('farmer first')) {
        errorMessage = 'Farmer must sign first before transporter can sign';
      }
      
      toast.error(errorMessage);
    } finally {
      setSigningDealId(null);
    }
  };

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

          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-ocean-navy mb-6">Available Jobs</h2>
            <div className="space-y-4">
              {pendingDeals.length === 0 ? (
                <div className="text-center py-8 text-dusk-gray">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No available jobs at the moment</p>
                </div>
              ) : (
                pendingDeals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="border border-dusk-gray/20 rounded-xl p-4 hover:bg-lime-lush/5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-ocean-navy">
                          Batch #{deal.batch?.receiptTokenId}
                        </div>
                        <div className="text-sm text-dusk-gray">
                          {deal.batch?.farmer?.name} → {deal.buyer?.organisation || deal.buyer?.contactName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ocean-navy">
                          {deal.batch?.weightKg ? `${deal.batch.weightKg} kg` : '-'}
                        </div>
                        <div className="text-sm text-dusk-gray">
                          {deal.batch?.pricePerKg ? `$${parseFloat(deal.batch.pricePerKg).toFixed(2)}/kg` : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-teal-deep" />
                        <span className="text-dusk-gray">Pickup:</span>
                        <span className="text-ocean-navy">{deal.batch?.origin || 'N/A'}</span>
                        {deal.batch?.locationLat && (
                          <span className="text-xs text-dusk-gray"> ({deal.batch.locationLat.toFixed(4)}, {deal.batch.locationLng.toFixed(4)})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-aqua-mint" />
                        <span className="text-dusk-gray">Delivery:</span>
                        <span className="text-ocean-navy">{deal.batch?.destination || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-lime-600" />
                        <span className="text-dusk-gray">Timeout:</span>
                        <span className="text-ocean-navy">
                          {deal.timeoutAt ? new Date(deal.timeoutAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        PENDING_DRIVER
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => acceptDeal(deal.id)}
                        className="bg-lime-lush hover:bg-lime-lush/90"
                      >
                        Accept Job
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

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
                        Batch #{delivery.batch?.receiptTokenId}
                      </div>
                      <div className="text-sm text-dusk-gray">
                        {delivery.batch?.farmer?.name} → {delivery.buyer?.organisation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ocean-navy">
                        {delivery.freightAmount ? formatCurrency(parseFloat(delivery.freightAmount)) : 'TBD'}
                      </div>
                      <div className="text-sm text-dusk-gray">Freight</div>
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
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      delivery.status === 'PENDING_SIGS'
                        ? 'bg-lime-lush/20 text-lime-700'
                        : delivery.status === 'AWAITING_ESCROW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-aqua-mint/20 text-aqua-mint'
                    }`}>
                      {delivery.status}
                    </span>
                    {(delivery.status === 'PENDING_SIGS' && (delivery.sigMask & 0x2) && !(delivery.sigMask & 0x4)) ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={signingDealId === delivery.id}
                        onClick={() => handleTransporterSign(delivery)}
                      >
                        {signingDealId === delivery.id ? 'Signing...' : 'Sign Pickup'}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {delivery.status === 'AWAITING_ESCROW'
                          ? 'Awaiting Buyer'
                          : 'Track'}
                      </Button>
                    )}
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