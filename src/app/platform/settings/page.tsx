'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useWriteContract, useReadContract } from 'wagmi';
import { CONTRACTS, ORACLE_ABI } from '@/lib/contracts';
import toast from 'react-hot-toast';

export default function PlatformSettingsPage() {
  useRequireRole('PLATFORM');
  const [price, setPrice] = useState('');
  const { data: currentPrice, refetch } = useReadContract({
    address: CONTRACTS.ORACLE as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'dieselUgxPerLitre',
  });
  const { writeContract, isPending } = useWriteContract();

  const handleUpdate = () => {
    const val = parseFloat(price);
    if (isNaN(val) || val <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    writeContract({
      address: CONTRACTS.ORACLE as `0x${string}`,
      abi: ORACLE_ABI,
      functionName: 'update',
      args: [BigInt(Math.floor(val))],
    });
    toast.success('Update transaction sent');
    setTimeout(() => refetch(), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8 space-y-4">
        <h1 className="text-3xl font-bold text-ocean-navy">Settings</h1>
        {currentPrice && (
          <p className="text-dusk-gray">Current price: UGX {Number(currentPrice).toLocaleString()}</p>
        )}
        <Input
          label="Diesel price (UGX/litre)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="5000"
        />
        <Button onClick={handleUpdate} loading={isPending}>Update Diesel Price</Button>
      </div>
      <BottomNav />
    </div>
  );
}
