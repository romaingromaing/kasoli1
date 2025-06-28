'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACTS, RECEIPT_ABI } from '@/lib/contracts';
import { decodeEventLog } from 'viem';
import toast from 'react-hot-toast';
import { QRGenerator } from '@/components/qr-generator';
import { useRouter } from 'next/navigation';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBatchModal({ isOpen, onClose }: CreateBatchModalProps) {
  const [formData, setFormData] = useState({
    weight: '',
    grade: '1',
    origin: '',
    latitude: '',
    longitude: '',
    pricePerKg: '',
    photo: null as File | null,
  });
  const [step, setStep] = useState<'form' | 'minting' | 'success'>('form');
  const [tokenId, setTokenId] = useState<string>('');
  const [batchData, setBatchData] = useState<{ metaCid: string; photoCid: string } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });
  const { address } = useAccount();
  const router = useRouter();

  // Location search functionality with better dropdown management
  useEffect(() => {
    const controller = new AbortController();
    if (formData.origin.length > 2) {
      fetch(`/api/places?input=${encodeURIComponent(formData.origin)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setLocationSuggestions(data.predictions || []))
        .catch(() => setLocationSuggestions([]));
    } else {
      setLocationSuggestions([]);
    }
    return () => controller.abort();
  }, [formData.origin]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.location-search-container')) {
        setLocationSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLocationSuggestion = async (placeId: string, description: string) => {
    // Immediately update UI and clear suggestions
    setFormData(prev => ({ ...prev, origin: description }));
    setLocationSuggestions([]);
    
    try {
      const res = await fetch(`/api/places?placeId=${placeId}`);
      const data = await res.json();
      const loc = data.result?.geometry?.location;
      if (loc) {
        setFormData(prev => ({
          ...prev,
          latitude: loc.lat.toString(),
          longitude: loc.lng.toString(),
        }));
        toast.success('Location selected successfully!');
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      toast.error('Failed to get location details');
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    toast.loading('Getting your location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          origin: 'Current Location',
        }));
        toast.dismiss('location');
        toast.success('Location found successfully!');
        setIsGettingLocation(false);
      },
      (error) => {
        toast.dismiss('location');
        setIsGettingLocation(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formData.weight ||
      !formData.photo ||
      !formData.origin ||
      !formData.latitude ||
      !formData.longitude ||
      !formData.pricePerKg
    ) {
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
        origin: formData.origin,
        location: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude),
        },
        image: `ipfs://${photoCID}`,
      };
      const metaRes = await fetch('/api/ipfs/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      });
      const metaJson = await metaRes.json();
      const metaCID = metaJson.cid as string;

      setBatchData({ metaCid: metaCID, photoCid: photoCID });
      if (!address) {
        toast.error('You must be connected to create a batch');
        return;
      }

      writeContract({
        address: CONTRACTS.RECEIPT as `0x${string}`,
        abi: RECEIPT_ABI,
        functionName: 'mint',
        args: [
          address as `0x${string}`, // farmer address
          BigInt(Math.floor(parseFloat(formData.weight) * 1000)), // weight in grams
          parseInt(formData.grade) as 1 | 2 | 3 | 4 | 5,
          metaCID,
          photoCID,
        ],
      });

    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
      setStep('form');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ weight: '', grade: '1', origin: '', latitude: '', longitude: '', pricePerKg: '', photo: null });
    setLocationSuggestions([]);
    setIsGettingLocation(false);
    setTokenId('');
    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
    }
  };

  useEffect(() => {
    async function storeBatch() {
      if (!receipt || !batchData || !address) return;

      try {
        const log = receipt.logs.find(
          (l) => l.address.toLowerCase() === CONTRACTS.RECEIPT.toLowerCase()
        );
        let id = '0';
        if (log) {
          const decoded = decodeEventLog({ abi: RECEIPT_ABI, data: log.data, topics: log.topics });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id = (decoded.args as any).id.toString();
        }
        setTokenId(id);

        await fetch('/api/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiptTokenId: id,
            metaCid: batchData.metaCid,
            photoCid: batchData.photoCid,
            grade: formData.grade,
            weightKg: parseFloat(formData.weight),
            pricePerKg: parseFloat(formData.pricePerKg),
            origin: formData.origin,
            locationLat: parseFloat(formData.latitude),
            locationLng: parseFloat(formData.longitude),
            farmerAddress: address,
          }),
        });

        toast.success('Batch created successfully!');
        setStep('success');
        // Refresh the page to show the new batch
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error('Error storing batch:', err);
        toast.error('Failed to store batch');
        setStep('form');
      }
    }

    storeBatch();
  }, [receipt]);

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

          <Input
            label="Price per Kg (USD)"
            type="number"
            step="0.01"
            value={formData.pricePerKg}
            onChange={(e) => setFormData(prev => ({ ...prev, pricePerKg: e.target.value }))}
            placeholder="Enter price per kilogram in USD"
            required
          />

          <div className="space-y-2 location-search-container">
            <label className="block text-sm font-medium text-ocean-navy">
              <MapPin size={16} className="inline mr-2" />
              Origin Location
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
              placeholder="Search for warehouse, silo, or farm location"
              className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy placeholder-dusk-gray focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent transition-all duration-200"
              required
            />
            
            {locationSuggestions.length > 0 && (
              <div className="relative">
                <ul className="absolute top-0 left-0 right-0 z-50 border border-dusk-gray/30 rounded-xl bg-warm-white shadow-lg max-h-48 overflow-y-auto">
                  {locationSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.place_id}
                      className="px-4 py-3 cursor-pointer hover:bg-lime-lush/20 text-ocean-navy text-sm border-b border-dusk-gray/10 last:border-b-0 transition-colors duration-150"
                      onClick={() => selectLocationSuggestion(suggestion.place_id, suggestion.description)}
                    >
                      <div className="flex items-center">
                        <MapPin size={14} className="text-dusk-gray mr-2 flex-shrink-0" />
                        <span className="truncate">{suggestion.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={useCurrentLocation}
            disabled={isGettingLocation}
            className="w-full flex items-center justify-center gap-2"
          >
            {isGettingLocation ? (
              <>
                <div className="w-4 h-4 border-2 border-teal-deep border-t-transparent rounded-full animate-spin" />
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <MapPin size={16} />
                <span>Use Current Location</span>
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ocean-navy">
                Latitude
                {formData.latitude && (
                  <span className="text-xs text-teal-deep ml-1">✓</span>
                )}
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="0.000000"
                className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy placeholder-dusk-gray focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ocean-navy">
                Longitude
                {formData.longitude && (
                  <span className="text-xs text-teal-deep ml-1">✓</span>
                )}
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="0.000000"
                className="w-full px-4 py-3 rounded-xl border border-dusk-gray/30 bg-warm-white text-ocean-navy placeholder-dusk-gray focus:outline-none focus:ring-2 focus:ring-lime-lush focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>
          
          {formData.latitude && formData.longitude && (
            <div className="bg-teal-deep/10 rounded-xl p-3">
              <p className="text-xs text-teal-deep">
                ✓ Location coordinates set: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
              </p>
            </div>
          )}

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