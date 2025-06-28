'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Calculator, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReadContract, useAccount, useWriteContract } from 'wagmi';
import { CONTRACTS, ORACLE_ABI, ESCROW_ABI, ERC20_ABI } from '@/lib/contracts';
import { PLATFORM_CONFIG, calculatePlatformFee, convertUGXToUSD, formatCurrency } from '@/lib/constants';
import { keccak256, toBytes } from 'viem';
import toast from 'react-hot-toast';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: any;
}

export function CommitModal({ isOpen, onClose, batch }: CommitModalProps) {
  const [distance, setDistance] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [freightCost, setFreightCost] = useState<bigint>(0n);
  const [step, setStep] = useState<'calculate' | 'confirm' | 'processing'>('calculate');
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceMethod, setDistanceMethod] = useState<string>('');
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: freightQuote } = useReadContract({
    address: CONTRACTS.ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'quote',
    args: [
      BigInt(Math.floor(batch?.weightKg || 0)), // kg as integer
      BigInt(Math.floor(distance && !isNaN(parseFloat(distance)) ? parseFloat(distance) : 0)), // km as integer
    ],
    query: {
      enabled: !!batch && !!distance && !isNaN(parseFloat(distance)),
    },
  });


  useEffect(() => {
    const controller = new AbortController();
    if (locationInput.length > 2) {
      fetch(`/api/places?input=${encodeURIComponent(locationInput)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data.predictions || []))
        .catch(() => {});
    } else {
      setSuggestions([]);
    }
    return () => controller.abort();
  }, [locationInput]);

  useEffect(() => {
    if (!coords || !batch) return;
    
    setIsCalculatingDistance(true);
    setDistance('');
    
    fetch(`/api/distance?batchId=${batch.id}&lat=${coords.lat}&lng=${coords.lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.distance !== undefined) {
          setDistance(data.distance.toFixed(2));
          setDistanceMethod(data.method || 'calculated');
          
          // Show user-friendly message based on calculation method
          if (data.method === 'google_maps') {
            toast.success(`Distance calculated: ${data.distanceText} (via roads)`);
          } else if (data.method === 'haversine_fallback') {
            toast.success(`Distance calculated: ${data.distanceText} (straight-line)`);
          }
        } else {
          toast.error('Failed to calculate distance');
        }
      })
      .catch((error) => {
        console.error('Distance calculation failed:', error);
        toast.error('Failed to calculate distance');
      })
      .finally(() => {
        setIsCalculatingDistance(false);
      });
  }, [coords, batch]);

  useEffect(() => {
    if (freightQuote) {
      setFreightCost(freightQuote);
    }
  }, [freightQuote]);

  const handleCalculate = () => {
    if (!distance) {
      toast.error('Please enter distance');
      return;
    }
    setStep('confirm');
  };

  const selectSuggestion = async (placeId: string, description: string) => {
    setLocationInput(description);
    setSuggestions([]);
    const res = await fetch(`/api/places?placeId=${placeId}`);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (loc) {
      setCoords({ lat: loc.lat, lng: loc.lng });
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your location...', { id: 'location' });
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationInput('Current Location');
        setCoords({ lat: latitude, lng: longitude });
        toast.dismiss('location');
        toast.success('Location found! Calculating distance...');
      },
      (error) => {
        toast.dismiss('location');
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleCommit = async () => {
    if (!batch || !address) return;

    setStep('processing');

    try {
      const totalPrice = calculateTotalPrice(batch);
      const platformFee = calculatePlatformFee(totalPrice);
      const farmerAmount = totalPrice; // Store as regular USD amount, not Wei
      const freightAmountUSD = freightCost ? convertUGXToUSD(Number(freightCost)) : 0;
      const totalAmount = farmerAmount + freightAmountUSD + platformFee;

      // Convert USD amounts to USDC (6 decimals)
      const farmerAmountUSDC = BigInt(Math.floor(farmerAmount * 1000000));
      const freightAmountUSDC = BigInt(Math.floor(freightAmountUSD * 1000000));
      const platformFeeUSDC = BigInt(Math.floor(platformFee * 1000000));
      const totalAmountUSDC = BigInt(Math.floor(totalAmount * 1000000));

      // Generate batch ID for the escrow
      const batchIdBytes32 = keccak256(toBytes(batch.id));

      console.log('Initiating escrow with:', {
        batchId: batch.id,
        batchIdBytes32,
        farmerAmountUSDC: farmerAmountUSDC.toString(),
        freightAmountUSDC: freightAmountUSDC.toString(),
        platformFeeUSDC: platformFeeUSDC.toString(),
        totalAmountUSDC: totalAmountUSDC.toString(),
        farmerAddress: batch.farmer?.walletAddress,
        platformAddress: CONTRACTS.PLATFORM,
      });

      // Step 1: Approve USDC spending for escrow contract
      toast.loading('Approving USDC spending...', { id: 'approval' });
      
      const approvalTxHash = await writeContractAsync({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ESCROW as `0x${string}`, totalAmountUSDC],
      });

      console.log('USDC approval transaction:', approvalTxHash);
      toast.dismiss('approval');
      toast.loading('Waiting for approval confirmation...', { id: 'approval-confirm' });

      // Wait a bit for approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('approval-confirm');

      // Step 2: Lock funds in escrow contract
      toast.loading('Locking funds in escrow...', { id: 'lock' });

      const lockTxHash = await writeContractAsync({
        address: CONTRACTS.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'lock',
        args: [
          batchIdBytes32,
          batch.farmer?.walletAddress as `0x${string}`,
          '0x0000000000000000000000000000000000000000', // transporter (will be set later)
          CONTRACTS.PLATFORM as `0x${string}`,
          farmerAmountUSDC,
          freightAmountUSDC,
          platformFeeUSDC,
          totalAmountUSDC,
        ],
      });

      console.log('Escrow lock transaction:', lockTxHash);
      toast.dismiss('lock');
      toast.loading('Waiting for escrow confirmation...', { id: 'lock-confirm' });

      // Wait a bit for lock to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('lock-confirm');

      // Step 3: Store deal in backend with transaction hash
      const dealResponse = await fetch('/api/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          buyerAddress: address,
          farmerAmount: farmerAmount.toString(),
          platformFee: platformFee.toString(),
          freightAmount: freightAmountUSD.toString(),
          originLat: batch.locationLat,
          originLng: batch.locationLng,
          origin: batch.origin,
          destination: locationInput,
          destinationLat: coords?.lat ?? null,
          destinationLng: coords?.lng ?? null,
          distanceKm: distance ? parseFloat(distance) : null,
          weightKg: batch.weightKg,
        }),
      });

      if (!dealResponse.ok) {
        throw new Error('Failed to store deal in backend');
      }

      const deal = await dealResponse.json();

      // Step 4: Update deal with escrow transaction hash
      const escrowResponse = await fetch(`/api/deal/${deal.id}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowTxHash: lockTxHash,
        }),
      });

      if (!escrowResponse.ok) {
        throw new Error('Failed to update deal with escrow hash');
      }

      toast.success('Deal committed and funds locked in escrow!');
      onClose();
    } catch (error: any) {
      console.error('Error committing deal:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to commit deal';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient USDC balance';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Contract execution failed - check your balance and allowances';
      } else if (error.message?.includes('Failed to store deal')) {
        errorMessage = 'Failed to store deal in database';
      } else if (error.message?.includes('Failed to update deal')) {
        errorMessage = 'Failed to update deal with transaction hash';
      }
      
      toast.error(errorMessage);
      setStep('confirm');
    }
  };

  const formatUGX = (ugx: bigint) => {
    return `UGX ${(Number(ugx) / 1000).toLocaleString()}`;
  };

  const formatUSD = (ugx: bigint) => {
    const usd = convertUGXToUSD(Number(ugx));
    return formatCurrency(usd);
  };

  const calculateTotalPrice = (batch: any): number => {
    if (!batch || !batch.weightKg || !batch.pricePerKg) return 0;
    return batch.weightKg * parseFloat(batch.pricePerKg);
  };

  const formatPrice = (amount: number): string => {
    return formatCurrency(amount);
  };

  if (!batch) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Commit & Pay">
      {step === 'calculate' && (
        <div className="space-y-6">
          <div className="bg-lime-lush/10 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-2">Batch Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray">Farmer:</span>
                <span className="text-ocean-navy">{batch.farmer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Grade:</span>
                <span className="text-ocean-navy">{batch.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Weight:</span>
                <span className="text-ocean-navy">{batch.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Price per Kg:</span>
                <span className="text-ocean-navy">{batch.pricePerKg ? `$${parseFloat(batch.pricePerKg).toFixed(2)}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Total Price:</span>
                <span className="text-ocean-navy font-semibold">{formatPrice(calculateTotalPrice(batch))}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ocean-navy">
              <MapPin size={16} className="inline mr-2" />
              Delivery Location
            </label>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Search location"
              className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy placeholder-dusk-gray focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent transition-all duration-200"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="relative">
              <ul className="absolute top-0 left-0 right-0 z-50 border border-dusk-gray/30 rounded-xl bg-warm-white shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    className="px-4 py-3 cursor-pointer hover:bg-lime-lush/20 text-ocean-navy text-sm border-b border-dusk-gray/10 last:border-b-0 transition-colors duration-150"
                    onClick={() => selectSuggestion(s.place_id, s.description)}
                  >
                    <div className="flex items-center">
                      <MapPin size={14} className="text-dusk-gray mr-2 flex-shrink-0" />
                      <span className="truncate">{s.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button type="button" variant="outline" onClick={useCurrentLocation} className="w-full">
            Use Current Location
          </Button>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ocean-navy">
              <Truck size={16} className="inline mr-2" />
              Delivery Distance (km)
              {distanceMethod === 'google_maps' && (
                <span className="text-xs text-teal-deep ml-1">(Road distance)</span>
              )}
              {distanceMethod === 'haversine_fallback' && (
                <span className="text-xs text-dusk-gray ml-1">(Straight-line distance)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder={isCalculatingDistance ? "Calculating..." : "Auto-calculated when location is selected"}
                className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy placeholder-dusk-gray focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent transition-all duration-200"
                disabled={isCalculatingDistance}
              />
              {isCalculatingDistance && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-lime-lush border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {distance && !isCalculatingDistance && (
              <p className="text-xs text-teal-deep">
                ✓ Distance auto-calculated from your location to the batch origin
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCalculate} className="flex-1">
              <Calculator size={16} className="mr-2" />
              Calculate Freight
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-teal-deep/10 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-3">Deal Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray">Farmer Payment:</span>
                <span className="text-ocean-navy">{formatPrice(calculateTotalPrice(batch))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Freight Cost:</span>
                <span className="text-ocean-navy">{formatUSD(freightCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Platform Fee ({(PLATFORM_CONFIG.PLATFORM_FEE_RATE * 100).toFixed(0)}%):</span>
                <span className="text-ocean-navy">
                  {formatPrice(calculatePlatformFee(calculateTotalPrice(batch)))}
                </span>
              </div>
              <hr className="border-dusk-gray/20" />
              <div className="flex justify-between font-semibold">
                <span className="text-ocean-navy">Total:</span>
                <span className="text-ocean-navy">
                  {formatPrice(
                    calculateTotalPrice(batch) +
                    convertUGXToUSD(Number(freightCost)) +
                    calculatePlatformFee(calculateTotalPrice(batch))
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Funds will be held in escrow until all parties sign off on delivery.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('calculate')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleCommit} className="flex-1">
              Commit
            </Button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-lime-lush border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-ocean-navy mb-2">
            Processing Payment
          </h3>
          <p className="text-dusk-gray">
            Locking funds in escrow contract...
          </p>
        </div>
      )}
    </Modal>
  );
}