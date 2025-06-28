'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { MapPin, Package, CheckCircle, XCircle, User, Truck, ShoppingCart, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Card } from '@/components/ui/card';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { formatCurrency } from '@/lib/constants';

export default function FarmerDealsPage() {
  useRequireRole('FARMER');
  const { address } = useAccount();
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!address) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/deal?farmer=${address}`);
        if (!res.ok) return;
        const data = await res.json();
        setDeals(data);
      } catch (err) {
        console.error('Failed loading deals', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [address]);

  // Calculate statistics
  const stats = [
    {
      label: 'Total Deals',
      value: deals.length,
      icon: Package,
      color: 'text-teal-deep'
    },
    {
      label: 'Active Deals',
      value: deals.filter(d => d.status !== 'PAID_OUT' && d.status !== 'DISPUTED').length,
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      label: 'Completed',
      value: deals.filter(d => d.status === 'PAID_OUT').length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(
        deals
          .filter(d => d.farmerAmount)
          .reduce((sum, d) => sum + parseFloat(d.farmerAmount || '0'), 0)
      ),
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

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

  function renderSigStatus(deal: any) {
    const sigMask = deal.sigMask || 0;
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

  const activeDeals = deals.filter(d => d.status !== 'PAID_OUT' && d.status !== 'DISPUTED');
  const completedDeals = deals.filter(d => d.status === 'PAID_OUT' || d.status === 'DISPUTED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-ocean-navy">My Deals</h1>
            <div className="text-sm text-dusk-gray">
              {deals.length} total deal{deals.length !== 1 ? 's' : ''}
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

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-lime-lush border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dusk-gray">Loading your deals...</p>
            </div>
          ) : (
            <>
              {/* Active Deals */}
              <h2 className="text-xl font-semibold text-ocean-navy mb-4 flex items-center gap-2">
                <Clock size={20} className="text-teal-deep" />
                Active Deals ({activeDeals.length})
              </h2>
              <div className="space-y-4 mb-8">
                {activeDeals.length === 0 ? (
                  <Card className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-4 text-dusk-gray opacity-50" />
                    <p className="text-dusk-gray">No active deals</p>
                    <p className="text-sm text-dusk-gray mt-2">Active deals will appear here</p>
                  </Card>
                ) : (
                  activeDeals.map((deal, index) => {
                    const statusInfo = getStatusInfo(deal.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={deal.id}
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
                                    {deal.batch?.grade || 'Grain Batch'} #{deal.batch?.receiptTokenId}
                                  </div>
                                  <div className="text-sm text-dusk-gray">
                                    Buyer: {deal.buyer?.organisation || deal.buyer?.contactName || 'Unknown'}
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
                                  <div className="text-xs text-dusk-gray mb-1">Payment</div>
                                  <div className="font-medium text-ocean-navy">
                                    {formatCurrency(parseFloat(deal.farmerAmount || '0'))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Weight</div>
                                  <div className="font-medium text-ocean-navy">
                                    {deal.batch?.weightKg || deal.weightKg} kg
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Transporter</div>
                                  <div className="font-medium text-ocean-navy">
                                    {deal.transporter?.name || 'Not assigned'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Created</div>
                                  <div className="font-medium text-ocean-navy">
                                    {new Date(deal.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-dusk-gray">
                                    <MapPin size={14} />
                                    <span>{deal.origin || deal.batch?.origin || 'Origin'}</span>
                                  </div>
                                  {deal.destination && (
                                    <>
                                      <span className="text-dusk-gray">→</span>
                                      <div className="flex items-center gap-1 text-dusk-gray">
                                        <MapPin size={14} />
                                        <span>{deal.destination}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="text-xs text-dusk-gray">
                                  {new Date(deal.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-dusk-gray">{statusInfo.description}</p>
                              </div>

                              {renderSigStatus(deal)}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Completed Deals */}
              <h2 className="text-xl font-semibold text-ocean-navy mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Completed Deals ({completedDeals.length})
              </h2>
              <div className="space-y-4">
                {completedDeals.length === 0 ? (
                  <Card className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-dusk-gray opacity-50" />
                    <p className="text-dusk-gray">No completed deals</p>
                    <p className="text-sm text-dusk-gray mt-2">Completed deals will appear here</p>
                  </Card>
                ) : (
                  completedDeals.map((deal, index) => {
                    const statusInfo = getStatusInfo(deal.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <motion.div
                        key={deal.id}
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
                                    {deal.batch?.grade || 'Grain Batch'} #{deal.batch?.receiptTokenId}
                                  </div>
                                  <div className="text-sm text-dusk-gray">
                                    Buyer: {deal.buyer?.organisation || deal.buyer?.contactName || 'Unknown'}
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
                                  <div className="text-xs text-dusk-gray mb-1">Payment</div>
                                  <div className="font-medium text-ocean-navy">
                                    {formatCurrency(parseFloat(deal.farmerAmount || '0'))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Weight</div>
                                  <div className="font-medium text-ocean-navy">
                                    {deal.batch?.weightKg || deal.weightKg} kg
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Transporter</div>
                                  <div className="font-medium text-ocean-navy">
                                    {deal.transporter?.name || 'Not assigned'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-dusk-gray mb-1">Completed</div>
                                  <div className="font-medium text-ocean-navy">
                                    {new Date(deal.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {renderSigStatus(deal)}
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
    </div>
  );
}
